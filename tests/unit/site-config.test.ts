import assert from 'node:assert/strict';
import { test } from 'node:test';
import { siteConfig } from '../../src/config/site.ts';

test('deployment requires an HTTPS origin and allows the authorized production domain', () => {
  assert.equal(siteConfig(undefined, false).origin, 'http://127.0.0.1:4322');
  assert.equal(
    siteConfig('https://preview.example.org/', true).origin,
    'https://preview.example.org',
  );
  assert.equal(siteConfig('https://vibes.college', true).origin, 'https://vibes.college');
  for (const value of [
    undefined,
    'http://example.org',
    'http://127.0.0.1:4322',
    'https://a:b@example.org',
    'https://example.org/path',
    'https://example.org/?q=a',
    'https://example.org/#x',
    'not a URL',
  ])
    assert.throws(() => siteConfig(value, true));
});
