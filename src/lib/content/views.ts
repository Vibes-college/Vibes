import { needsReview } from './revision.ts';
import type { Catalog, CatalogWork, Locale, WorkMetadata } from './schema.ts';
import { workPath, browsePath, pageSize } from '../i18n/routes.ts';

export interface WorkView {
  slug: string;
  locale: Locale;
  originalLocale: Locale;
  type: string;
  creator: string;
  url: string;
  title: string;
  summary: string;
  description: string;
  preview: WorkMetadata['preview']['kind'];
  color: string;
  eyebrow: string;
  display: string;
  note: string;
  meta: WorkMetadata;
  needsReview: boolean;
}
export function viewWork(work: CatalogWork, locale: Locale): WorkView | undefined {
  const version = work.versions[locale];
  if (!version || version.data.status !== 'published') return undefined;
  const creator = work.meta.facts.find((fact) => fact.kind === 'author');
  return {
    slug: work.meta.id,
    locale,
    originalLocale: work.meta.originalLocale,
    type: work.meta.typeId,
    creator: creator?.value[locale] || creator?.value[work.meta.originalLocale] || '',
    url: work.meta.sourceUrl,
    title: version.data.title,
    summary: version.data.summary,
    description: version.data.description,
    preview: work.meta.preview.kind,
    color: work.meta.preview.color,
    ...version.data.previewText,
    meta: work.meta,
    needsReview: needsReview(work, locale),
  };
}
export function publishedWorks(catalog: Catalog, locale: Locale, tag?: string): WorkView[] {
  return catalog.works
    .filter((work) => !tag || work.meta.typeId === tag || work.meta.tagIds.includes(tag))
    .map((work) => viewWork(work, locale))
    .filter((work): work is WorkView => Boolean(work));
}
export function adjacentWorks(works: WorkView[], id: string) {
  const index = works.findIndex((work) => work.slug === id);
  return {
    previous: index > 0 ? works[index - 1] : undefined,
    next: index >= 0 ? works[index + 1] : undefined,
  };
}
export function languageTarget(catalog: Catalog, id: string, target: Locale) {
  const work = catalog.works.find((entry) => entry.meta.id === id);
  if (!work) return undefined;
  return {
    href: viewWork(work, target) ? workPath(target, id) : undefined,
    originalHref: workPath(work.meta.originalLocale, id),
  };
}
export interface BrowsePage {
  locale: Locale;
  tag?: string;
  page: number;
  total: number;
  pages: number;
  works: WorkView[];
  path: string;
}
// 每个目录只生成有限卡片；路由表从实际发布集合产生，越界页面不会生成。
export function browsePages(catalog: Catalog, locale: Locale): BrowsePage[] {
  const pages: BrowsePage[] = [];
  for (const tag of [undefined, ...catalog.taxonomy.map((entry) => entry.id)]) {
    const works = publishedWorks(catalog, locale, tag);
    if (tag && !works.length) continue;
    const count = Math.max(1, Math.ceil(works.length / pageSize));
    for (let page = 1; page <= count; page++)
      pages.push({
        locale,
        tag,
        page,
        total: works.length,
        pages: count,
        works: works.slice((page - 1) * pageSize, page * pageSize),
        path: browsePath(locale, tag, page),
      });
  }
  return pages;
}
