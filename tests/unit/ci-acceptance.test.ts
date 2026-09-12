import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  requireAcceptance,
  fullSteps,
  type AcceptanceProof,
} from '../../scripts/ci-acceptance-policy.ts';
import { resolveAcceptance } from '../../scripts/ci-acceptance-resolver.ts';

const mainSha = 'a'.repeat(40);
const headSha = 'b'.repeat(40);
const checkoutSha = 'c'.repeat(40);
const treeSha = 'd'.repeat(40);
const baseSha = 'e'.repeat(40);

function proof(): AcceptanceProof {
  return {
    repositoryId: 42,
    repository: 'Vibes-college/Vibes',
    mainSha,
    treeSha,
    pr: {
      number: 13,
      merged: true,
      draft: false,
      merge_commit_sha: mainSha,
      head: { sha: headSha, repo: { id: 42 } },
      base: { ref: 'main', repo: { id: 42 } },
    },
    run: {
      id: 100,
      run_attempt: 2,
      status: 'completed',
      conclusion: 'success',
      event: 'pull_request',
      path: '.github/workflows/check.yml',
      head_sha: headSha,
      repository: { id: 42 },
      head_repository: { id: 42 },
      pull_requests: [{ number: 13, head: { sha: headSha } }],
    },
    jobs: [
      {
        name: 'verify',
        conclusion: 'success',
        run_attempt: 2,
        steps: fullSteps.map((name) => ({ name, conclusion: 'success' })),
      },
      { name: 'budget', conclusion: 'success', run_attempt: 2, steps: [] },
    ],
    artifact: {
      id: 200,
      name: 'acceptance-100-2',
      expired: false,
      size_in_bytes: 1024,
      workflow_run: { id: 100, head_sha: headSha, head_repository_id: 42 },
    },
    record: {
      schema: 1,
      coverage: 'full',
      repositoryId: 42,
      headRepositoryId: 42,
      repository: 'Vibes-college/Vibes',
      pr: 13,
      runId: 100,
      runAttempt: 2,
      headSha,
      baseSha,
      checkoutSha,
      treeSha,
      nodeVersion: '22.20.0',
      workflowPath: '.github/workflows/check.yml',
      draft: false,
    },
    checkout: {
      sha: checkoutSha,
      tree: { sha: treeSha },
      parents: [{ sha: baseSha }, { sha: headSha }],
    },
  };
}

test('a successful full PR proves the exact tree even when the final squash SHA differs', () => {
  assert.doesNotThrow(() => requireAcceptance(proof()));
});

test('identity, scope, attempt, tree, fork and incomplete checks cannot establish acceptance', () => {
  const mutations: ((value: AcceptanceProof) => void)[] = [
    (p) => {
      p.treeSha = 'f'.repeat(40);
    },
    (p) => {
      p.pr.merged = false;
    },
    (p) => {
      p.pr.draft = true;
    },
    (p) => {
      p.pr.merge_commit_sha = headSha;
    },
    (p) => {
      p.pr.head.repo.id = 99;
    },
    (p) => {
      p.pr.base.ref = 'other';
    },
    (p) => {
      p.run.event = 'workflow_dispatch';
    },
    (p) => {
      p.run.status = 'in_progress';
    },
    (p) => {
      p.run.conclusion = 'failure';
    },
    (p) => {
      p.run.head_sha = baseSha;
    },
    (p) => {
      p.run.repository.id = 99;
    },
    (p) => {
      p.run.head_repository.id = 99;
    },
    (p) => {
      p.run.path = '.github/workflows/other.yml';
    },
    (p) => {
      p.run.pull_requests = [{ number: 99, head: { sha: headSha } }];
    },
    (p) => {
      p.jobs[0].conclusion = 'skipped';
    },
    (p) => {
      p.jobs[0].steps[0].conclusion = 'skipped';
    },
    (p) => {
      p.jobs[0].run_attempt = 1;
    },
    (p) => {
      p.jobs.push(p.jobs[0]);
    },
    (p) => {
      p.jobs = p.jobs.slice(0, 1);
    },
    (p) => {
      p.artifact.expired = true;
    },
    (p) => {
      p.artifact.name = 'acceptance-100-1';
    },
    (p) => {
      p.artifact.workflow_run.id = 101;
    },
    (p) => {
      p.artifact.size_in_bytes = 1_000_000;
    },
    (p) => {
      p.record = { ...(p.record as object), coverage: 'docs' };
    },
    (p) => {
      p.record = { ...(p.record as object), runAttempt: 1 };
    },
    (p) => {
      p.record = { ...(p.record as object), nodeVersion: '24.0.0' };
    },
    (p) => {
      p.record = { ...(p.record as object), checkoutSha: '../other' };
    },
    (p) => {
      p.record = null;
    },
    (p) => {
      p.checkout.tree.sha = headSha;
    },
    (p) => {
      p.checkout.parents = [];
    },
  ];
  for (const [index, mutate] of mutations.entries()) {
    const value = proof();
    mutate(value);
    assert.throws(() => requireAcceptance(value), `case ${index}`);
  }
});

