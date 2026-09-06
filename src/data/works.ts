import { readCatalog } from '../lib/content/catalog.ts';
import { publishedWorks, browsePages, type WorkView } from '../lib/content/views.ts';
import { locales, type Locale } from '../lib/i18n/routes.ts';

export type Work = WorkView;
export const catalog = readCatalog();
const localizedWorks = Object.fromEntries(
  locales.map((locale) => [locale, publishedWorks(catalog, locale)]),
) as Record<Locale, WorkView[]>;
const localizedPages = Object.fromEntries(
  locales.map((locale) => [locale, browsePages(catalog, locale)]),
) as Record<Locale, ReturnType<typeof browsePages>>;
export function getWorks(locale: Locale): WorkView[] {
  return localizedWorks[locale];
}
export function getBrowsePages(locale: Locale) {
  return localizedPages[locale];
}
