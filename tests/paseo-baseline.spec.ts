import { test, expect } from './browser-test.ts';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const baselineUrl = process.env.PASEO_BASELINE_URL;
if (baselineUrl && !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(baselineUrl))
  throw new Error('PASEO_BASELINE_URL must select the same-version local B0 experiment daemon.');
test.skip(!baselineUrl, 'Requires the preserved B0 export and same-version local daemon.');
test.use({ baseURL: baselineUrl });

test('record the preserved standalone B0 initial request inventory', async ({ page }, testInfo) => {
  const receipt = JSON.parse(
    readFileSync('.scratch/paseo-webui/artifacts/B0/build-receipt.json', 'utf8'),
  );
  const expected = new Map<string, string>(
    receipt.files.map((file: { path: string; sha256: string }) => ['/' + file.path, file.sha256]),
  );
  const requests: object[] = [];
  const pending: Promise<void>[] = [];
  const scriptPaths = new Set<string>();
  const pageErrors: string[] = [];
  let sockets = 0;
  page.on('pageerror', () => pageErrors.push('page-error'));
  page.on('websocket', () => sockets++);
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    requests.push({ path: url.pathname, type: request.resourceType(), failed: true });
  });
  page.on('requestfinished', (request) => {
    pending.push(
      (async () => {
        const url = new URL(request.url());
        const sameOrigin = url.origin === new URL(baselineUrl!).origin;
        const response = await request.response();
        if (!response) throw new Error('Finished request has no response.');
        let bodySha256: string | undefined;
        if (sameOrigin && request.resourceType() === 'script') {
          expect(expected.has(url.pathname), 'Only preserved B0 scripts may load').toBe(true);
          bodySha256 = createHash('sha256')
            .update(await response.body())
            .digest('hex');
          expect(bodySha256).toBe(expected.get(url.pathname));
          scriptPaths.add(url.pathname);
        }
        requests.push({
          path: url.pathname,
          origin: sameOrigin ? 'same-origin' : url.origin,
          type: request.resourceType(),
          status: response.status(),
          bodySha256,
          sizes: await request.sizes(),
          timing: request.timing(),
        });
      })(),
    );
  });
  await page.goto('/');
  await expect(page.locator('#root button').first()).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => sockets).toBe(1);
  await page.waitForLoadState('networkidle');
  await Promise.all(pending);
  expect(scriptPaths.size).toBeGreaterThan(0);
  expect(pageErrors).toEqual([]);
  const target = join('resources/evidence/012-paseo-webui-loading/baseline', testInfo.project.name);
  mkdirSync(target, { recursive: true });
  writeFileSync(
    join(
      target,
      existsSync(join(target, 'initial-requests.json'))
        ? `initial-requests-${Date.now()}.json`
        : 'initial-requests.json',
    ),
    JSON.stringify(
      {
        schemaVersion: 1,
        profile: 'B0',
        source: receipt.source.commit,
        lockSha256: receipt.source.lockfile.sha256,
        browser: testInfo.project.name,
        scenario:
          'Fresh browser context; standalone root until native controls and network idle. One observational sample, not a performance comparison.',
        requests,
        sockets,
        queryStringsAndHeadersOmitted: true,
      },
      null,
      2,
    ) + '\n',
  );
});
