const dialog = document.querySelector<HTMLDialogElement>('#work-dialog')!;
const content = document.querySelector<HTMLElement>('#dialog-content')!;
const grid = document.querySelector<HTMLElement>('.work-grid')!;
const cards = Array.from(grid.querySelectorAll<HTMLElement>('.work-card'));
const search = document.querySelector<HTMLInputElement>('#search')!;
const form = document.querySelector<HTMLFormElement>('.search')!;
const count = document.querySelector<HTMLElement>('#result-count')!;
const clear = document.querySelector<HTMLButtonElement>('.search-clear')!;
const empty = document.querySelector<HTMLElement>('.empty-state')!;
const end = document.querySelector<HTMLElement>('.collection-end')!;
const baseTitle = document.title;
let returnFocus: HTMLElement | null = null;
let closing = false;

// Only enhance working HTML links once the small interaction script is ready.
document.querySelector<HTMLElement>('[data-enhanced]')!.hidden = false;
function filter(updateUrl = true) {
  const query = search.value.trim().toLocaleLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  const type = document.querySelector<HTMLInputElement>('input[name="format"]:checked')!.value;
  const sort = document.querySelector<HTMLInputElement>('input[name="sort"]:checked')!.value;
  const ordered = [...cards].sort((a,b) => sort === 'title'
    ? a.dataset.title!.localeCompare(b.dataset.title!, 'en')
    : Number(a.dataset.index) - Number(b.dataset.index));
  let visible = 0;
  for (const card of ordered) {
    card.hidden = (type !== 'all' && card.dataset.type !== type) || !terms.every(term => card.dataset.search!.includes(term));
    if (!card.hidden) visible++;
    grid.append(card);
  }
  count.textContent = String(visible);
  count.parentElement!.lastChild!.textContent = visible === 1 ? ' thing to explore' : ' things to explore';
  empty.hidden = visible !== 0;
  end.hidden = visible === 0;
  clear.hidden = search.value.length === 0;
  if (updateUrl) {
    const url = new URL(location.href);
    url.search = '';
    if (query) url.searchParams.set('q', search.value.trim());
    if (type !== 'all') url.searchParams.set('type', type);
    if (sort !== 'curated') url.searchParams.set('sort', sort);
    history.replaceState(history.state, '', url);
  }
}
function restoreFilters() {
  const params = new URLSearchParams(location.search);
  search.value = (params.get('q') || '').slice(0, 160);
  for (const name of ['format', 'sort']) {
    const value = params.get(name === 'format' ? 'type' : name) || (name === 'format' ? 'all' : 'curated');
    const inputs = [...document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];
    (inputs.find(input => input.value === value) || inputs[0]).checked = true;
  }
  filter(false);
}
function showDetail(slug: string, opener?: HTMLElement) {
  const template = document.getElementById(`detail-${slug}`);
  if (!(template instanceof HTMLTemplateElement)) return;
  content.replaceChildren(template.content.cloneNode(true));
  if (opener) returnFocus = opener;
  dialog.setAttribute('aria-labelledby', `title-${slug}`);
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  document.title = `${content.querySelector('h1')!.textContent} — Vibes`;
  content.querySelector<HTMLElement>('h1')!.focus({ preventScroll: true });
}
function hideDetail() {
  if (dialog.open) dialog.close();
  document.title = baseTitle;
  returnFocus?.focus({ preventScroll: true });
  closing = false;
}
function closeDetail() {
  if (closing) return;
  closing = true;
  if (history.state?.vibesDetail) history.back();
  else hideDetail();
}
grid.addEventListener('click', event => {
  const e = event as MouseEvent;
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[data-work]');
  if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (!document.getElementById(`detail-${link.dataset.work}`)) return;
  e.preventDefault();
  showDetail(link.dataset.work!, link);
  history.pushState({ vibesDetail: link.dataset.work }, '', link.href);
});
document.querySelector('#dialog-close')!.addEventListener('click', closeDetail);
document.querySelector('#dialog-back')!.addEventListener('click', event => { event.preventDefault(); closeDetail(); });
dialog.addEventListener('cancel', event => { event.preventDefault(); closeDetail(); });
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const {left,right,top,bottom} = dialog.getBoundingClientRect();
  if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) closeDetail();
});
window.addEventListener('popstate', () => {
  const slug = history.state?.vibesDetail;
  if (slug) showDetail(slug);
  else { restoreFilters(); hideDetail(); }
});
search.addEventListener('input', () => filter());
form.addEventListener('submit', event => { event.preventDefault(); filter(); });
form.addEventListener('reset', event => { event.preventDefault(); search.value = ''; filter(); search.focus(); });
document.querySelector('.browse-controls')!.addEventListener('change', () => filter());
document.querySelector('#reset-filters')!.addEventListener('click', () => {
  search.value = '';
  document.querySelector<HTMLInputElement>('input[name="format"][value="all"]')!.checked = true;
  document.querySelector<HTMLInputElement>('input[name="sort"][value="curated"]')!.checked = true;
  filter(); search.focus();
});
restoreFilters();
