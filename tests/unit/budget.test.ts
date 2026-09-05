import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertBudget, budgetLimits } from '../../scripts/budget-policy.ts';

// 验证合法产物可通过，但任何单项达到上限或无效计量都会失败。
test('budget rejects each oversized or invalid measurement', () => {
  const small = { javascriptGzip: 100, homepageGzip: 200, interactionSource: 300 };
  assert.doesNotThrow(() => assertBudget(small));
  for (const key of Object.keys(budgetLimits) as (keyof typeof budgetLimits)[]) {
    for (const value of [budgetLimits[key], budgetLimits[key] + 1, NaN, -1]) {
      assert.throws(() => assertBudget({ ...small, [key]: value }), /bytes/);
    }
  }
});
