import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { capture, repository } from './release-utils.ts';
import {
  acceptanceSchema,
  parseAcceptance,
  requireProof,
  validId,
  workflowPath,
  type AcceptanceArtifact,
} from './ci-acceptance-policy.ts';
import { resolveAcceptance, type AcceptanceDecision } from './ci-acceptance-resolver.ts';

function api(path: string): Buffer {
  const result = spawnSync('gh', ['api', `repos/${repository}/${path}`], {
    timeout: 15000,
    maxBuffer: path.endsWith('/zip') ? 65536 : 4 * 1024 * 1024,
  });
  requireProof(!result.error && result.status === 0, 'GitHub acceptance evidence request failed');
  return result.stdout;
}
export async function githubEvidence(path: string): Promise<unknown> {
  return JSON.parse(api(path).toString('utf8'));
}

// Only a tiny, exact-name JSON member is read; no archive paths are extracted or executed.
export async function readAcceptanceArtifact(artifact: AcceptanceArtifact): Promise<unknown> {
  requireProof(
    validId(artifact.id) &&
      artifact.size_in_bytes > 0 &&
      artifact.size_in_bytes <= 16384 &&
      artifact.expired === false,
    'Invalid artifact download',
  );
  const archive = api(`actions/artifacts/${artifact.id}/zip`);
  requireProof(
    artifact.digest === `sha256:${createHash('sha256').update(archive).digest('hex')}`,
    'Acceptance archive digest mismatch or unavailable',
  );
  const directory = mkdtempSync(join(tmpdir(), 'vibes-acceptance-'));
  try {
    const path = join(directory, 'record.zip');
    writeFileSync(path, archive);
    const names = spawnSync('unzip', ['-Z1', path], {
      encoding: 'utf8',
      maxBuffer: 16384,
      timeout: 5000,
    });
    requireProof(
      !names.error && names.status === 0 && names.stdout.trim() === 'acceptance.json',
      'Unexpected acceptance archive contents',
    );
    const record = spawnSync('unzip', ['-p', path, 'acceptance.json'], {
      encoding: 'utf8',
      maxBuffer: 16384,
      timeout: 5000,
    });
    requireProof(!record.error && record.status === 0, 'Unable to read bounded acceptance JSON');
    return JSON.parse(record.stdout);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function writeRecord(): void {
  requireProof(
    process.env.GITHUB_ACTIONS === 'true' &&
      process.env.GITHUB_EVENT_NAME === 'pull_request' &&
      process.env.GITHUB_REPOSITORY === repository &&
      process.env.CI_SCOPE === 'full' &&
      process.env.CI_FULL_VERIFIED === 'success' &&
      process.env.CI_NATIVE_VERIFIED === 'success' &&
      process.env.CI_BUDGET_PASSED === 'success',
    'Only a successful full PR verification can issue acceptance evidence',
  );
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH || '', 'utf8'));
  const pr = event.pull_request;
  const checkoutSha = capture('git', ['rev-parse', 'HEAD']).trim();
  requireProof(
    !capture('git', ['status', '--porcelain']).trim(),
    'Verification changed checkout contents',
  );
  requireProof(
    checkoutSha === process.env.GITHUB_SHA && pr?.draft === false && pr?.base?.ref === 'main',
    'Acceptance requires the actual Ready PR checkout',
  );
  const record = parseAcceptance({
    schema: acceptanceSchema,
    coverage: 'full',
    repository,
    repositoryId: Number(process.env.GITHUB_REPOSITORY_ID),
    headRepositoryId: pr?.head?.repo?.id,
    pr: pr?.number,
    runId: Number(process.env.GITHUB_RUN_ID),
    runAttempt: Number(process.env.GITHUB_RUN_ATTEMPT),
    headSha: pr?.head?.sha,
    baseSha: pr?.base?.sha,
    checkoutSha,
    treeSha: capture('git', ['rev-parse', 'HEAD^{tree}']).trim(),
    nodeVersion: process.versions.node,
    workflowPath,
    draft: false,
  });
  requireProof(
    record.repositoryId === event.repository?.id && pr.base.repo?.id === record.repositoryId,
    'PR repository identity mismatch',
  );
  const parents = capture('git', ['show', '-s', '--format=%P', 'HEAD']).trim();
  requireProof(
    parents === `${record.baseSha} ${record.headSha}`,
    'Checkout is not the expected simulated PR merge',
  );
  mkdirSync('.scratch/ci-acceptance', { recursive: true });
  writeFileSync('.scratch/ci-acceptance/acceptance.json', JSON.stringify(record, null, 2) + '\n');
  console.log(
    `Full acceptance recorded for PR ${record.pr}, run ${record.runId}/${record.runAttempt}, tree ${record.treeSha}`,
  );
}

async function decide(): Promise<void> {
  let result: AcceptanceDecision = {
    mode: 'full',
    reason: 'Only a main push can reuse PR verification',
  };
  if (
    process.env.GITHUB_EVENT_NAME === 'push' &&
    process.env.GITHUB_REF === 'refs/heads/main' &&
    process.env.GITHUB_REPOSITORY === repository
  ) {
    try {
      const mainSha = capture('git', ['rev-parse', 'HEAD']).trim();
      requireProof(mainSha === process.env.GITHUB_SHA, 'Main checkout SHA mismatch');
      result = await resolveAcceptance(
        {
          repository,
          repositoryId: Number(process.env.GITHUB_REPOSITORY_ID),
          mainSha,
          treeSha: capture('git', ['rev-parse', 'HEAD^{tree}']).trim(),
        },
        { github: githubEvidence, artifact: readAcceptanceArtifact },
      );
    } catch {
      result = { mode: 'full', reason: 'Main identity could not be established' };
    }
  }
  const report = `Acceptance: ${result.mode}; ${result.reason}${result.runId ? ` (run ${result.runId}/${result.attempt})` : ''}`;
  console.log(report);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `acceptance=${result.mode}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
}

async function main(): Promise<void> {
  const [action, ...extra] = process.argv.slice(2);
  requireProof(
    !extra.length && ['record', 'resolve'].includes(action),
    'Usage: ci-acceptance.ts record | resolve',
  );
  if (action === 'record') writeRecord();
  else await decide();
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
