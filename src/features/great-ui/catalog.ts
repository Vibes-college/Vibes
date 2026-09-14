export interface CatalogItem {
  id: string;
  slug: string;
  title: string;
  english: string;
  category: string;
  summary: string;
  poster?: string;
  classification: { type: string; purpose: string[]; behavior: string[] };
}
const object = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const string = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(string);
const fields = <K extends string>(
  v: unknown,
  keys: K[],
): v is Record<K, string> & Record<string, unknown> =>
  object(v) && keys.every((key) => string(v[key]));
const slug = (v: unknown): v is string => string(v) && /^[a-z0-9-]+$/.test(v);
const media = (v: unknown) => {
  if (v === null || v === undefined) return true;
  if (typeof v !== 'string') return false;
  return (
    /^\/media\/[a-zA-Z0-9._-]+$/.test(v) ||
    /^\/great-ui\/media\/[a-z0-9._-]+$/.test(v) ||
    /^https:\/\/ik\.imagekit\.io\//.test(v) ||
    /^https:\/\/www\.great-ui\.com\/(previews|components)\/[a-zA-Z0-9._-]+$/.test(v)
  );
};
function catalogItem(value: unknown): value is CatalogItem {
  return (
    fields(value, ['id', 'title', 'english', 'category', 'summary']) &&
    slug(value.slug) &&
    object(value.classification) &&
    string(value.classification.type) &&
    strings(value.classification.purpose) &&
    value.classification.purpose.length > 0 &&
    strings(value.classification.behavior) &&
    media(value.poster)
  );
}
export function validateCatalog(value: unknown): CatalogItem[] {
  if (!Array.isArray(value) || !value.length) throw new Error('作品目录为空或格式错误。');
  const ids = new Set<string>(),
    slugs = new Set<string>();
  for (const item of value) {
    if (!catalogItem(item) || ids.has(item.id) || slugs.has(item.slug))
      throw new Error('作品目录字段缺失或标识重复。');
    ids.add(item.id);
    slugs.add(item.slug);
  }
  return value as CatalogItem[];
}

// Validate each field consumed by the renderer, including nested glossary references.
export function validateDetail(value: unknown, item: CatalogItem) {
  const fail = () => {
    throw new Error('作品材料未完整加载，请重试。');
  };
  if (
    !catalogItem(value) ||
    value.id !== item.id ||
    value.slug !== item.slug ||
    value.title !== item.title
  )
    return fail();
  const detail = value as unknown as Record<string, unknown>;
  if (
    !fields(detail, [
      'suitable',
      'avoid',
      'placementHint',
      'changesHint',
      'reference',
      'source',
      'sourceRaw',
      'previewSource',
      'revision',
      'license',
      'licenseNote',
      'licenseLabel',
      'recordingNote',
      'recordingCredit',
    ]) ||
    !/^[a-f0-9]{40}$/.test(detail.revision) ||
    detail.reference !== `https://www.great-ui.com/components/${item.slug}` ||
    !detail.source.startsWith(
      `https://github.com/Saurabh-2607/GreatUI/blob/${detail.revision}/components/ui/`,
    ) ||
    !detail.sourceRaw.startsWith(
      `https://raw.githubusercontent.com/Saurabh-2607/GreatUI/${detail.revision}/components/ui/`,
    ) ||
    !detail.previewSource.startsWith(
      `https://github.com/Saurabh-2607/GreatUI/blob/${detail.revision}/components/site/previews/`,
    ) ||
    detail.license !== `https://github.com/Saurabh-2607/GreatUI/blob/${detail.revision}/LICENSE` ||
    !media(detail.recording) ||
    !media(detail.previewRecording) ||
    !media(detail.previewImage) ||
    !strings(detail.preserve) ||
    !strings(detail.checks) ||
    !strings(detail.terms) ||
    !detail.terms.length ||
    !object(detail.glossary) ||
    !Array.isArray(detail.sections) ||
    !detail.sections.length ||
    !fields(detail.verification, ['scope', 'limitation']) ||
    !object(detail.learning)
  )
    return fail();
  for (const id of detail.terms) {
    if (
      !fields(detail.glossary[id], [
        'title',
        'english',
        'kind',
        'definition',
        'context',
        'parameter',
        'judgment',
      ])
    )
      return fail();
  }
  for (const section of detail.sections) {
    if (!fields(section, ['title', 'text'])) return fail();
    for (const match of section.text.matchAll(/\[\[([^|]+)\|[^\]]+\]\]/g)) {
      if (!detail.terms.includes(match[1])) return fail();
    }
  }
  const learning = detail.learning;
  if (
    !string(learning.practice) ||
    !Array.isArray(learning.goals) ||
    !learning.goals.length ||
    learning.goals.some((goal) => !fields(goal, ['id', 'title', 'action', 'judge'])) ||
    new Set(learning.goals.map((goal) => goal.id)).size !== learning.goals.length ||
    !Array.isArray(learning.adjustments) ||
    learning.adjustments.some((row) => !strings(row) || row.length !== 3)
  )
    return fail();
  if (detail.related !== undefined) {
    if (!object(detail.related)) return fail();
    for (const key of ['alternatives', 'principles']) {
      const related = detail.related[key];
      if (
        !Array.isArray(related) ||
        related.some(
          (row) =>
            !fields(row, ['slug', 'title']) ||
            !slug(row.slug) ||
            (key === 'principles' && !strings(row.shared)),
        )
      )
        return fail();
    }
  }
  return detail;
}
