import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mermaidSandboxHashes } from '../../scripts/paseo-webui-sandbox.ts';

test('Mermaid sandbox authorization hashes exact decoded script bytes without evaluating the generator', () => {
  const body = 'window.parent.postMessage("bridgeReady", "*");\n';
  const source = `// Generated\nexport const mermaidRuntimeHtml = ${JSON.stringify(`<script>${body}</script>`)};\n`;
  assert.deepEqual(mermaidSandboxHashes(source), [
    `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
  ]);
  assert.throws(
    () => mermaidSandboxHashes('export const mermaidRuntimeHtml = (() => "<script>x</script>")();'),
    /format/,
  );
  assert.throws(
    () =>
      mermaidSandboxHashes('export const mermaidRuntimeHtml = "<script src=remote.js></script>";'),
    /one fixed/,
  );
  assert.throws(
    () =>
      mermaidSandboxHashes(
        'export const mermaidRuntimeHtml = "<script>a</script><script>b</script>";',
      ),
    /one fixed/,
  );
});
