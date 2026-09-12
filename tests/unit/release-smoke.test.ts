import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { preflightRelease } from '../../scripts/release-preflight.ts';
import { smokeRelease } from '../../scripts/release-smoke.ts';
import { prepareArtifact } from '../../scripts/release-artifact.ts';
import { withPaseoRuntime } from '../../scripts/content-security.ts';
import { withPaseoPreview, paseoPreviewHtml } from '../../scripts/paseo-webui-preview.ts';

const sha = 'a'.repeat(40);
const integrity = (value: string) =>
  'sha256-' + createHash('sha256').update(value).digest('base64');

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'vibes-production-smoke-'));
  const basePath = '/vendor/paseo/' + 'b'.repeat(16);
  const script = 'console.log("Paseo fixture")';
  const css = 'body { color: green; }';
  const config = {
    version: 1,
    basePath,
    script: { url: basePath + '/app.js', integrity: integrity(script) },
    styles: [{ url: basePath + '/app.css', integrity: integrity(css) }],
  };
  const html =
    '<!doctype html><html><head><title>Vibes</title></head><body><main>Vibes fixture for release acceptance</main><section data-paseo-config="' +
    JSON.stringify(config).replaceAll('"', '&quot;') +
    '"></section></body></html>';
  for (const path of ['zh', 'en', basePath.slice(1), 'paseo-preview'])
    mkdirSync(join(directory, path), { recursive: true });
  for (const path of ['index.html', 'zh/index.html', 'en/index.html'])
    writeFileSync(join(directory, path), html);
  writeFileSync(join(directory, basePath, 'app.js'), script);
  writeFileSync(join(directory, basePath, 'app.css'), css);
  writeFileSync(join(directory, 'paseo-preview/index.html'), paseoPreviewHtml());
  writeFileSync(
    join(directory, '_headers'),
    withPaseoPreview(withPaseoRuntime(readFileSync('public/_headers', 'utf8'))),
  );
  prepareArtifact(sha, directory);
  return {
    directory,
    basePath,
    config,
    html,
    remove: () => rmSync(directory, { recursive: true, force: true }),
  };
}

test('production preflight binds bilingual pages, strict policies, native SRI assets and sandbox carrier', () => {
  const f = fixture();
  try {
    const expected = preflightRelease(f.directory);
    assert.equal(expected.responses.length, 5);
    assert.ok(expected.responses.some((item) => item.path === '/paseo-preview/'));
    writeFileSync(join(f.directory, f.basePath, 'app.js'), 'damaged');
    assert.throws(() => preflightRelease(f.directory), /integrity|SRI/i);
  } finally {
    f.remove();
  }
});

test('preflight rejects unsafe parent policies, missing carrier, config drift and unsafe paths', () => {
  const mutations: ((f: ReturnType<typeof fixture>) => void)[] = [
    (f) => {
      const p = join(f.directory, '_headers');
      writeFileSync(
        p,
        readFileSync(p, 'utf8').replace("script-src 'self'", "script-src 'self' 'unsafe-eval'"),
      );
    },
    (f) => rmSync(join(f.directory, 'paseo-preview/index.html')),
    (f) =>
      writeFileSync(
        join(f.directory, 'en/index.html'),
        f.html.replace(f.basePath, '/vendor/paseo/' + 'c'.repeat(16)),
      ),
    (f) =>
      writeFileSync(join(f.directory, 'zh/index.html'), f.html.replace('/app.js', '/../app.js')),
  ];
  for (const mutate of mutations) {
    const f = fixture();
    try {
      mutate(f);
      assert.throws(() => preflightRelease(f.directory));
    } finally {
      f.remove();
    }
  }
});

test('online smoke checks actual SHA/digest, response bytes, CSP, asset MIME and cache policy', async () => {
  const f = fixture();
  try {
    const expected = preflightRelease(f.directory);
    const fetcher = async (url: string) => {
      const path = new URL(url).pathname;
      if (path === '/__release.json')
        return new Response(readFileSync(join(f.directory, '__release.json')), {
          headers: { 'Content-Type': 'application/json' },
        });
      const item = expected.responses.find((response) => response.path === path);
      assert.ok(item, `Unexpected network path: ${path}`);
      const headers = Object.fromEntries(
        Object.entries(item.headers).filter(
          (entry): entry is [string, string] => entry[1] !== null,
        ),
      );
      headers['content-type'] = item.contentType;
      return new Response(
        readFileSync(join(f.directory, path, path.endsWith('/') ? 'index.html' : '')),
        { headers },
      );
    };
    await smokeRelease('https://example.test', sha, expected, { fetcher, attempts: 1 });
    for (const kind of ['sha', 'digest', 'csp', 'bytes', 'mime', 'cache']) {
      await assert.rejects(
        smokeRelease('https://example.test', sha, expected, {
          attempts: 1,
          fetcher: async (url) => {
            const response = await fetcher(url);
            const path = new URL(url).pathname;
            if (path === '/__release.json' && ['sha', 'digest'].includes(kind)) {
              const value = (await response.json()) as Record<string, string>;
              value[kind] = 'wrong';
              return Response.json(value);
            }
            if (kind === 'csp' && path === '/zh/')
              response.headers.delete('content-security-policy');
            if (path.endsWith('.js')) {
              if (kind === 'bytes') return new Response('changed', { headers: response.headers });
              if (kind === 'mime') response.headers.set('content-type', 'text/html');
              if (kind === 'cache') response.headers.set('cache-control', 'no-store');
            }
            return response;
          },
        }),
        kind,
      );
    }
  } finally {
    f.remove();
  }
});
