export const budgetLimits = {
  javascriptGzip: 15_000,
  homepageGzip: 40_000,
  interactionSource: 12_000,
} as const;

// Cloudflare Workers官方限制，2026-09-05核对；不把付费容量作为账户默认值。
export const assetLimits = { freeFiles: 20_000, paidFiles: 100_000, fileBytes: 25 * 1024 * 1024 };
export function assertAssetBudget(sizes: { fileCount: number; largestFile: number }, paid = false) {
  const limit = paid ? assetLimits.paidFiles : assetLimits.freeFiles;
  if (!Number.isInteger(sizes.fileCount) || sizes.fileCount < 1 || sizes.fileCount > limit)
    throw new Error(`Asset count ${sizes.fileCount} exceeds ${limit} or is invalid`);
  if (
    !Number.isFinite(sizes.largestFile) ||
    sizes.largestFile < 1 ||
    sizes.largestFile > assetLimits.fileBytes
  )
    throw new Error(`Asset size ${sizes.largestFile} exceeds 25 MiB or is invalid`);
}

// 检查体积是否严格低于上限，防止构建产物悄悄变大。
export function assertBudget(sizes: Record<keyof typeof budgetLimits, number>) {
  for (const key of Object.keys(budgetLimits) as (keyof typeof budgetLimits)[]) {
    if (!Number.isFinite(sizes[key]) || sizes[key] < 0 || sizes[key] >= budgetLimits[key]) {
      throw new Error(`${key}: ${sizes[key]} bytes，必须小于 ${budgetLimits[key]} bytes`);
    }
  }
}
