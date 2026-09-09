import { resolve } from 'node:path';
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { assertAssetBudget, assertBudget, budgetLimits } from './budget-policy.ts';
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
console.log(
  `Native assistant complete JavaScript gzip: ${sizes.assistantTotalJavascriptGzip} bytes (diagnostic).`,
);
assertBudget(sizes);
console.table(
  Object.keys(budgetLimits).map((key) => ({
    item: key,
    bytes: sizes[key as keyof typeof sizes],
    mustBeLessThan: budgetLimits[key as keyof typeof budgetLimits],
  })),
);
console.log('体积预算通过。');
const assets = assetSizes(out);
assertAssetBudget(assets);
console.table(assets);
