import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { requireProductionPreparation } from '../../scripts/paseo-webui-build.ts';
import { ciNodeVersion, fullSteps } from '../../scripts/ci-acceptance-policy.ts';

const workflow = readFileSync('.github/workflows/check.yml', 'utf8');

test('the actual budget gate rejects skipped, absent, failed and wrong-scope results', () => {
  const job = workflow.split('\n  budget:\n')[1].split('\n  draft-check:\n')[0];
  const block = job.match(/ {8}run: \|\n([\s\S]+?) {8}env:\n/)?.[1];
  assert.ok(block, 'The protected budget gate must have an executable result check');
  const script = block
    .split('\n')
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n');
  const base = {
    SCOPE_RESULT: 'success',
    CHECK_MODE: 'required',
    CHECK_SCOPE: 'full',
    VERIFY_RESULT: 'success',
    BUDGET_RESULT: 'passed',
  };
  const run = (env: Record<string, string>) =>
    spawnSync('bash', ['-e', '-c', script], { env: { ...process.env, ...env } }).status;
  assert.equal(run(base), 0);
  for (const scope of ['docs', 'tools'])
    assert.equal(run({ ...base, CHECK_SCOPE: scope, BUDGET_RESULT: 'not-applicable' }), 0);
  for (const change of [
    { SCOPE_RESULT: 'failure' },
    { CHECK_MODE: 'draft' },
    { CHECK_SCOPE: '' },
    { VERIFY_RESULT: 'failure' },
    { VERIFY_RESULT: 'skipped' },
    { VERIFY_RESULT: 'cancelled' },
    { BUDGET_RESULT: '' },
    { BUDGET_RESULT: 'not-applicable' },
    { CHECK_SCOPE: 'docs', BUDGET_RESULT: 'passed' },
  ])
    assert.notEqual(run({ ...base, ...change }), 0, JSON.stringify(change));
});

test('native test preparation cannot be skipped by ordinary PR or local invocations', () => {
  const env = {
    CI: 'true',
    GITHUB_ACTIONS: 'true',
    GITHUB_EVENT_NAME: 'push',
    GITHUB_REF: 'refs/heads/main',
    CI_ACCEPTANCE_REUSED: 'true',
  };
  assert.doesNotThrow(() => requireProductionPreparation(env));
  for (const key of Object.keys(env))
    assert.throws(() => requireProductionPreparation({ ...env, [key]: '' }));
  assert.throws(() => requireProductionPreparation({ ...env, GITHUB_EVENT_NAME: 'pull_request' }));
  assert.throws(() =>
    requireProductionPreparation({ ...env, GITHUB_REF: 'refs/heads/codex/test' }),
  );
});

test('full acceptance keeps one native preparation and an exact-attempt proof after all checks', () => {
  assert.equal(workflow.match(/run: npm run paseo:ci\n/g)?.length, 1);
  for (const name of fullSteps) assert.equal(workflow.split(`name: ${name}\n`).length - 1, 1);
  assert.ok(
    workflow.indexOf('name: Record full PR acceptance') >
      workflow.indexOf('name: Build and check resource budget'),
  );
  assert.ok(workflow.includes('name: acceptance-${{ github.run_id }}-${{ github.run_attempt }}'));
  assert.ok(workflow.includes('CI_FULL_VERIFIED: ${{ steps.regression_full.outcome }}'));
  assert.ok(workflow.includes('CI_NATIVE_VERIFIED: ${{ steps.native_full.outcome }}'));
  assert.ok(workflow.includes('CI_BUDGET_PASSED: ${{ steps.resource_budget.outcome }}'));
  assert.equal(
    new Set([...workflow.matchAll(/node-version: ([\d.]+)/g)].map((match) => match[1])).size,
    1,
  );
  assert.ok(workflow.includes(`node-version: ${ciNodeVersion}`));
  const beforeDeploy = workflow.split('\n  deploy:\n')[0];
  assert.ok(!beforeDeploy.includes('CLOUDFLARE_API_TOKEN'));
});

test('content cache miss falls back to full and content remains a real budget gate', () => {
  const block = workflow.match(
    /name: Resolve verification lane[\s\S]+?run: \|\n([\s\S]+?) {8}env:\n/,
  )?.[1];
  assert.ok(block);
  const script = block
    .split('\n')
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n');
  const directory = mkdtempSync(join(tmpdir(), 'vibes-lane-'));
  const output = join(directory, 'output');
  try {
    for (const [scope, hit, expected] of [
      ['content', 'true', 'content'],
      ['content', '', 'full'],
      ['content', 'false', 'full'],
      ['full', 'true', 'full'],
      ['docs', '', 'docs'],
    ]) {
      const run = spawnSync('bash', ['-e', '-c', script], {
        env: {
          ...process.env,
          SCOPE: scope,
          CACHE_HIT: hit,
          GITHUB_OUTPUT: output,
          GITHUB_STEP_SUMMARY: '/dev/null',
        },
        encoding: 'utf8',
      });
      assert.equal(run.status, 0, run.stderr);
      assert.ok(readFileSync(output, 'utf8').endsWith(`scope=${expected}\n`));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  assert.ok(workflow.includes('full|content) test "$BUDGET_RESULT" = passed'));
  assert.ok(
    workflow.includes(
      "if: github.event_name == 'push' && github.ref == 'refs/heads/main' && steps.lane.outputs.scope == 'full'",
    ),
  );
  assert.ok(workflow.includes('CONTENT_BASE_REF: ${{ needs.scope.outputs.base }}'));
});
