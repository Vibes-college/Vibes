import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { assertBudget, budgetLimits } from './budget-policy.ts';
import { assetSizes } from './asset-sizes.ts';

const files = readdirSync('dist/_astro').filter((file) => file.endsWith('.js'));
if (files.length === 0) throw new Error('构建缺少浏览器脚本，不能把空产物算作通过。');
const sizes = {
  javascriptGzip: files.reduce(
    (total, file) => total + gzipSync(readFileSync(`dist/_astro/${file}`)).length,
    0,
  ),
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