function fixture() {
  const p = proof();
  const values = new Map<string, unknown>([
    [`commits/${mainSha}/pulls?per_page=100`, [{ number: 13 }]],
    ['pulls/13', p.pr],
    [
      `actions/workflows/check.yml/runs?event=pull_request&head_sha=${headSha}&per_page=100`,
      { total_count: 1, workflow_runs: [p.run] },
    ],
    ['actions/runs/100/attempts/2/jobs?per_page=100', { total_count: 2, jobs: p.jobs }],
    ['actions/runs/100/artifacts?per_page=100', { total_count: 1, artifacts: [p.artifact] }],
    [`git/commits/${checkoutSha}`, p.checkout],
  ]);
  return {
    p,
    values,
    context: { repositoryId: p.repositoryId, repository: p.repository, mainSha, treeSha },
    io: {
      github: async (path: string) => {
        assert.ok(values.has(path), `Unexpected API request: ${path}`);
        return structuredClone(values.get(path));
      },
      artifact: async () => structuredClone(p.record),
    },
  };
}

test('resolver reads current-attempt provenance and reports the reused run', async () => {
  const f = fixture();
  const result = await resolveAcceptance(f.context, f.io);
  assert.equal(result.mode, 'reuse');
  assert.equal(result.runId, 100);
});

test('merged GitHub runs may omit the PR association but the saved record must still bind it', async () => {
  const f = fixture();
  f.p.run.pull_requests = [];
  assert.equal((await resolveAcceptance(f.context, f.io)).mode, 'reuse');
  f.p.record = { ...(f.p.record as object), pr: 99 };
  assert.equal((await resolveAcceptance(f.context, f.io)).mode, 'full');
});

test('latest failed, cancelled or unfinished run is not hidden by an older green run', async () => {
  for (const conclusion of ['failure', 'cancelled', null]) {
    const f = fixture();
    const path = [...f.values.keys()].find((key) => key.startsWith('actions/workflows'))!;
    f.values.set(path, {
      total_count: 2,
      workflow_runs: [f.p.run, { ...f.p.run, id: 101, conclusion }],
    });
    assert.equal((await resolveAcceptance(f.context, f.io)).mode, 'full');
  }
});

test('a new run or attempt during evidence collection invalidates the earlier success', async () => {
  for (const change of ['new-run', 'new-attempt', 'unfinished', 'failed']) {
    const f = fixture();
    f.io.artifact = async () => {
      if (change === 'new-run') f.p.run.id = 101;
      if (change === 'new-attempt') f.p.run.run_attempt = 3;
      if (change === 'unfinished') f.p.run.status = 'in_progress';
      if (change === 'failed') f.p.run.conclusion = 'failure';
      return structuredClone(f.p.record);
    };
    assert.equal((await resolveAcceptance(f.context, f.io)).mode, 'full', change);
  }
});

test('the final freshness query must succeed before acceptance can be reused', async () => {
  const f = fixture();
  const github = f.io.github;
  let reads = 0;
  f.io.github = async (path) => {
    if (path.startsWith('actions/workflows') && ++reads === 2)
      throw new Error('Latest run unavailable');
    return github(path);
  };
  assert.equal((await resolveAcceptance(f.context, f.io)).mode, 'full');
  assert.equal(reads, 2);
});

test('direct push, ambiguous or expired artifacts, malformed responses and IO failures fall back', async () => {
  const mutations: ((f: ReturnType<typeof fixture>) => void)[] = [
    (f) => f.values.set(`commits/${mainSha}/pulls?per_page=100`, []),
    (f) => f.values.set(`commits/${mainSha}/pulls?per_page=100`, null),
    (f) =>
      f.values.set('actions/runs/100/artifacts?per_page=100', {
        total_count: 2,
        artifacts: [f.p.artifact, f.p.artifact],
      }),
    (f) => {
      f.p.artifact.expired = true;
    },
    (f) =>
      f.values.set('actions/runs/100/attempts/2/jobs?per_page=100', {
        total_count: 101,
        jobs: f.p.jobs,
      }),
    (f) => {
      f.io.github = async () => {
        throw new Error('API unavailable');
      };
    },
    (f) => {
      f.io.artifact = async () => {
        throw new Error('Download failed');
      };
    },
  ];
  for (const mutate of mutations) {
    const f = fixture();
    mutate(f);
    const result = await resolveAcceptance(f.context, f.io);
    assert.equal(result.mode, 'full');
    assert.ok(result.reason);
  }
});
