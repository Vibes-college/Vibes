import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
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
export const proofPath = 'resources/evidence/018-great-ui-scale/journey-verification.json';
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
export async function currentDemoProof() {
  const hash = createHash('sha256');
  const paths = [
    ...(await files('src/features/great-ui')),
    ...(await files('tests/great-ui')),
    ...[
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
  const works = validateCapabilities(capabilities);
  const plans = (Object.keys(demoRecipes) as DemoKind[]).flatMap((kind) =>
    ['normal', 'reduced'].map((motion) => demoPlan(works, kind, motion as 'normal' | 'reduced')),
  );
  let records: VerificationRecord[] = [];
  try {
    const saved = JSON.parse(await readFile(proofPath, 'utf8'));
    if (saved.adapterRevision === adapterRevision && Array.isArray(saved.records))
      records = saved.records.filter((record: VerificationRecord) =>
        plans.some((plan) => verificationCurrent(plan, record, adapterRevision)),
      );
  } catch {
    /* Missing or stale local acceptance stays unverified. */
  }
  return { adapterRevision, plans, records };
}
