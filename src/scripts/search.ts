import { legacyCardHtml } from '../lib/work-card';
import { type PreviewData } from '../lib/preview';
import { workPath, htmlLanguages, type Locale } from '../lib/i18n/routes';

interface ResultData {
  url: string;
  meta: Record<string, string>;
}
export interface SearchResult {
  id: string;
  data: () => Promise<ResultData>;
}
interface Pagefind {
  init: () => Promise<void>;
  destroy: () => Promise<void>;
  search: (
    query: string,
    options?: { filters: { tag: string } },
  ) => Promise<{ results: SearchResult[] }>;
}
const libraries = new Map<Locale, Promise<Pagefind>>();
let attempt = 0;

// 各语言独立实例；重试只销毁失败语言，不影响仍在结束的另一语言请求。
export async function resetSearch(locale: Locale): Promise<void> {
  const previous = libraries.get(locale);
  libraries.delete(locale);
  attempt++;
  if (previous) await previous.then((instance) => instance.destroy()).catch(() => {});
}

export function prepareSearch(locale: Locale): Promise<Pagefind> {
  const existing = libraries.get(locale);
  if (existing) return existing;
  const url = `/pagefind/pagefind.js${attempt ? `?retry=${attempt}` : ''}`;
  const pending = import(/* @vite-ignore */ url)
    .then(async (module: { createInstance: () => Pagefind }) => {
      // Pagefind在实例创建时读取html.lang；离开页面后的迟到import不能选错语言。
      if (document.documentElement.lang !== htmlLanguages[locale])
        throw new DOMException('Search page changed', 'AbortError');
      const instance = module.createInstance();
      try {
        await instance.init();
        return instance;
      } catch (error) {
        await instance.destroy();
        throw error;
      }
    })
    .catch((error: unknown) => {
      if (libraries.get(locale) === pending) libraries.delete(locale);
      if (!(error instanceof DOMException && error.name === 'AbortError')) attempt++;
      throw error;
    });
  libraries.set(locale, pending);
  return pending;
}
export async function searchWorks(
  query: string,
  tag: string,
  locale: Locale,
): Promise<SearchResult[]> {
  const pagefind = await prepareSearch(locale);
  return (await pagefind.search(query, tag ? { filters: { tag } } : undefined)).results;
}
// 对索引返回值也验证站内语言和身份；所有内容字符串统一转义后才组成卡片。
export async function renderResults(results: SearchResult[], locale: Locale): Promise<string> {
  const values = await Promise.all(results.map((result) => result.data()));
  return (
    await Promise.all(
      values.map(async ({ url, meta }) => {
        if (!meta.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.id))
          throw new Error('Invalid search result id');
        const target = new URL(url, location.origin);
        const path = workPath(locale, meta.id);
        if (target.origin !== location.origin || target.pathname !== path)
          throw new Error('Search result is outside the current language');
        const preview: PreviewData = {
          preview: meta.preview as PreviewData['preview'],
          color: meta.color,
          eyebrow: meta.eyebrow || '',
          display: meta.display || meta.title,
          note: meta.note || '',
        };
        const work = {
          ...preview,
          slug: meta.id,
          type: meta.type || '',
          title: meta.title,
          summary: meta.summary || meta.title,
        };
        if (!meta.mediaCard) return legacyCardHtml(work, locale);
        const { workCardHtml, parseCard } = await import('./media');
        return workCardHtml({ ...work, mediaCard: parseCard(meta.mediaCard) }, locale);
      }),
    )
  ).join('');
}
