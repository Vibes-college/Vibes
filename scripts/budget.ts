import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { assertBudget, budgetLimits } from './budget-policy.ts';
import { measureScriptBudget } from './script-budget.ts';
import { assetSizes } from './asset-sizes.ts';

const sizes = {
  ...measureScriptBudget('dist'),
  homepageGzip: Math.max(
    ...['zh', 'en'].map((locale) => gzipSync(readFileSync(`dist/${locale}/index.html`)).length),
  ),
  interactionSource: statSync('src/scripts/explore.ts').size,
};
assertBudget(sizes);
console.table(
  Object.keys(budgetLimits).map((key) => ({
    item: key,
    bytes: sizes[key as keyof typeof sizes],
    mustBeLessThan: budgetLimits[key as keyof typeof budgetLimits],
  })),
);
console.log('体积预算通过。');
console.table(assetSizes('dist'));
