export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';
export const languageNames = { zh: '中文', en: 'English' } as const;
export const htmlLanguages = { zh: 'zh-CN', en: 'en' } as const;
export const pageSize = 24;

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
export function workPath(locale: Locale, id: string): string {
  return `/${locale}/works/${encodeURIComponent(id)}/`;
}
export function browsePath(locale: Locale, tag?: string, page = 1): string {
  const base = tag ? `/${locale}/tags/${encodeURIComponent(tag)}/` : `/${locale}/`;
  return page > 1 ? `${base}page/${page}/` : base;
}
export function withQuery(path: string, query: string): string {
  return query ? `${path}?q=${encodeURIComponent(query.slice(0, 160))}` : path;
}
