import {
  normalizeHeader,
  sri,
  type ReleaseExpectations,
  type ReleaseResponse,
} from './release-preflight.ts';

interface SmokeOptions {
  fetcher?: (url: string, options?: RequestInit) => Promise<Response>;
  attempts?: number;
}

function validResource(item: ReleaseResponse): void {
  const page = ['/zh/', '/en/', '/paseo-preview/'].includes(item.path);
  const asset =
    /^\/vendor\/paseo\/[a-f0-9]{16}\/[A-Za-z0-9_./-]+\.(js|css)$/.test(item.path) &&
    !item.path.split('/').some((part) => part === '.' || part === '..');
  if ((!page && !asset) || !/^sha256-[A-Za-z0-9+/]{43}=$/.test(item.integrity) || item.bytes <= 0)
    throw new Error('Invalid production smoke resource');
}

async function verifyResponse(response: Response, expected: ReleaseResponse): Promise<void> {
  if (!response.ok || response.redirected)
    throw new Error(`Live resource failed: ${expected.path}`);
  const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  const matches =
    expected.contentType === 'application/javascript'
      ? ['application/javascript', 'text/javascript'].includes(type || '')
      : type === expected.contentType;
  if (!matches) throw new Error(`Live resource MIME differs: ${expected.path}`);
  for (const [name, value] of Object.entries(expected.headers)) {
    const actual = response.headers.get(name);
    if (
      value === null
        ? actual !== null
        : actual === null || normalizeHeader(name, actual) !== normalizeHeader(name, value)
    )
      throw new Error(`Live ${name} differs: ${expected.path}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== expected.bytes || sri(bytes) !== expected.integrity)
    throw new Error(`Live resource integrity differs: ${expected.path}`);
}

// New production runs verify their exact artifact. Legacy preview/rollback callers
// keep their existing SHA + bilingual-page checks when no artifact is available.
export async function smokeRelease(
  origin: string,
  sha: string,
  expected?: ReleaseExpectations,
  options: SmokeOptions = {},
): Promise<void> {
  const target = new URL(origin);
  if (
    target.origin !== origin ||
    !['http:', 'https:'].includes(target.protocol) ||
    !/^[a-f0-9]{40}$/.test(sha)
  )
    throw new Error('Invalid release smoke target');
  if (expected) {
    if (
      !/^[a-f0-9]{64}$/.test(expected.digest) ||
      expected.responses.length < 2 ||
      expected.responses.length > 24
    )
      throw new Error('Invalid release smoke expectations');
    expected.responses.forEach(validResource);
  }
  const fetcher = options.fetcher ?? fetch;
  const attempts = options.attempts ?? 6;
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 6)
    throw new Error('Invalid smoke attempt count');
  let error: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const marker = await fetcher(`${origin}/__release.json?t=${Date.now()}`, {
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
      });
      const record = (await marker.json()) as { sha?: string; digest?: string };
      if (!marker.ok || record.sha !== sha || (expected && record.digest !== expected.digest))
        throw new Error('Live deployment SHA mismatch');
      if (expected) {
        for (const item of expected.responses) {
          const response = await fetcher(`${origin}${item.path}`, {
            signal: AbortSignal.timeout(15000),
            cache: 'no-store',
            redirect: 'error',
          });
          await verifyResponse(response, item);
        }
        return;
      }
      for (const locale of ['zh', 'en']) {
        const page = await fetcher(`${origin}/${locale}/`, { signal: AbortSignal.timeout(10000) });
        const body = await page.text();
        if (!page.ok || !body.includes('<html') || !body.includes('Vibes'))
          throw new Error(`Live ${locale} page failed`);
      }
      return;
    } catch (cause) {
      error = cause;
      if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
  throw error;
}
