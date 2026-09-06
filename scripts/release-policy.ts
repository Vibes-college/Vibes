export const releaseTarget = {
  accountId: 'd2338644c67dab28bdc257b40d0fa115',
  workerName: 'vibes-explore',
  origin: 'https://vibes-explore.topologic-relay.workers.dev',
} as const;

// 仅接受该测试站的检查结果，避免其他提交或同名工作流的失败结果被误认为通过。
export function requireReleaseChecks(
  sha: string,
  checks: { head_sha: string; name: string; conclusion: string | null; status: string }[],
) {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Invalid release SHA');
  for (const name of ['verify', 'budget']) {
    const matching = checks.filter((check) => check.head_sha === sha && check.name === name);
    if (
      !matching.length ||
      matching.some((check) => check.status !== 'completed' || check.conclusion !== 'success')
    )
      throw new Error(`${name} has not passed for ${sha}`);
  }
}
