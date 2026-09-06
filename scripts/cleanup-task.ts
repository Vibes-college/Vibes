import { isInside } from './cleanup-policy.ts';
import { capture, github, repository } from './release-utils.ts';
import { requireCleanup, protectedIgnored } from './cleanup-policy.ts';
import { releaseTarget } from './release-policy.ts';
import { classifyChanges } from './check-scope.ts';

// 显式目标PR决定清理范围；默认只报告，AI核对占用后才传--execute-idle。
async function main(): Promise<void> {
  const [number, mode, ...extra] = process.argv.slice(2);
  if (!number || !/^[1-9]\d*$/.test(number) || extra.length || (mode && mode !== '--execute-idle'))
    throw new Error('Usage: cleanup:task -- <PR number> [--execute-idle]');
  const pr = github(`pulls/${number}`) as {
    merged: boolean;
    merge_commit_sha: string;
    head: { ref: string; sha: string; repo: { full_name: string } };
  };
  if (pr.head.repo.full_name !== repository) throw new Error('Not a repository-owned branch');
  const dependents = github(
    `pulls?state=open&base=${encodeURIComponent(pr.head.ref)}&per_page=100`,
  ) as unknown[];
  if (!Array.isArray(dependents) || dependents.length)
    throw new Error('Open PRs still depend on this branch; preserve it');
  capture('git', ['fetch', 'origin', 'main']);
  const marker = await fetch(`${releaseTarget.origin}/__release.json?t=${Date.now()}`, {
    signal: AbortSignal.timeout(10000),
    cache: 'no-store',
  });
  if (!marker.ok) throw new Error('Production version evidence unavailable');
  const live = (await marker.json()) as { sha: string };
  if (!/^[a-f0-9]{40}$/.test(live.sha)) throw new Error('Invalid production SHA');
  const runs = github(
    `actions/workflows/check.yml/runs?event=push&head_sha=${live.sha}&per_page=20`,
  ) as { workflow_runs: { id: number; conclusion: string; head_branch: string }[] };
  let deployed = false;
  for (const run of runs.workflow_runs.filter(
    (item) => item.conclusion === 'success' && item.head_branch === 'main',
  )) {
    const jobs = github(`actions/runs/${run.id}/jobs?per_page=100`) as {
      jobs: { name: string; conclusion: string }[];
    };
    if (
      jobs.jobs.some(
        (job) => job.name === 'Deploy and verify production' && job.conclusion === 'success',
      )
    )
      deployed = true;
  }
  // GitHub合并证明支持squash；分支必须仍等于PR最后的head，不能删合并后的新提交。
  let mergeInDeployment = isAncestor(pr.merge_commit_sha, live.sha);
  if (!mergeInDeployment && isAncestor(live.sha, pr.merge_commit_sha)) {
    const paths = capture('git', [
      'diff',
      '--no-renames',
      '--name-only',
      '-z',
      live.sha,
      pr.merge_commit_sha,
    ])
      .split('\0')
      .filter(Boolean);
    // 文档维护无需重发网站，但必须有该main提交的成功检查，不能把失败的合并当作收尾。
    if (classifyChanges(paths) !== 'full') {
      const checks = github(
        `actions/workflows/check.yml/runs?event=push&head_sha=${pr.merge_commit_sha}&per_page=20`,
      ) as { workflow_runs: { conclusion: string; head_branch: string }[] };
      mergeInDeployment = checks.workflow_runs.some(
        (run) => run.head_branch === 'main' && run.conclusion === 'success',
      );
    }
  }
  const local = capture('git', [
    'for-each-ref',
    '--format=%(objectname)',
    `refs/heads/${pr.head.ref}`,
  ]).trim();
  const remote = capture('git', ['ls-remote', '--heads', 'origin', `refs/heads/${pr.head.ref}`])
    .trim()
    .split(/\s/)[0];
  const entries = capture('git', ['worktree', 'list', '--porcelain']).split('\n\n');
  const worktree = entries.find(
    (entry) =>
      entry.includes(`branch refs/heads/${pr.head.ref}\n`) ||
      entry.endsWith(`branch refs/heads/${pr.head.ref}`),
  );
  const path = worktree?.split('\n')[0].slice('worktree '.length);
  const dirty = Boolean(path && capture('git', ['status', '--porcelain'], path).trim());
  const ignored = path
    ? protectedIgnored(
        capture('git', ['ls-files', '--others', '--ignored', '--exclude-standard', '-z'], path)
          .split('\0')
          .filter(Boolean),
      )
    : [];
  if (ignored.length)
    throw new Error(
      'Preserve ignored personal files, credentials and evidence before removing this worktree',
    );
  for (const branchHead of [local, remote].filter(Boolean))
    requireCleanup({
      merged: pr.merged,
      dependentPrs: dependents.length,
      branch: pr.head.ref,
      prHead: pr.head.sha,
      branchHead,
      deployed,
      mergeInDeployment,
      dirty,
      idle: !mode || mode === '--execute-idle',
    });
  if (!pr.merged || !deployed || !mergeInDeployment || dirty)
    throw new Error('Cleanup conditions not satisfied');
  if (path && isInside(path, process.cwd()))
    throw new Error(
      'Switch this checkout to main before cleanup; never remove the active working directory',
    );
  console.log(
    JSON.stringify({
      pr: number,
      branch: pr.head.ref,
      worktree: path,
      local: Boolean(local),
      remote: Boolean(remote),
      execute: Boolean(mode),
    }),
  );
  if (!mode) return;
  if (path) capture('git', ['worktree', 'remove', path]);
  if (local) capture('git', ['update-ref', '-d', `refs/heads/${pr.head.ref}`, local]);
  if (remote)
    capture('git', [
      'push',
      '--force-with-lease=refs/heads/' + pr.head.ref + ':' + remote,
      'origin',
      ':refs/heads/' + pr.head.ref,
    ]);
  capture('git', ['fetch', 'origin', '--prune']);
  console.log(
    'Cleaned only the verified PR branch and its idle clean worktree; deployment versions retained.',
  );
}

// 可达性失败返回false；不把未知提交当作已整合。
function isAncestor(before: string, after: string): boolean {
  if (!/^[a-f0-9]{40}$/.test(before || '')) return false;
  try {
    capture('git', ['merge-base', '--is-ancestor', before, after]);
    return true;
  } catch {
    return false;
  }
}

// 清理失败保留未处理资源并输出具体原因。
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
