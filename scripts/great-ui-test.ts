import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { currentDemoProof, proofPath } from './great-ui-proof.ts';
const args = process.argv.slice(2);
const before = await currentDemoProof();
const child = spawn(
  process.execPath,
  [
    'node_modules/@playwright/test/cli.js',
    'test',
    '--config',
    'playwright.great-ui.config.ts',
    ...args,
  ],
  { stdio: 'inherit' },
);
const code = await new Promise<number>((resolve, reject) => {
  child.once('error', reject);
  child.once('close', (status) => resolve(status ?? 1));
});
if (code !== 0) process.exit(code);
// A filtered rerun is useful for debugging but cannot certify the whole fixed path.
if (args.length) process.exit(0);
const after = await currentDemoProof();
if (before.adapterRevision !== after.adapterRevision)
  throw new Error('Source changed during acceptance; no verification record written.');
const records = after.plans.map((plan) => ({
  planId: plan.id,
  contextKey: plan.contextKey,
  ruleVersion: plan.ruleVersion,
  works: [
    ...new Map(
      plan.steps.flatMap((step) => (step.work ? [[step.work.id, step.work] as const] : [])),
    ).values(),
  ].map(({ id, sourceRevision, contentRevision, capabilityRevision }) => ({
    id,
    sourceRevision,
    contentRevision,
    capabilityRevision,
  })),
  adapterRevision: after.adapterRevision,
  references: [
    'tests/great-ui/journey.spec.ts: all projects passed',
    'tests/great-ui/learning.spec.ts: all projects passed',
  ],
  result: 'passed',
}));
const proof = {
  adapterRevision: after.adapterRevision,
  generatedAt: new Date().toISOString(),
  records,
};
await mkdir('resources/evidence/018-great-ui-scale', { recursive: true });
await writeFile(proofPath, JSON.stringify(proof, null, 2) + '\n');
for (const directory of ['.scratch/great-ui-public/content', '.scratch/great-ui-dist/content']) {
  await mkdir(directory, { recursive: true });
  await writeFile(directory + '/demo-proof.json', JSON.stringify(proof) + '\n');
}
console.log(
  'Three fixed paths verified across all configured projects; six motion-context records saved.',
);
