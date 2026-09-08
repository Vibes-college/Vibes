import { resolve } from 'node:path';
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { assertBudget, assertAssistantBudget, budgetLimits } from './budget-policy.ts';
import { measureScriptBudget } from './script-budget.ts';
import { assetSizes } from './asset-sizes.ts';

const out = process.env.VIBES_OUT_DIR || 'dist';
if (process.env.VIBES_OUT_DIR && !resolve(out).startsWith(resolve('.scratch') + '/'))
  throw new Error('Isolated budget output must remain under .scratch/.');
const sizes = {
  ...measureScriptBudget(out),
  homepageGzip: Math.max(
    ...['zh', 'en'].map((locale) => gzipSync(readFileSync(`${out}/${locale}/index.html`)).length),
  ),
  interactionSource: statSync('src/scripts/explore.ts').size,
  largestOptimizedImage: JSON.parse(readFileSync(`${out}/image-manifest.json`, 'utf8'))
    .largestOutputBytes,
};
console.table(
  Object.keys(budgetLimits).map((key) => ({
    item: key,
    bytes: sizes[key as keyof typeof sizes],
    mustBeLessThan: budgetLimits[key as keyof typeof budgetLimits],
  })),
);
if (process.env.VIBES_PASEO_PROFILE) {
  const baseline = JSON.parse(readFileSync('third_party/paseo-webui/budget-baseline.json', 'utf8'));
  console.table({
    assistantInitialUpperBoundGzip: sizes.assistantInitialJavascriptGzip,
    assistantTotalGzip: sizes.assistantTotalJavascriptGzip,
    initialTarget: baseline.candidateInitialGzipTarget,
    totalMaximum: baseline.candidateTotalGzipMaximum,
  });
  // H is intentionally expected to fail the final candidate gate. Measurements
  // are printed before either gate so failures cannot masquerade as empty output.
  assertAssistantBudget(sizes, baseline);
}
assertBudget(sizes);
console.log('体积预算通过。');
console.table(assetSizes(out));
