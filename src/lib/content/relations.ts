import type { Catalog, Locale } from './schema.ts';

// 关联只保存一次，读取时双方均可找到；理由缺少目标语言时明确报告回退。
export function relatedWorks(catalog: Catalog, id: string, locale: Locale) {
  return catalog.works.flatMap((work) =>
    work.meta.related
      .filter((relation) => work.meta.id === id || relation.targetId === id)
      .map((relation) => ({
        id: work.meta.id === id ? relation.targetId : work.meta.id,
        reason: relation.reason[locale] || relation.reason[work.meta.originalLocale]!,
        fallbackLocale: relation.reason[locale] ? undefined : work.meta.originalLocale,
      })),
  );
}
