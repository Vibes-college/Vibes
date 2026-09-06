import assert from 'node:assert/strict';
import { test } from 'node:test';
import { siteConfig } from '../../src/config/site.ts';

test('deployment requires a dedicated HTTPS origin and cannot silently use localhost or the old domain', () => {
  assert.equal(siteConfig(undefined, false).origin, 'http://127.0.0.1:4322');
  assert.equal(
    siteConfig('https://preview.example.org/', true).origin,
    'https://preview.example.org',
  );
  for (const value of [
    undefined,
    'http://example.org',
    'http://127.0.0.1:4322',
    'https://vibes.college',
    'https://www.vibes.college',
    'https://a:b@example.org',
    'https://example.org/path',
    'https://example.org/?q=a',
    'https://example.org/#x',
    'not a URL',
  ])
    assert.throws(() => siteConfig(value, true));
});
