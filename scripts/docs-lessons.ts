import type { Document } from './docs-frontmatter.ts';

// 固定三行和证据约束帮助经验转化；不把自然语言原因当作机器可证明事实。
export function validateLessons(doc: Document): void {
  const lines = doc.body.split('\n');
  let section = '';
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) section = lines[i].slice(3);
    if (!lines[i].startsWith('- ')) continue;
    count++;
    const first = lines[i].match(/^- \[(\d{4}-\d{2}-\d{2})\] 现象：.+｜证据：.+$/);
    const reason = lines[i + 1] ?? '';
    const action = lines[i + 2] ?? '';
    if (
      !first ||
      !/^ {2}原因：\S.+$/.test(reason) ||
      !/^ {2}转化：\S.+｜状态：(待转化|已转化)$/.test(action)
    )
      throw new Error(`${doc.path}: 每条经验须固定三行，包含日期、现象、证据、原因、转化及状态`);
    if (
      Number.isNaN(Date.parse(first[1])) ||
      new Date(first[1]).toISOString().slice(0, 10) !== first[1]
    )
      throw new Error(`${doc.path}: 经验日期无效`);
    if (!['待转化', '已转化'].includes(section) || !action.endsWith(`状态：${section}`))
      throw new Error(`${doc.path}: 经验栏目与状态不符`);
    if (section === '已转化' && !/｜验证：.+｜转化日期：\d{4}-\d{2}-\d{2}｜/.test(action))
      throw new Error(`${doc.path}: 已转化经验须有措施、验证证据和转化日期`);
    if (/^\s+\S/.test(lines[i + 3] ?? '')) throw new Error(`${doc.path}: 经验不可扩展为四行故事`);
    i += 2;
  }
  if (count > 30) throw new Error(`${doc.path}: 超过30条，先整理重复与到期经验`);
}
