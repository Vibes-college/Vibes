import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { capabilities } from '../src/features/great-ui/content-build.mjs';
import { validateCapabilities } from '../src/features/great-ui/composition/validate.ts';
import {
  demoPlan,
  demoRecipes,
  type DemoKind,
} from '../src/features/great-ui/composition/demos.ts';
import { verificationCurrent } from '../src/features/great-ui/composition/planner.ts';
import type { VerificationRecord } from '../src/features/great-ui/composition/model.ts';
type ProofScope = 'site' | 'standalone';
const proofPath = (scope: ProofScope) =>
  `resources/evidence/018-great-ui-scale/${scope}-verification.json`;
async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(directory, entry.name))
          : Promise.resolve([path.join(directory, entry.name)]),
      ),
    )
  ).flat();
}
export async function currentDemoProof(scope: ProofScope = 'site') {
  const hash = createHash('sha256');
  const paths = [
    ...(await files('src/features/great-ui')),
    ...(await files('tests/great-ui')),
    ...(await files('tests/fixtures/great-ui')),
    ...(await files('src/lib/content')),
    ...(await files(process.env.VIBES_CONTENT_DIR || 'src/content/works')).filter((file) =>
      /\/great-ui-[^/]+\//.test(file),
    ),
    ...[
      'tests/great-ui-site.spec.ts',
      'src/components/GreatUiDetail.astro',
      'src/pages/[locale]/works/[id].astro',
      'src/layouts/Layout.astro',
      'src/pages/great-ui/content/[file].json.ts',
      'src/pages/great-ui/journeys/[id].json.ts',
      'scripts/test-e2e.ts',
      'playwright.config.ts',
      'scripts/great-ui.ts',
      'scripts/great-ui-proof.ts',
      'scripts/great-ui-test.ts',
      'playwright.great-ui.config.ts',
      'package.json',
      'package-lock.json',
    ],
  ];
  for (const file of paths.sort()) {
    hash.update(file + '\0');
    hash.update(await readFile(file));
  }
  const adapterRevision = hash.digest('hex');
  const works = capabilities.length ? validateCapabilities(capabilities) : [];
  const plans = (works.length ? (Object.keys(demoRecipes) as DemoKind[]) : []).flatMap((kind) =>
    ['normal', 'reduced'].map((motion) => demoPlan(works, kind, motion as 'normal' | 'reduced')),
  );
  let records: VerificationRecord[] = [];
  try {
    const saved = JSON.parse(await readFile(proofPath(scope), 'utf8'));
    if (
      saved.scope === scope &&
      saved.adapterRevision === adapterRevision &&
      Array.isArray(saved.records)
    )
      records = saved.records.filter((record: VerificationRecord) =>
        plans.some((plan) => verificationCurrent(plan, record, adapterRevision)),
      );
  } catch {
    /* Missing or stale local acceptance stays unverified. */
  }
  return { adapterRevision, plans, records };
}

// Called only after the complete corresponding Playwright suite succeeds.
export async function saveDemoProof(
  before: Awaited<ReturnType<typeof currentDemoProof>>,
  scope: ProofScope,
) {
  const after = await currentDemoProof(scope);
  if (
    before.adapterRevision !== after.adapterRevision ||
    JSON.stringify(before.plans) !== JSON.stringify(after.plans)
  )
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
      scope === 'site'
        ? 'tests/great-ui-site.spec.ts: all projects passed'
        : 'tests/great-ui: all projects passed',
      'tests/fixtures/great-ui/journey.ts: complete shared scenarios',
    ],
    result: 'passed',
  }));
  const proof = {
    scope,
    adapterRevision: after.adapterRevision,
    generatedAt: new Date().toISOString(),
    records,
  };
  await mkdir(path.dirname(proofPath(scope)), { recursive: true });
  await writeFile(proofPath(scope), JSON.stringify(proof, null, 2) + '\n');
  const directories =
    scope === 'site'
      ? ['dist/great-ui/content']
      : ['.scratch/great-ui-public/content', '.scratch/great-ui-dist/content'];
  for (const directory of directories) {
    await mkdir(directory, { recursive: true });
    await writeFile(directory + '/demo-proof.json', JSON.stringify(proof) + '\n');
  }
  console.log(
    `${scope}: three fixed paths verified across all configured projects; six motion-context records saved.`,
  );
}
