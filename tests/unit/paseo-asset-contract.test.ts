import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePaseoAssetConfig } from '../../src/features/paseo-webui/asset-contract.ts';
const prefix = '/vendor/paseo/0123456789abcdef';
const integrity = 'sha256-' + 'A'.repeat(43) + '=';
const config = () => ({
  version: 1,
  basePath: prefix,
  script: { url: prefix + '/_expo/index.js', integrity },
  styles: [{ url: prefix + '/style.css', integrity }],
});
test('native resource contract rejects extra fields and returns an independent copy', () => {
  const source = config();
  assert.equal(
    parsePaseoAssetConfig({ ...source, script: { ...source.script, secret: 'reject' } }),
    null,
  );
  assert.equal(parsePaseoAssetConfig({ ...source, unknown: true }), null);
  const parsed = parsePaseoAssetConfig(source);
  assert.deepEqual(parsed, source);
  source.script.url = '/changed.js';
  assert.equal(parsed?.script.url, prefix + '/_expo/index.js');
});
test('native resource contract rejects external, normalized and malformed paths', () => {
  for (const url of [
    'https://example.com/a.js',
    prefix + '/%2e%2e/a.js',
    prefix + '/a/../b.js',
    prefix + '/./a.js',
    prefix + '//a.js',
    prefix + '/a.js?q=1',
    prefix + '/a\\b.js',
    prefix + '/a.js\n',
    prefix + '/a.css',
  ]) {
    assert.equal(parsePaseoAssetConfig({ ...config(), script: { url, integrity } }), null, url);
  }
  for (const value of [
    null,
    [],
    { ...config(), basePath: [prefix] },
    { ...config(), script: { url: prefix + '/a.js', integrity: [integrity] } },
    { ...config(), styles: Array(21).fill(config().styles[0]) },
  ]) {
    assert.equal(parsePaseoAssetConfig(value), null);
  }
});

test('native resource classification refuses unknown executable formats', async () => {
  const { paseoResourceKind } = await import('../../src/features/paseo-webui/asset-contract.ts');
  assert.equal(paseoResourceKind('_expo/index.js'), 'script');
  assert.equal(paseoResourceKind('assets/worker.wasm'), 'wasm');
  assert.equal(paseoResourceKind('assets/font.woff2'), 'font');
  assert.throws(() => paseoResourceKind('hidden.mjs'), /Unclassified/);
  assert.throws(() => paseoResourceKind('unknown.bin'), /Unclassified/);
});
