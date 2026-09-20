import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { capture, repository } from './release-utils.ts';
import type { ReusedProofSource } from './great-ui-proof.ts';

// The protected workflow passes these identifiers only after the acceptance resolver
// validates the run, attempt, artifact provenance and exact complete Git tree.
export function reusedDemoSource(
  environment: NodeJS.ProcessEnv,
  checkout: { sha: string; clean: boolean },
): ReusedProofSource {
  const runId = Number(environment.CI_ACCEPTANCE_RUN);
  const attempt = Number(environment.CI_ACCEPTANCE_ATTEMPT);
  if (
    environment.CI !== 'true' ||
    environment.GITHUB_ACTIONS !== 'true' ||
    environment.GITHUB_EVENT_NAME !== 'push' ||
    environment.GITHUB_REF !== 'refs/heads/main' ||
    environment.GITHUB_REPOSITORY !== repository ||
    environment.CI_ACCEPTANCE_REUSED !== 'true' ||
    !Number.isSafeInteger(runId) ||
    runId <= 0 ||
    !Number.isSafeInteger(attempt) ||
    attempt <= 0 ||
    !/^[a-f0-9]{40}$/.test(checkout.sha) ||
    checkout.sha !== environment.GITHUB_SHA ||
    !checkout.clean ||
    ['VIBES_CONTENT_DIR', 'VIBES_TAXONOMY_FILE', 'VIBES_OUT_DIR'].some((name) => environment[name])
  )
    throw new Error('Demo proof reuse requires trusted full PR acceptance for this main checkout.');
  return {
    kind: 'reused-full-pr',
    runId,
    attempt,
    mainSha: checkout.sha,
    reference: `https://github.com/${repository}/actions/runs/${runId}/attempts/${attempt}`,
  };
}

async function main() {
  if (process.argv.length !== 2) throw new Error('Usage: great-ui-reuse.ts');
  const checkout = () => ({
    sha: capture('git', ['rev-parse', 'HEAD']).trim(),
    clean: !capture('git', ['status', '--porcelain']).trim(),
  });
  const source = reusedDemoSource(process.env, checkout());
  const { currentDemoProof, saveDemoProof } = await import('./great-ui-proof.ts');
  const before = await currentDemoProof('site');
  reusedDemoSource(process.env, checkout());
  await saveDemoProof(before, 'site', source);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
