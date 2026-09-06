import { browsePath, workPath } from '../lib/i18n/routes.ts';
import type { WorkView } from '../lib/content/views.ts';
import type { Catalog, Locale } from '../lib/content/schema.ts';
import { escapeHtml } from '../lib/preview.ts';

export interface WorkFact {
  label: string;
  value: string;
  href?: string;
  external: boolean;
  fallbackLocale?: Locale;
}
export function workFacts(work: WorkView, catalog: Catalog): WorkFact[] {
  return work.meta.facts.map((fact) => {
    const locale =
      fact.label[work.locale] && fact.value[work.locale] ? work.locale : work.originalLocale;
    const target = fact.target;
    let href: string | undefined;
    if (target?.kind === 'link') href = target.url;
    // 只确认目录有发布内容，不为每条事实重复计算整个目录的译文摘要。
    if (
      target?.kind === 'tag' &&
      catalog.works.some(
        (entry) =>
          entry.versions[locale]?.data.status === 'published' &&
          (entry.meta.typeId === target.tagId || entry.meta.tagIds.includes(target.tagId)),
      )
    )
      href = browsePath(locale, target.tagId);
    if (target?.kind === 'anchor')
      href = `${locale === work.locale ? '' : workPath(locale, work.slug)}#${encodeURIComponent(target.anchor)}`;
    return {
      label: fact.label[locale]!,
      value: fact.value[locale]!,
      href,
      external: target?.kind === 'link',
      fallbackLocale: locale !== work.locale ? locale : undefined,
    };
  });
}
// 以Astro实际渲染出的标题身份验证锚点，不另写一套Markdown标题算法。
export function validateFactAnchors(work: WorkView, html: string): void {
  for (const fact of work.meta.facts) {
    const locale =
      fact.label[work.locale] && fact.value[work.locale] ? work.locale : work.originalLocale;
    if (
      locale !== work.locale ||
      fact.target?.kind !== 'anchor' ||
      fact.target.anchor === 'reading'
    )
      continue;
    if (!html.includes(`id="${escapeHtml(fact.target.anchor)}"`))
      throw new Error(
        `${work.slug}/${work.locale}.md: fact ${fact.key} references missing anchor ${fact.target.anchor}`,
      );
  }
}
