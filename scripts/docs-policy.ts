import { listField, type Document } from './docs-frontmatter.ts';

export const documentReviewGuides = {
  feature: 120,
  constitution: 100,
  agents: 150,
  lessons: 30,
  code: 300,
};
const livingFiles = new Set([
  'AGENTS.md',
  'README.md',
  '.specify/memory/constitution.md',
  'docs/README.md',
  'docs/PROJECT_ANALYSIS.md',
  'specs/README.md',
  'resources/README.md',
  'docs/system/configuration.md',
  'docs/system/content-model.md',
  'docs/system/rules.md',
  'docs/system/interfaces.md',
  'docs/system/checks-and-release.md',
]);
export const featurePattern = /^docs\/features\/([a-z][a-z0-9-]*)\.md$/;
export const specPattern = /^specs\/(\d{3}-[a-z0-9-]+)\//;

// 明确区分产品文章和上游资产；只有这些非治理Markdown使用自身格式。
export function isExempt(path: string): boolean {
  return (
    // Git冻结基线仍可能包含迁移前文章；它们也不是治理文档。
    path.startsWith('src/content/articles/') ||
    /^src\/content\/works\/[a-z0-9-]+\/(zh|en)\.md$/.test(path) ||
    path.startsWith('.agents/skills/speckit-') ||
    (path.startsWith('.specify/templates/') && !path.startsWith('.specify/templates/overrides/')) ||
    path.startsWith('.specify/integrations/') ||
    path.startsWith('.specify/workflows/')
  );
}

// 统计实际物理行，包含元数据、空行和代码块。
export function countLines(source: string): number {
  return source.replace(/\n$/, '').split('\n').length;
}

// 按白名单和规格声明识别文档时态，不接受任意目录或扩展产物。
export function expectedTense(path: string, documents: Map<string, Document>): string | undefined {
  if (
    livingFiles.has(path) ||
    featurePattern.test(path) ||
    path === 'docs/features/README.md' ||
    path === 'docs/features/_TEMPLATE.md' ||
    /^\.specify\/templates\/overrides\/[a-z-]+-template\.md$/.test(path)
  )
    return 'living';
  if (path === 'docs/LESSONS.md') return 'frozen';
  const folder = path.match(specPattern)?.[1];
  if (!folder) return undefined;
  const relative = path.slice(`specs/${folder}/`.length);
  if (
    /^(spec|plan|tasks|research)\.md$/.test(relative) ||
    /^checklists\/[a-z0-9-]+\.md$/.test(relative)
  )
    return 'frozen';
  if (!/^(data-model\.md|quickstart\.md|contracts\/[a-z0-9-]+\.md)$/.test(relative))
    return undefined;
  const spec = documents.get(`specs/${folder}/spec.md`);
  if (!spec) return undefined;
  const approved = listField(spec, 'approved-artifacts');
  return approved.includes(relative) && spec.body.includes(relative) ? 'frozen' : undefined;
}

// 检查每份治理文档的元数据、状态、时态与可选日期。
export function validateDocument(doc: Document, documents: Map<string, Document>): void {
  const expected = expectedTense(doc.path, documents);
  if (!expected) throw new Error(`${doc.path}: 不在文档白名单，额外产物需spec列明用途`);
  if (
    doc.meta.tense !== expected ||
    typeof doc.meta.describes !== 'string' ||
    !doc.meta.describes.trim()
  ) {
    throw new Error(`${doc.path}: tense/describes无效，应为${expected}`);
  }
  const statuses =
    expected === 'living'
      ? ['current', 'stale']
      : ['draft', 'in-progress', 'complete', 'merged', 'superseded'];
  if (!statuses.includes(String(doc.meta.status))) throw new Error(`${doc.path}: status无效`);
  listField(doc, expected === 'living' ? 'shaped-by' : 'amended-by');
  if (
    expected === 'frozen' &&
    doc.meta['frozen-at'] !== undefined &&
    (typeof doc.meta['frozen-at'] !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(doc.meta['frozen-at']) ||
      Number.isNaN(Date.parse(doc.meta['frozen-at'])) ||
      new Date(doc.meta['frozen-at']).toISOString().slice(0, 10) !== doc.meta['frozen-at'])
  )
    throw new Error(`${doc.path}: frozen-at须为真实有效日期；未知时省略`);
}

// 篇幅只触发人工审阅提示，不以行数或决策数量拒绝正确文档。
export function reviewDocumentSize(doc: Document): string | undefined {
  const limit =
    doc.path === 'AGENTS.md'
      ? documentReviewGuides.agents
      : doc.path === '.specify/memory/constitution.md'
        ? documentReviewGuides.constitution
        : doc.path.startsWith('docs/features/')
          ? documentReviewGuides.feature
          : undefined;
  const lines = countLines(doc.source);
  if (limit && lines > limit)
    return `${doc.path}: ${lines}行，建议审阅职责、重复及导航，不机械裁剪`;
  if (
    doc.path === 'docs/LESSONS.md' &&
    (doc.body.match(/^## L-\d{3}\b/gm)?.length ?? 0) > documentReviewGuides.lessons
  ) {
    return `${doc.path}: 条目较多，审阅索引；禁止删除或改写冻结记录凑数量`;
  }
  return undefined;
}
