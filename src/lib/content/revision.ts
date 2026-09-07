import { createHash } from 'node:crypto';
import type { CatalogWork, Locale } from './schema.ts';

// 固定属性顺序和换行，摘要只代表影响原文理解的内容，不包含排序或其他译文。
function canonical(value: unknown): string {
  if (typeof value === 'string')
    return JSON.stringify(value.replace(/\r\n?/g, '\n').normalize('NFC'));
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
export function sourceRevision(work: CatalogWork): string {
  const locale = work.meta.originalLocale;
  const original = work.versions[locale];
  if (!original) throw new Error(`${work.meta.id}: missing original language`);
  return createHash('sha256')
    .update(
      canonical({
        locale,
        body: original.body,
        title: original.data.title,
        summary: original.data.summary,
        description: original.data.description,
        previewText: original.data.previewText,
        ...(work.meta.media?.length
          ? {
              media: work.meta.media,
              presentation: work.meta.presentation,
              mediaText: original.data.mediaText,
            }
          : {}),
        sourceUrl: work.meta.sourceUrl,
        typeId: work.meta.typeId,
        tagIds: [...work.meta.tagIds].sort(),
        facts: work.meta.facts.map((fact) => ({
          key: fact.key,
          kind: fact.kind,
          label: fact.label[locale],
          value: fact.value[locale],
          target: fact.target,
        })),
      }),
    )
    .digest('hex');
}
export function needsReview(work: CatalogWork, locale: Locale): boolean {
  const version = work.versions[locale];
  return Boolean(
    version &&
    locale !== work.meta.originalLocale &&
    version.data.status === 'published' &&
    version.data.sourceRevision !== sourceRevision(work),
  );
}
