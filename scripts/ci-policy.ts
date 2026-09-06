export type CiEvent = { name: string; ref: string; draft?: boolean };

// Draft使用独立轻量检查，只有Ready PR、main或手动验收运行正式检查。
export function checkMode(event: CiEvent): 'draft' | 'required' | 'none' {
  if (event.name === 'pull_request') return event.draft ? 'draft' : 'required';
  if (
    event.name === 'workflow_dispatch' ||
    (event.name === 'push' && event.ref === 'refs/heads/main')
  )
    return 'required';
  return 'none';
}

// 正式发布仅接受main推送和同一运行中成功的必要检查，其他事件不得提升生产。
export function requireProduction(
  event: CiEvent,
  sha: string,
  main: string,
  checks: string[],
): void {
  if (
    event.name !== 'push' ||
    event.ref !== 'refs/heads/main' ||
    !/^[a-f0-9]{40}$/.test(sha) ||
    sha !== main
  )
    throw new Error('Production requires the current main push SHA');
  if (checks.length !== 2 || checks.some((result) => result !== 'success'))
    throw new Error('Production requires successful verify and budget from this run');
}
