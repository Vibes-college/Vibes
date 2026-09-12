export const acceptanceSchema = 1;
export const ciNodeVersion = '22.20.0';
export const workflowPath = '.github/workflows/check.yml';
export const fullSteps = [
  'Prepare Paseo for full verification',
  'Run full regression',
  'Build and check resource budget',
] as const;

export interface AcceptanceRecord {
  schema: number;
  coverage: string;
  repositoryId: number;
  headRepositoryId: number;
  repository: string;
  pr: number;
  runId: number;
  runAttempt: number;
  headSha: string;
  baseSha: string;
  checkoutSha: string;
  treeSha: string;
  nodeVersion: string;
  workflowPath: string;
  draft: boolean;
}
export interface AcceptanceContext {
  repositoryId: number;
  repository: string;
  mainSha: string;
  treeSha: string;
}
export interface AcceptancePr {
  number: number;
  merged: boolean;
  draft: boolean;
  merge_commit_sha: string;
  head: { sha: string; repo: { id: number } };
  base: { ref: string; repo: { id: number } };
}
export interface AcceptanceRun {
  id: number;
  run_attempt: number;
  status: string;
  conclusion: string | null;
  event: string;
  path: string;
  head_sha: string;
  repository: { id: number };
  head_repository: { id: number };
  pull_requests: { number: number; head: { sha: string } }[];
}
export interface AcceptanceJob {
  name: string;
  conclusion: string | null;
  run_attempt: number;
  steps: { name: string; conclusion: string | null }[];
}
export interface AcceptanceArtifact {
  id: number;
  name: string;
  expired: boolean;
  size_in_bytes: number;
  digest?: string;
  workflow_run: { id: number; head_sha: string; head_repository_id: number };
}
export interface AcceptanceProof extends AcceptanceContext {
  pr: AcceptancePr;
  run: AcceptanceRun;
  jobs: AcceptanceJob[];
  artifact: AcceptanceArtifact;
  record: unknown;
  checkout: { sha: string; tree: { sha: string }; parents: { sha: string }[] };
}

export function requireProof(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export const validSha = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
export const validId = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

export function parseAcceptance(value: unknown): AcceptanceRecord {
  requireProof(
    value && typeof value === 'object' && !Array.isArray(value),
    'Missing acceptance record',
  );
  const record = value as AcceptanceRecord;
  requireProof(
    record.schema === acceptanceSchema &&
      record.coverage === 'full' &&
      record.draft === false &&
      record.nodeVersion === ciNodeVersion &&
      record.workflowPath === workflowPath,
    'Acceptance coverage or execution policy differs',
  );
  requireProof(
    [
      record.repositoryId,
      record.headRepositoryId,
      record.pr,
      record.runId,
      record.runAttempt,
    ].every(validId) &&
      [record.headSha, record.baseSha, record.checkoutSha, record.treeSha].every(validSha),
    'Invalid acceptance identity',
  );
  return record;
}

export function requireMergedPr(context: AcceptanceContext, pr: AcceptancePr): void {
  requireProof(
    validId(context.repositoryId) && validSha(context.mainSha) && validSha(context.treeSha),
    'Invalid main identity',
  );
  requireProof(
    validId(pr?.number) &&
      pr.merged === true &&
      pr.draft === false &&
      pr.merge_commit_sha === context.mainSha &&
      pr.base?.ref === 'main' &&
      pr.base?.repo?.id === context.repositoryId &&
      pr.head?.repo?.id === context.repositoryId &&
      validSha(pr.head?.sha),
    'No unambiguous same-repository merged PR for this main commit',
  );
}

export function requireSuccessfulRun(
  context: AcceptanceContext,
  pr: AcceptancePr,
  run: AcceptanceRun,
): void {
  requireProof(
    validId(run?.id) &&
      validId(run.run_attempt) &&
      run.status === 'completed' &&
      run.conclusion === 'success' &&
      run.event === 'pull_request' &&
      run.path === workflowPath &&
      run.head_sha === pr.head.sha &&
      run.repository?.id === context.repositoryId &&
      run.head_repository?.id === context.repositoryId &&
      Array.isArray(run.pull_requests) &&
      // GitHub may empty this association after merge. The immutable record below
      // binds PR/run/head; a present, contradictory API association is rejected.
      (run.pull_requests.length === 0 ||
        run.pull_requests.some(
          (item) => item.number === pr.number && item.head?.sha === pr.head.sha,
        )),
    'Latest matching PR run is not a trusted successful verification',
  );
}

// GitHub's current-attempt jobs establish success independently of artifact claims.
export function requireAcceptance(proof: AcceptanceProof): void {
  const { pr, run, jobs, artifact, checkout } = proof;
  requireMergedPr(proof, pr);
  requireSuccessfulRun(proof, pr, run);
  const record = parseAcceptance(proof.record);
  for (const name of ['verify', 'budget']) {
    const matches = jobs.filter((job) => job.name === name);
    requireProof(
      matches.length === 1 &&
        matches[0].conclusion === 'success' &&
        matches[0].run_attempt === run.run_attempt,
      'Current attempt did not complete both required checks',
    );
    if (name === 'verify') {
      for (const step of fullSteps) {
        const steps = matches[0].steps.filter((item) => item.name === step);
        requireProof(
          steps.length === 1 && steps[0].conclusion === 'success',
          'Full verification step was missing, failed or skipped',
        );
      }
    }
  }
  requireProof(
    validId(artifact.id) &&
      artifact.expired === false &&
      artifact.name === `acceptance-${run.id}-${run.run_attempt}` &&
      artifact.size_in_bytes > 0 &&
      artifact.size_in_bytes <= 16384 &&
      artifact.workflow_run?.id === run.id &&
      artifact.workflow_run?.head_sha === pr.head.sha &&
      artifact.workflow_run?.head_repository_id === proof.repositoryId,
    'Acceptance artifact provenance is invalid',
  );
  requireProof(
    record.repositoryId === proof.repositoryId &&
      record.headRepositoryId === proof.repositoryId &&
      record.repository === proof.repository &&
      record.pr === pr.number &&
      record.runId === run.id &&
      record.runAttempt === run.run_attempt &&
      record.headSha === pr.head.sha,
    'Acceptance record belongs to a different repository, PR or attempt',
  );
  requireProof(
    record.treeSha === proof.treeSha &&
      checkout.sha === record.checkoutSha &&
      checkout.tree?.sha === record.treeSha &&
      checkout.parents?.length === 2 &&
      checkout.parents[0].sha === record.baseSha &&
      checkout.parents[1].sha === record.headSha,
    'Final main content differs from the verified PR merge tree',
  );
}
