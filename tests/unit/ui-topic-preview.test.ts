import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resources } from '../../src/features/ui-topic/catalog.ts';
import { secureUiTopicPreviews, uiPreviewPolicy } from '../../scripts/ui-topic-preview.ts';
import { inlineScriptHashes, writeContentSecurity } from '../../scripts/content-security.ts';

test('fixed preview hashes and HTTP sandbox apply only to its canonical response', () => {
  const root = mkdtempSync(join(tmpdir(), 'ui-topic-policy-'));
  try {
    cpSync('public/ui-topic/previews', join(root, 'ui-topic/previews'), { recursive: true });
    writeFileSync(join(root, '_headers'), readFileSync('public/_headers'));
    writeFileSync(join(root, 'index.html'), '<script>const parentOnly = true;</script>');
    writeContentSecurity(root);
    secureUiTopicPreviews(root);
    const headers = readFileSync(join(root, '_headers'), 'utf8');
    const parent = headers.split('/ui-topic/previews/')[0];
    assert.match(parent, /frame-src 'self' https:/);
    assert.match(parent, /frame-ancestors 'none'/);
    assert.doesNotMatch(parent, /script-src[^;]*'unsafe-(?:inline|eval)'/);
    for (const resource of resources) {
      const html = readFileSync(join(root, resource.previewSrc, 'index.html'), 'utf8');
      const rule = headers.split(`${resource.previewSrc}\n`)[1].split('\n\n')[0];
      assert.ok(rule.includes(uiPreviewPolicy(html)));
      assert.match(rule, /sandbox allow-scripts; frame-ancestors 'self'/);
      assert.match(rule, /connect-src 'none'; form-action 'none'/);
      assert.match(rule, /! X-Frame-Options/);
      for (const hash of inlineScriptHashes(html)) {
        assert.ok(rule.includes(hash));
        assert.ok(!parent.includes(hash));
      }
      assert.doesNotMatch(html, /script-src 'unsafe-inline'/);
      assert.doesNotMatch(html, /<meta[^>]+sandbox/);
    }
    mkdirSync(join(root, 'ui-topic/previews/unreviewed'));
    assert.throws(() => secureUiTopicPreviews(root), /inventory/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('extra scripts, event attributes and missing controller are rejected', () => {
  assert.throws(
    () => uiPreviewPolicy('<script src="https://other.test/a.js"></script>'),
    /reviewed/,
  );
  assert.throws(() => uiPreviewPolicy('<script>a()</script><script>b()</script>'), /reviewed/);
  assert.throws(
    () => uiPreviewPolicy('<button onclick="a()"></button><script>a()</script>'),
    /reviewed/,
  );
  assert.throws(() => uiPreviewPolicy('<p>no controller</p>'), /reviewed/);
  const html = '<script>window.example = 1;</script>';
  assert.notEqual(uiPreviewPolicy(html), uiPreviewPolicy(html.replace('1', '2')));
});
