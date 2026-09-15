import { workCardHtml } from '../lib/media/render';
import { workPath } from '../lib/i18n/routes';
import type { CardMedia } from '../lib/media/card';

/** The tiny index travels with its paginated card. Only the selected media gets a DOM node. */
export function installCollections(signal: AbortSignal) {
  const installed = new WeakSet<HTMLElement>();
  return () => {
    for (const root of document.querySelectorAll<HTMLElement>('[data-collection]')) {
      if (installed.has(root)) continue;
      installed.add(root);
      const locale = root.dataset.locale === 'en' ? 'en' : 'zh';
      // Server rendering and the search boundary validate this exact projection.
      const config = JSON.parse(root.dataset.collection!) as NonNullable<CardMedia['collection']>;
      const key = `vibes:collection:${locale}:${config.id}`;
      let current = 0;
      try {
        const saved = sessionStorage.getItem(key);
        current = Math.max(
          0,
          config.items.findIndex((item) => item.id === saved),
        );
      } catch {
        /* Storage is optional. */
      }
      // Sources only attach after manual play before this lazy module arrives.
      if (root.querySelector('source')) current = 0;
      function select(step: number) {
        current = (current + step + config.items.length) % config.items.length;
        const item = config.items[current];
        if (step || current) {
          const template = document.createElement('template');
          template.innerHTML = workCardHtml(
            {
              slug: item.id,
              title: item.title,
              summary: '',
              type: 'article',
              mediaCard: item.card,
            },
            locale,
            'div',
          );
          root.querySelector('.collection-frame')!.replaceWith(template.content.firstElementChild!);
        }
        root.querySelector<HTMLElement>('.collection-frame')!.dataset.auto = '';
        const link = root.querySelector<HTMLAnchorElement>('[data-collection-current]')!;
        link.textContent = item.title;
        link.href = workPath(locale, item.id);
        root.querySelector('[data-collection-position]')!.textContent =
          `${current + 1}/${config.items.length}`;
        try {
          sessionStorage.setItem(key, item.id);
        } catch {
          /* Storage is optional. */
        }
      }
      select(0);
      const change = (step: number) => {
        select(step);
        root.dispatchEvent(new CustomEvent('media:refresh', { bubbles: true }));
      };
      for (const button of root.querySelectorAll<HTMLButtonElement>('[data-collection-step]')) {
        button.disabled = config.items.length < 2;
        button.addEventListener('click', () => change(Number(button.dataset.collectionStep)), {
          signal,
        });
      }
    }
  };
}
