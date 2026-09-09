import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureHeadersForPath, parseFixtureHeaders } from '../fixtures/paseo-webui/headers.ts';

const rules = parseFixtureHeaders(`/*
  Content-Security-Policy: default-src 'self'; frame-ancestors 'none'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/zh/*
  Cache-Control: public, max-age=60
/paseo-preview/*
  ! Content-Security-Policy
  ! X-Frame-Options
  ! Cache-Control
  Content-Security-Policy: default-src 'none'; sandbox allow-scripts
  Cache-Control: no-store
  Referrer-Policy: no-referrer
`);

test('fixture applies the independent preview policy to the document route only', () => {
  for (const path of ['/paseo-preview/', '/paseo-preview/index.html']) {
    const headers = fixtureHeadersForPath(rules, path, { 'Content-Type': 'text/html' });
    assert.equal(headers['content-security-policy'], "default-src 'none'; sandbox allow-scripts");
    assert.equal(headers['x-frame-options'], undefined);
    assert.equal(headers['cache-control'], 'no-store');
    assert.equal(headers['x-content-type-options'], 'nosniff');
    assert.equal(headers['content-type'], 'text/html');
  }
  const normal = fixtureHeadersForPath(rules, '/zh/works/example/');
  assert.equal(normal['content-security-policy'], "default-src 'self'; frame-ancestors 'none'");
  assert.equal(normal['x-frame-options'], 'DENY');
  assert.equal(normal['cache-control'], 'public, max-age=60');
  assert.equal(fixtureHeadersForPath(rules, '/paseo-previewing/')['x-frame-options'], 'DENY');
});

test('fixture combines matching headers and removes before setting within a rule', () => {
  assert.equal(
    fixtureHeadersForPath(rules, '/paseo-preview/')['referrer-policy'],
    'strict-origin-when-cross-origin, no-referrer',
  );
  const sameRule = parseFixtureHeaders('/*\n  X-Test: replacement\n  ! x-test');
  assert.equal(
    fixtureHeadersForPath(sameRule, '/', { 'X-Test': 'original' })['x-test'],
    'replacement',
  );
});

test('fixture rejects unsupported header formats instead of serving misleading policies', () => {
  for (const source of [
    '',
    '  X-Test: missing-path',
    'https://example.com/*\n  X-Test: unsupported-host',
    '/:locale/*\n  X-Test: unsupported-placeholder',
    '/*\n  ! x-test: invalid-removal',
  ])
    assert.throws(() => parseFixtureHeaders(source));
});
