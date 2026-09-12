import {
  parseAcceptance,
  requireAcceptance,
  requireMergedPr,
  requireProof,
  requireSuccessfulRun,
  validId,
  type AcceptanceArtifact,
  type AcceptanceContext,
  type AcceptanceJob,
  type AcceptancePr,
  type AcceptanceProof,
  type AcceptanceRun,
} from './ci-acceptance-policy.ts';

export interface AcceptanceIO {
  github(path: string): Promise<unknown>;
  artifact(artifact: AcceptanceArtifact): Promise<unknown>;
}
export interface AcceptanceDecision {
  mode: 'reuse' | 'full';
  reason: string;
  runId?: number;
  attempt?: number;
}

function page<T>(value: unknown, field: string): T[] {
  requireProof(value && typeof value === 'object', 'Malformed evidence list');
  const data = value as Record<string, unknown>;
  requireProof(
    typeof data.total_count === 'number' && data.total_count >= 0 && data.total_count <= 100,
    'Evidence query exceeds the supported bound',
  );
  requireProof(
    Array.isArray(data[field]) && data[field].length === data.total_count,
    'Incomplete evidence list',
  );
  return data[field] as T[];
}

// All uncertainty selects the existing full path. Never search past a newer failure.
export async function resolveAcceptance(
  context: AcceptanceContext,
  io: AcceptanceIO,
): Promise<AcceptanceDecision> {
  try {
    const associated = await io.github(`commits/${context.mainSha}/pulls?per_page=100`);
    requireProof(
      Array.isArray(associated) && associated.length === 1 && validId(associated[0]?.number),
      'No unique PR association for this commit',
    );
    const pr = (await io.github(`pulls/${associated[0].number}`)) as AcceptancePr;
    requireMergedPr(context, pr);
    const runs = page<AcceptanceRun>(
      await io.github(
        `actions/workflows/check.yml/runs?event=pull_request&head_sha=${pr.head.sha}&per_page=100`,
      ),
      'workflow_runs',
    );
    // Merged runs can have an empty pull_requests array. Select the newest run
    // for the queried head before checking success, then bind its saved PR identity.
    requireProof(
      runs.length && runs.every((run) => validId(run.id)),
      'No matching PR verification run',
    );
    const run = runs.sort((a, b) => b.id - a.id)[0];
    requireSuccessfulRun(context, pr, run);
    const jobs = page<AcceptanceJob>(
      await io.github(`actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`),
      'jobs',
    );
    const artifacts = page<AcceptanceArtifact>(
      await io.github(`actions/runs/${run.id}/artifacts?per_page=100`),
      'artifacts',
    );
    const selected = artifacts.filter(
      (item) => item.name === `acceptance-${run.id}-${run.run_attempt}`,
    );
    requireProof(
      selected.length === 1 &&
        selected[0].expired === false &&
        selected[0].size_in_bytes > 0 &&
        selected[0].size_in_bytes <= 16384 &&
        validId(selected[0].id),
      'No unique usable acceptance artifact for this attempt',
    );
    const artifact = selected[0];
    const record = parseAcceptance(await io.artifact(artifact));
    const checkout = (await io.github(
      `git/commits/${record.checkoutSha}`,
    )) as AcceptanceProof['checkout'];
    requireAcceptance({ ...context, pr, run, jobs, artifact, record, checkout });
    return {
      mode: 'reuse',
      reason: 'Exact main tree covered by successful full PR verification',
      runId: run.id,
      attempt: run.run_attempt,
    };
  } catch (error) {
    // Error text is diagnostic only, never a command, URL or output-field name.
    return {
      mode: 'full',
      reason: (error instanceof Error ? error.message : 'Evidence unavailable')
        .replace(/[\r\n]/g, ' ')
        .slice(0, 240),
    };
  }
}
