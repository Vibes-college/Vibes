import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { reusedDemoSource } from '../../scripts/great-ui-reuse.ts';

const sha = 'a'.repeat(40);
const environment = {
  CI: 'true',
  GITHUB_ACTIONS: 'true',
  GITHUB_EVENT_NAME: 'push',
  GITHUB_REF: 'refs/heads/main',
  GITHUB_REPOSITORY: 'Vibes-college/Vibes',
  GITHUB_SHA: sha,
  CI_ACCEPTANCE_REUSED: 'true',
  CI_ACCEPTANCE_RUN: '123',
  CI_ACCEPTANCE_ATTEMPT: '2',
};

test('demo coverage carries the exact trusted PR run and does not claim a fresh test', () => {
  const source = reusedDemoSource(environment, { sha, clean: true });
  assert.equal(source.kind, 'reused-full-pr');
  assert.equal(source.mainSha, sha);
  assert.equal(
    source.reference,
    'https://github.com/Vibes-college/Vibes/actions/runs/123/attempts/2',
  );
});

test('local, draft, different, dirty and fixture checkouts cannot rebuild a demo receipt', () => {
  const invoke = (change: NodeJS.ProcessEnv) =>
    reusedDemoSource({ ...environment, ...change }, { sha, clean: true });
  for (const key of Object.keys(environment)) assert.throws(() => invoke({ [key]: '' }), key);
  for (const change of [
    { GITHUB_EVENT_NAME: 'pull_request' },
    { GITHUB_REF: 'refs/heads/codex/test' },
    { GITHUB_REPOSITORY: 'other/Vibes' },
    { GITHUB_SHA: 'b'.repeat(40) },
    { CI_ACCEPTANCE_RUN: '-1' },
    { CI_ACCEPTANCE_RUN: '1.5' },
    { CI_ACCEPTANCE_ATTEMPT: 'NaN' },
    { VIBES_CONTENT_DIR: '.scratch/fixture' },
    { VIBES_TAXONOMY_FILE: '.scratch/taxonomy.json' },
    { VIBES_OUT_DIR: '.scratch/output' },
  ])
    assert.throws(() => invoke(change));
  assert.throws(() => reusedDemoSource(environment, { sha, clean: false }));
});

test('the workflow restores site coverage only in the trusted reuse lane before building', () => {
  const workflow = readFileSync('.github/workflows/check.yml', 'utf8');
  const step = workflow.split('name: Restore learning demo coverage')[1].split('\n      - ')[0];
  assert.match(step, /needs.scope.outputs.acceptance == 'reuse'/);
  assert.match(step, /CI_ACCEPTANCE_RUN: \$\{\{ needs.scope.outputs.acceptance_run \}\}/);
  assert.match(step, /CI_ACCEPTANCE_ATTEMPT: \$\{\{ needs.scope.outputs.acceptance_attempt \}\}/);
  assert.ok(
    workflow.indexOf('name: Restore learning demo coverage') <
      workflow.indexOf('name: Build and check resource budget'),
  );
});
