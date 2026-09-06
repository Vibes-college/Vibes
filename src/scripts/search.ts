import { previewHtml, escapeHtml, type PreviewData } from '../lib/preview';
import { workPath, type Locale } from '../lib/i18n/routes';

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
let library: Promise<Pagefind> | undefined;
let attempt = 0;

// 重建索引实例，释放失败的分片请求缓存；旧请求仍由界面的序号隔离。
export async function resetSearch(): Promise<void> {
  const previous = library;
  library = undefined;
  attempt++;
  if (previous) await previous.then((module) => module.destroy()).catch(() => {});
}

// 只有搜索意图才加载；失败后允许显式重试，不保留永久失败的初始化Promise。
export function prepareSearch(): Promise<Pagefind> {
  if (!library) {
    const url = `/pagefind/pagefind.js${attempt ? `?retry=${attempt}` : ''}`;
    library = import(/* @vite-ignore */ url)
      .then(async (module: Pagefind) => {
        await module.init();
        return module;
      })
      .catch((error: unknown) => {
        library = undefined;
        attempt++;
        throw error;
      });
  }
  return library;
}
export async function searchWorks(query: string, tag: string): Promise<SearchResult[]> {
  const pagefind = await prepareSearch();
  return (await pagefind.search(query, tag ? { filters: { tag } } : undefined)).results;
}
// 对索引返回值也验证站内语言和身份；所有内容字符串统一转义后才组成卡片。
export async function renderResults(results: SearchResult[], locale: Locale): Promise<string> {
  const values = await Promise.all(results.map((result) => result.data()));
  return values
    .map(({ url, meta }) => {
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
      return `<li class="work-card" data-type="${escapeHtml(meta.type || '')}"><a class="card-link" href="${path}" data-work="${meta.id}" aria-label="Explore ${escapeHtml(meta.title)}">${previewHtml(preview)}<p class="card-summary">${escapeHtml(meta.summary || meta.title)}</p></a></li>`;
    })
    .join('');
}
