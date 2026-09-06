import { isLocale, withQuery, browsePath, pageSize } from '../lib/i18n/routes';
import type { SearchResult } from './search';

const root = document.querySelector<HTMLElement>('.explore-main')!;
const localeValue = root.dataset.locale || '';
if (!isLocale(localeValue)) throw new Error('Unknown page language');
const locale = localeValue;
const tag = root.dataset.tag || '';
const hasContent = root.dataset.hasContent === 'true';
const t = JSON.parse(root.dataset.messages!) as Record<string, string>;
const browseGrid = root.querySelector<HTMLElement>('[data-browse-grid]')!;
const searchGrid = root.querySelector<HTMLElement>('[data-search-grid]')!;
const search = document.querySelector<HTMLInputElement>('#search')!;
const form = document.querySelector<HTMLFormElement>('.search')!;
const count = root.querySelector<HTMLElement>('#result-count')!;
const clear = form.querySelector<HTMLButtonElement>('.search-clear')!;
const empty = root.querySelector<HTMLElement>('.empty-state')!;
const end = root.querySelector<HTMLElement>('.collection-end')!;
const pagination = root.querySelector<HTMLElement>('[data-pagination]')!;
const paginationHidden = pagination.hidden;
const status = root.querySelector<HTMLElement>('.search-status')!;
const statusText = status.querySelector<HTMLElement>('p')!;
const retry = root.querySelector<HTMLButtonElement>('[data-retry]')!;
const more = root.querySelector<HTMLButtonElement>('[data-more]')!;
let sequence = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let results: SearchResult[] = [];
let shown = 0;
let client: Promise<typeof import('./search')> | undefined;
let clientFailed = false;

function loadClient() {
  return (client ||= import('./search').catch((error: unknown) => {
    client = undefined;
    clientFailed = true;
    throw error;
  }));
}
function rememberURL() {
  try {
    sessionStorage.setItem(`explore:${locale}`, location.pathname + location.search);
  } catch {
    /* Browser storage may be disabled. */
  }
}
function updateLinks() {
  const query = search.value.trim();
  for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
    '.category-nav a, .language-switch a',
  )) {
    const url = new URL(anchor.href);
    anchor.href = withQuery(url.pathname, query);
  }
}
function showState(message: string, failed = false) {
  status.hidden = !message;
  statusText.textContent = message;
  retry.hidden = !failed;
  root.setAttribute('aria-busy', String(Boolean(message) && !failed));
}
async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Search timed out')), 15000);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
function restoreBrowse() {
  browseGrid.hidden = false;
  searchGrid.hidden = true;
  searchGrid.replaceChildren();
  pagination.hidden = paginationHidden;
  more.hidden = true;
  end.hidden = false;
  empty.hidden = Number(root.dataset.total) > 0;
  if (!empty.hidden) empty.querySelector('h2')!.textContent = t.noPublished;
  showState('');
  count.textContent = `${root.dataset.total} ${t.selections}`;
}
async function showNext(ticket: number) {
  more.disabled = true;
  try {
    const html = await bounded(
      loadClient().then((module) =>
        module.renderResults(results.slice(shown, shown + pageSize), locale),
      ),
    );
    if (ticket !== sequence) return;
    searchGrid.insertAdjacentHTML('beforeend', html);
    shown += Math.min(pageSize, results.length - shown);
    more.hidden = shown >= results.length;
    more.disabled = false;
    showState('');
    count.textContent = `${results.length} ${t.selections}`;
  } catch {
    if (ticket === sequence) {
      more.disabled = false;
      showState(t.failed, true);
    }
  }
}
async function runSearch() {
  const ticket = ++sequence;
  const query = search.value.trim();
  if (!query) {
    restoreBrowse();
    return;
  }
  browseGrid.hidden = true;
  searchGrid.hidden = false;
  searchGrid.replaceChildren();
  pagination.hidden = true;
  more.hidden = true;
  empty.hidden = true;
  end.hidden = true;
  showState(t.loading);
  try {
    const found = hasContent
      ? await bounded(loadClient().then((module) => module.searchWorks(query, tag)))
      : [];
    if (ticket !== sequence) return;
    results = found;
    shown = 0;
    if (!results.length) {
      showState('');
      empty.hidden = false;
      empty.querySelector('h2')!.textContent = t.emptyTitle;
      empty.querySelector<HTMLButtonElement>('#reset-filters')!.hidden = false;
      count.textContent = `0 ${t.selections}`;
      return;
    }
    await showNext(ticket);
  } catch {
    if (ticket === sequence) showState(t.failed, true);
  }
}
function changeQuery() {
  sequence++;
  clearTimeout(timer);
  search.value = search.value.slice(0, 160);
  clear.hidden = !search.value;
  history.replaceState(history.state, '', withQuery(location.pathname, search.value.trim()));
  rememberURL();
  updateLinks();
  if (!search.value.trim()) {
    restoreBrowse();
    return;
  }
  timer = setTimeout(() => {
    void runSearch();
  }, 150);
}
function restoreURL() {
  search.value = (new URLSearchParams(location.search).get('q') || '').slice(0, 160);
  clear.hidden = !search.value;
  rememberURL();
  updateLinks();
  // A bookmarked search is itself search intent; a normal homepage still loads no search resources.
  if (search.value.trim()) {
    search.focus();
    void runSearch();
  } else restoreBrowse();
}
search.addEventListener('focus', () => {
  if (hasContent)
    void loadClient()
      .then((module) => module.prepareSearch())
      .catch(() => {
        /* A query or retry exposes the failure. */
      });
});
search.addEventListener('input', changeQuery);
form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearTimeout(timer);
  void runSearch();
});
form.addEventListener('reset', (event) => {
  event.preventDefault();
  search.value = '';
  changeQuery();
  search.focus();
});
root.querySelector('#reset-filters')!.addEventListener('click', () => {
  if (tag) location.assign(browsePath(locale));
  else {
    search.value = '';
    changeQuery();
    search.focus();
  }
});
retry.addEventListener('click', () => {
  // 浏览器模块映射会缓存脚本下载失败；刷新重建映射，q已保存在URL中。
  if (clientFailed) {
    location.reload();
    return;
  }
  const ticket = ++sequence;
  showState(t.loading);
  void bounded(loadClient().then((module) => module.resetSearch()))
    .then(() => {
      if (ticket === sequence) void runSearch();
    })
    .catch(() => {
      if (ticket === sequence) showState(t.failed, true);
    });
});
more.addEventListener('click', () => {
  void showNext(sequence);
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted) restoreURL();
});
window.addEventListener('popstate', restoreURL);

const legacyType = new URLSearchParams(location.search).get('type');
const legacyLink = [...document.querySelectorAll<HTMLAnchorElement>('.category-nav a')].find(
  (link) => new URL(link.href).pathname === browsePath(locale, legacyType || undefined),
);
if (legacyType && legacyType !== 'all' && legacyLink && !tag)
  location.replace(
    withQuery(
      new URL(legacyLink.href).pathname,
      new URLSearchParams(location.search).get('q') || '',
    ),
  );
else restoreURL();
