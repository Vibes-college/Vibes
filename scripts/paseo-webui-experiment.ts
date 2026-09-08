import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { createWorkloads } from '../tests/fixtures/paseo-webui/workloads.ts';
import { root } from './local-tools.ts';
import { sha256, verifySource } from './paseo-webui-build.ts';

export const EXPERIMENT_PROFILES = Object.freeze({
  B0: { host: false, lazy: [], trimmed: false, renderingPatch: false },
  H: { host: true, lazy: [], trimmed: false, renderingPatch: false },
  A1: { host: true, lazy: ['mermaid'], trimmed: false, renderingPatch: false },
  A2: { host: true, lazy: ['terminal'], trimmed: false, renderingPatch: false },
  A3: { host: true, lazy: ['editor'], trimmed: false, renderingPatch: false },
  A4: { host: true, lazy: ['syntax'], trimmed: false, renderingPatch: false },
  A5: { host: true, lazy: ['languages'], trimmed: false, renderingPatch: false },
  A6: { host: true, lazy: ['icons'], trimmed: false, renderingPatch: false },
  A: {
    host: true,
    lazy: ['mermaid', 'terminal', 'editor', 'syntax', 'languages', 'icons'],
    trimmed: false,
    renderingPatch: false,
  },
  B: {
    host: true,
    lazy: ['mermaid', 'terminal', 'editor', 'syntax', 'languages', 'icons'],
    trimmed: true,
    renderingPatch: false,
  },
  'A+P': {
    host: true,
    lazy: ['mermaid', 'terminal', 'editor', 'syntax', 'languages', 'icons'],
    trimmed: false,
    renderingPatch: true,
  },
  'B+P': {
    host: true,
    lazy: ['mermaid', 'terminal', 'editor', 'syntax', 'languages', 'icons'],
    trimmed: true,
    renderingPatch: true,
  },
});
export const SAMPLING_RULES = Object.freeze({
  coldPerScenario: 10,
  warmPerScenario: 20,
  pairingScenarios: ['unpaired', 'paired'],
  workers: 1,
  randomSeed: 120072,
  openTimeoutMs: 120000,
  recoveryPerCandidate: 100,
  minimumAutomaticRecovery: 99,
  disconnectAndForgetPerCandidate: 20,
  resourceCycles: 100,
  lunaPerCandidate: 3,
  iphoneSeconds: [10, 60, 300, 900],
  iphoneRepeatsPerCandidate: 3,
  coldCache:
    'New persistent profile; empty HTTP cache and storage, then apply only the selected pairing snapshot.',
  warmCache:
    'Reuse the paired/unpaired profile after one untimed successful warmup; report observed cache hits.',
  metrics:
    'Click-to-operable; optional first-use separate. Model/provider wait separate. Actual encoded body bytes and per-file gzip both retained.',
});
export function workloadInputs() {
  return Object.entries(createWorkloads()).map(([id, value]) => {
    const bytes = Buffer.from(JSON.stringify(value) + '\n');
    return { id, bytes, sha256: sha256(bytes) };
  });
}
export function sampleOrder() {
  const order = [];
  for (const pairing of SAMPLING_RULES.pairingScenarios)
    for (const cache of ['cold', 'warm'] as const)
      for (
        let index = 0;
        index <
        (cache === 'cold' ? SAMPLING_RULES.coldPerScenario : SAMPLING_RULES.warmPerScenario);
        index++
      )
        for (const profile of Object.keys(EXPERIMENT_PROFILES))
          order.push({ pairing, cache, index, profile });
  let state = SAMPLING_RULES.randomSeed;
  for (let index = order.length - 1; index > 0; index--) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const target = (state >>> 0) % (index + 1);
    [order[index], order[target]] = [order[target], order[index]];
  }
  return order;
}
export function summarizeSamplingCoverage(
  samples: (ReturnType<typeof sampleOrder>[number] & {
    outcome: 'passed' | 'failed' | 'unmeasured';
  })[],
) {
  const key = (sample: ReturnType<typeof sampleOrder>[number]) =>
    `${sample.profile}/${sample.pairing}/${sample.cache}/${sample.index}`;
  const expected = new Set(sampleOrder().map(key));
  const seen = new Set<string>();
  let observed = 0;
  let failed = 0;
  for (const sample of samples) {
    const id = key(sample);
    if (!expected.has(id) || seen.has(id))
      throw new Error('Unknown or duplicate experiment sample.');
    if (!['passed', 'failed', 'unmeasured'].includes(sample.outcome))
      throw new Error('Unknown sample outcome.');
    seen.add(id);
    if (sample.outcome !== 'unmeasured') {
      observed++;
      expected.delete(id);
      if (sample.outcome === 'failed') failed++;
    }
  }
  // Complete coverage permits analysis; it is never itself a candidate pass.
  return {
    readyForAnalysis: expected.size === 0,
    observed,
    failed,
    missing: [...expected],
    verdict: 'not-evaluated',
  };
}
function writeFrozen(path: string, value: unknown) {
  const serialized = JSON.stringify(value, null, 2) + '\n';
  if (existsSync(path)) {
    if (!isDeepStrictEqual(JSON.parse(readFileSync(path, 'utf8')), value))
      throw new Error(`Frozen inputs changed: ${path}`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serialized);
}
async function main() {
  if (process.argv[2] !== 'prepare' || process.argv.length !== 3)
    throw new Error('Usage: paseo-webui-experiment.ts prepare');
  const source = join(root, '.scratch/paseo-webui/upstream');
  const identity = JSON.parse(
    readFileSync(join(root, 'third_party/paseo-webui/upstream.json'), 'utf8'),
  );
  verifySource(source, identity);
  const protocol = await import(
    pathToFileURL(join(source, 'packages/protocol/dist/messages.js')).href
  );
  const workloads = createWorkloads();
  for (const workload of [workloads.W1, workloads.W2])
    for (const item of workload.events) protocol.AgentStreamEventPayloadSchema.parse(item.event);
  const baselinePath = join(
    root,
    'resources/evidence/012-paseo-webui-loading/baseline/b0-manifest.json',
  );
  const baselineBytes = readFileSync(baselinePath);
  const baseline = JSON.parse(baselineBytes.toString());
  const requestBytes = readFileSync(
    join(dirname(baselinePath), 'desktop-chromium/initial-requests.json'),
  );
  const requests = JSON.parse(requestBytes.toString());
  if (
    requests.profile !== 'B0' ||
    requests.source !== identity.commit ||
    baseline.source.commit !== identity.commit
  )
    throw new Error('Baseline versions do not match.');
  const initialPaths = new Set(
    requests.requests
      .filter((request: { type: string }) => request.type === 'script')
      .map((request: { path: string }) => request.path.slice(1)),
  );
  if (!initialPaths.size) throw new Error('No observed initial scripts.');
  const initial = baseline.files.filter((file: { path: string }) => initialPaths.has(file.path));
  if (initial.length !== initialPaths.size) throw new Error('Unknown observed initial script.');
  const inputs = workloadInputs();
  const frozen = {
    schemaVersion: 1,
    status: 'prepared-not-measured',
    upstreamCommit: identity.commit,
    lockSha256: identity.lockfile.sha256,
    protocol: 'AgentStreamEventPayloadSchema from fixed built @getpaseo/protocol 0.7.2',
    profiles: EXPERIMENT_PROFILES,
    sampling: SAMPLING_RULES,
    inputs: inputs.map((input) => ({
      id: input.id,
      bytes: input.bytes.length,
      sha256: input.sha256,
    })),
    sampleOrderSha256: sha256(Buffer.from(JSON.stringify(sampleOrder()))),
  };
  writeFrozen(join(root, 'tests/fixtures/paseo-webui/frozen.json'), frozen);
  const initialGzip = initial.reduce(
    (sum: number, file: { gzipBytes: number }) => sum + file.gzipBytes,
    0,
  );
  writeFrozen(join(root, 'third_party/paseo-webui/budget-baseline.json'), {
    schemaVersion: 1,
    source: identity.commit,
    lockSha256: identity.lockfile.sha256,
    manifestSha256: sha256(baselineBytes),
    observedRequestsSha256: sha256(requestBytes),
    totalScriptGzipBytes: baseline.scriptTotals.gzipBytes,
    initialScriptPaths: [...initialPaths].sort(),
    initialScriptGzipBytes: initialGzip,
    candidateInitialGzipTarget: Math.floor(initialGzip / 2),
    candidateTotalGzipMaximum: baseline.scriptTotals.gzipBytes,
    additionalResearchTarget: 700000,
    targetIsObservedPass: false,
    preservedMainLimits: {
      ordinaryScriptGzip: 21000,
      mdxScriptGzip: 150000,
      mediaScriptGzip: 16000,
      homepageGzip: 40000,
      interactiveSourceBytes: 12000,
      imageBytes: 204800,
    },
  });
  const output = join(root, '.scratch/paseo-webui/experiment-inputs');
  mkdirSync(output, { recursive: true });
  for (const input of inputs) writeFileSync(join(output, `${input.id}.json`), input.bytes);
  writeFileSync(join(output, 'sample-order.json'), JSON.stringify(sampleOrder(), null, 2) + '\n');
  console.log(
    `Prepared ${inputs.length} frozen workloads and ${sampleOrder().length} scheduled samples. No benchmark has passed.`,
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await main();
