import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { inlineScriptHashes, withScriptHashes } from '../../scripts/content-security.ts';

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
