const grid = document.querySelector<HTMLElement>('.work-grid')!;
const cards = Array.from(grid.querySelectorAll<HTMLElement>('.work-card'));
const search = document.querySelector<HTMLInputElement>('#search')!;
const form = document.querySelector<HTMLFormElement>('.search')!;
const count = document.querySelector<HTMLElement>('#result-count')!;
const clear = document.querySelector<HTMLButtonElement>('.search-clear')!;
const empty = document.querySelector<HTMLElement>('.empty-state')!;
const end = document.querySelector<HTMLElement>('.collection-end')!;

// Only enhance working HTML links once the small interaction script is ready.
document.querySelector<HTMLElement>('[data-enhanced]')!.hidden = false;
// 根据搜索词与分类筛选卡片，并同步网址。
function filter(updateUrl = true) {
  const query = search.value.trim().toLocaleLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  const type = document.querySelector<HTMLInputElement>('input[name="format"]:checked')!.value;
  let visible = 0;
  for (const card of cards) {
    card.hidden =
      (type !== 'all' && card.dataset.type !== type) ||
      !terms.every((term) => card.dataset.search!.includes(term));
    if (!card.hidden) visible++;
  }
  count.textContent = `${visible} 项内容`;
  empty.hidden = visible !== 0;
  end.hidden = visible === 0;
  clear.hidden = search.value.length === 0;
  if (updateUrl) {
    const url = new URL(location.href);
    url.search = '';
    if (query) url.searchParams.set('q', search.value.trim());
    if (type !== 'all') url.searchParams.set('type', type);
    history.replaceState(history.state, '', url);
  }
}
// 从网址恢复搜索和分类状态。
function restoreFilters() {
  const params = new URLSearchParams(location.search);
  search.value = (params.get('q') || '').slice(0, 160);
  const inputs = [...document.querySelectorAll<HTMLInputElement>('input[name="format"]')];
  (inputs.find((input) => input.value === params.get('type')) || inputs[0]).checked = true;
  filter(false);
}
window.addEventListener('pageshow', restoreFilters);
search.addEventListener('input', () => filter());
form.addEventListener('submit', (event) => {
  event.preventDefault();
  filter();
});
form.addEventListener('reset', (event) => {
  event.preventDefault();
  search.value = '';
  filter();
  search.focus();
});
document.querySelector('.category-nav')!.addEventListener('change', () => filter());
document.querySelector('#reset-filters')!.addEventListener('click', () => {
  search.value = '';
  document.querySelector<HTMLInputElement>('input[name="format"][value="all"]')!.checked = true;
  filter();
  search.focus();
});
restoreFilters();
