import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  inlineScriptHashes,
  withScriptHashes,
  withPaseoRuntime,
  writeContentSecurity,
} from '../../scripts/content-security.ts';

test('CSP hashes exact inline executable bytes, not external scripts or data', () => {
  const body = ' self.Astro = {};\n';
  const html = `<script>${body}</script><script type="module">${body}</script><script src="/a.js">ignored</script><script type="application/ld+json">{}</script>`;
  const expected = `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
  assert.deepEqual(inlineScriptHashes(html), [expected]);
  assert.notDeepEqual(inlineScriptHashes(`<script>${body.trim()}</script>`), [expected]);
});

test('CSP adds exact hashes without relaxing origins, eval, style or framing rules', () => {
  const source =
    "/*\n  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'\n";
  const hash = "'sha256-example'";
  assert.equal(
    withScriptHashes(source, [hash, hash]),
    source.replace("'wasm-unsafe-eval'", `'wasm-unsafe-eval' ${hash}`),
  );
  assert.equal(withScriptHashes(source, []), source);
  assert.throws(
    () => withScriptHashes("script-src 'unsafe-inline';", [hash]),
    /reviewed same-origin/,
  );
});

test('native runtime policy allows manual host transports and plugin blobs with scoped directives', () => {
  const headers = readFileSync('public/_headers', 'utf8');
  const result = withPaseoRuntime(withScriptHashes(headers, ["'sha256-example'"]));
  assert.match(result, /connect-src 'self' ws: wss: http: https: data: blob:;/);
  assert.match(result, /script-src 'self' 'wasm-unsafe-eval' blob: 'sha256-example';/);
  assert.match(result, /img-src 'self' data: blob: https:;/);
  assert.match(result, /worker-src 'self';/);
  assert.doesNotMatch(result, /script-src[^;]*'unsafe-eval'/);
  assert.doesNotMatch(result, /script-src[^;]*'unsafe-inline'/);
  for (const name of [
    'default-src',
    'style-src',
    'font-src',
    'media-src',
    'frame-src',
    'frame-ancestors',
    'base-uri',
    'form-action',
  ]) {
    const directive = new RegExp(`${name} [^;\\n]*`);
    assert.equal(result.match(directive)?.[0], headers.match(directive)?.[0]);
  }
  assert.throws(() => withPaseoRuntime('connect-src *;'), /reviewed same-origin/);
});

test('generated enabled policy differs from the strict disabled comparison without authorizing carrier scripts globally', () => {
  const directory = mkdtempSync(join(tmpdir(), 'paseo-csp-'));
  try {
    const headers = readFileSync('public/_headers', 'utf8');
    writeFileSync(join(directory, 'index.html'), '<script>const ordinary = 1;</script>');
    const render = (assistant: boolean) => {
      writeFileSync(join(directory, '_headers'), headers);
      writeContentSecurity(directory, [], assistant);
      return readFileSync(join(directory, '_headers'), 'utf8');
    };
    const disabled = render(false);
    assert.match(disabled, /connect-src 'self';/);
    assert.doesNotMatch(disabled, /script-src[^;]*blob:/);
    assert.doesNotMatch(disabled, /\/paseo-preview\//);
    const enabled = render(true);
    const [main, carrier] = enabled.split('/paseo-preview/*');
    assert.match(main, /connect-src 'self' ws: wss: http: https: data: blob:;/);
    assert.match(main, /script-src 'self' 'wasm-unsafe-eval' blob: 'sha256-/);
    assert.doesNotMatch(main, /script-src[^;]*'unsafe-(?:inline|eval)'/);
    assert.match(carrier, /connect-src 'none'/);
    assert.match(carrier, /sandbox allow-scripts/);
    assert.match(carrier, /! Referrer-Policy\n/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
