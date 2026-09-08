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

test('only an assistant build adds the fixed TLS relay and all other policy remains unchanged', async () => {
  const { withAssistantConnections } = await import('../../scripts/content-security.ts');
  const policy = "script-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'";
  assert.equal(withAssistantConnections(policy, false), policy);
  const enabled = withAssistantConnections(policy, true);
  assert.equal(
    enabled,
    policy.replace("connect-src 'self';", "connect-src 'self' wss://relay.paseo.sh;"),
  );
  assert.throws(() => withAssistantConnections('connect-src *;', true), /reviewed/);
  assert.throws(() => withAssistantConnections(policy + '; ' + policy, true), /reviewed/);
});
