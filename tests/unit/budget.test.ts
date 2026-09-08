import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertBudget, budgetLimits } from '../../scripts/budget-policy.ts';

// 验证合法产物可通过，但任何单项达到上限或无效计量都会失败。
test('budget rejects each oversized or invalid measurement', () => {
  const small = {
    javascriptGzip: 100,
    mdxJavascriptGzip: 100,
    mediaJavascriptGzip: 100,
    assistantJavascriptGzip: 100,
    homepageGzip: 200,
    interactionSource: 300,
    largestOptimizedImage: 400,
  };
  assert.doesNotThrow(() => assertBudget(small));
  for (const key of Object.keys(budgetLimits) as (keyof typeof budgetLimits)[]) {
    for (const value of [budgetLimits[key], budgetLimits[key] + 1, NaN, -1]) {
      assert.throws(() => assertBudget({ ...small, [key]: value }), /bytes/);
    }
  }
});

import { assertAssetBudget, assetLimits } from '../../scripts/budget-policy.ts';
test('asset budget distinguishes free and paid counts without weakening individual file limit', () => {
  assert.doesNotThrow(() =>
    assertAssetBudget({ fileCount: 20000, largestFile: assetLimits.fileBytes }),
  );
  assert.throws(() => assertAssetBudget({ fileCount: 20001, largestFile: 100 }));
  assert.doesNotThrow(() => assertAssetBudget({ fileCount: 20001, largestFile: 100 }, true));
  assert.throws(() => assertAssetBudget({ fileCount: 100001, largestFile: 100 }, true));
  for (const value of [0, NaN, Infinity, assetLimits.fileBytes + 1])
    assert.throws(() => assertAssetBudget({ fileCount: 1, largestFile: value }, true));
});
