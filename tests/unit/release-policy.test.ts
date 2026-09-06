import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requireReleaseChecks } from '../../scripts/release-policy.ts';

test('release requires successful completed verify and budget for the exact commit', () => {
  const sha = 'a'.repeat(40);
  const checks = ['verify', 'budget'].map((name) => ({
    name,
    head_sha: sha,
    conclusion: 'success',
    status: 'completed',
  }));
  assert.doesNotThrow(() => requireReleaseChecks(sha, checks));
  assert.throws(() => requireReleaseChecks(sha, checks.slice(0, 1)));
  assert.throws(() => requireReleaseChecks('b'.repeat(40), checks));
  for (const failed of [{ conclusion: 'failure' }, { conclusion: null }, { status: 'in_progress' }])
    assert.throws(() => requireReleaseChecks(sha, [{ ...checks[0], ...failed }, checks[1]]));
});
