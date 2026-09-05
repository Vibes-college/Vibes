export const budgetLimits = {
  javascriptGzip: 10_000,
  homepageGzip: 40_000,
  interactionSource: 12_000,
} as const;

// 检查体积是否严格低于上限，防止构建产物悄悄变大。
export function assertBudget(sizes: Record<keyof typeof budgetLimits, number>) {
  for (const key of Object.keys(budgetLimits) as (keyof typeof budgetLimits)[]) {
    if (!Number.isFinite(sizes[key]) || sizes[key] < 0 || sizes[key] >= budgetLimits[key]) {
      throw new Error(`${key}: ${sizes[key]} bytes，必须小于 ${budgetLimits[key]} bytes`);
    }
  }
}
