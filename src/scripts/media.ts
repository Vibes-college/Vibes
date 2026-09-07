import { createMediaPlayer, type MediaController } from './media-player';
import { installExperiences } from './media-experience';

export function installMedia(signal: AbortSignal) {
  const entries = new Map<HTMLElement, MediaController>();
  const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  const visibility = new Map<HTMLElement, number>();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 800px)');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  let manual: HTMLElement | undefined;
  function visible(root: HTMLElement) {
    const rect = root.getBoundingClientRect();
    return (
      root.isConnected &&
      !document.hidden &&
      !root.closest('[hidden]') &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top < innerHeight &&
      rect.bottom > 0
    );
  }
  function cancel(root: HTMLElement) {
    clearTimeout(timers.get(root));
    timers.delete(root);
  }
  function schedule() {
    if (signal.aborted) return;
    if (manual && (!entries.get(manual)?.manual || !visible(manual))) manual = undefined;
    const candidates = [...entries.values()].filter((entry) => {
      entry.visible = visible(entry.root);
      if (!entry.visible) {
        entry.pause();
        cancel(entry.root);
      }
      return (
        entry.auto && entry.visible && !entry.userPaused && (visibility.get(entry.root) || 0) >= 0.5
      );
    });
    candidates.sort(
      (a, b) =>
        Math.abs(a.root.getBoundingClientRect().top) - Math.abs(b.root.getBoundingClientRect().top),
    );
    const selected = new Set(
      !manual && !reduced.matches && !connection?.saveData
        ? candidates.slice(0, small.matches ? 1 : 2)
        : [],
    );
    for (const entry of entries.values()) {
      if (!entry.auto || entry.root === manual) continue;
      if (!selected.has(entry)) {
        entry.pause();
        cancel(entry.root);
      } else if (!entry.playing && !entry.pending && !timers.has(entry.root)) {
        timers.set(
          entry.root,
          setTimeout(() => {
            timers.delete(entry.root);
            if (visible(entry.root) && !signal.aborted && !manual) entry.play(false);
          }, 200),
        );
      }
    }
  }
  const observer = new IntersectionObserver(
    (changes) => {
      for (const change of changes)
        visibility.set(change.target as HTMLElement, change.intersectionRatio);
      schedule();
    },
    { threshold: [0, 0.5, 1] },
  );
  function refresh() {
    for (const [root, entry] of entries)
      if (!root.isConnected) {
        entry.dispose();
        entries.delete(root);
        visibility.delete(root);
        observer.unobserve(root);
        cancel(root);
      }
    for (const root of document.querySelectorAll<HTMLElement>('[data-media-root]'))
      if (!entries.has(root)) {
        entries.set(root, createMediaPlayer(root, signal));
        observer.observe(root);
      }
    for (const image of document.querySelectorAll<HTMLImageElement>(
      '[data-media-root]:not([hidden]) img[data-src]',
    ))
      if (!image.closest('[hidden]')) {
        image.src = image.dataset.src!;
        delete image.dataset.src;
        if (image.dataset.srcset) {
          image.srcset = image.dataset.srcset;
          delete image.dataset.srcset;
        }
      }
    refreshExperiences();
    schedule();
  }
  document.addEventListener(
    'media:manual',
    (event) => {
      manual = event.target as HTMLElement;
      const active = entries.get(manual);
      if (active) active.manual = true;
      for (const entry of entries.values()) {
        cancel(entry.root);
        if (entry.root !== manual) entry.pause();
      }
    },
    { signal },
  );
  document.addEventListener(
    'media:idle',
    (event) => {
      if (event.target === manual) {
        const active = entries.get(manual);
        if (active) active.manual = false;
        manual = undefined;
      }
      schedule();
    },
    { signal },
  );
  document.addEventListener('media:refresh', refresh, { signal });
  document.addEventListener('visibilitychange', schedule, { signal });
  window.addEventListener(
    'pagehide',
    () => {
      for (const entry of entries.values()) {
        cancel(entry.root);
        entry.pause();
      }
    },
    { signal },
  );
  window.addEventListener('pageshow', refresh, { signal });
  // Detail uses a .detail-page root; custom events do not need to bubble.
  document.querySelector('.detail-page')?.addEventListener('detail:page', refresh, { signal });
  reduced.addEventListener('change', schedule, { signal });
  small.addEventListener('change', schedule, { signal });
  for (const gallery of document.querySelectorAll<HTMLElement>('[data-media-gallery]')) {
    gallery.addEventListener(
      'click',
      (event) => {
        const button = (event.target as Element).closest<HTMLButtonElement>('[data-media-select]');
        if (!button) return;
        const selected = Number(button.dataset.mediaSelect);
        gallery.querySelectorAll<HTMLElement>('[data-media-panel]').forEach((panel, index) => {
          panel.hidden = index !== selected;
        });
        gallery
          .querySelectorAll<HTMLButtonElement>('[data-media-select]')
          .forEach((control, index) =>
            control.setAttribute('aria-pressed', String(index === selected)),
          );
        refresh();
        gallery.dispatchEvent(new CustomEvent('media:refresh', { bubbles: true }));
      },
      { signal },
    );
  }
  const refreshExperiences = installExperiences(signal);
  signal.addEventListener(
    'abort',
    () => {
      observer.disconnect();
      for (const root of timers.keys()) cancel(root);
      for (const entry of entries.values()) entry.dispose();
      entries.clear();
    },
    { once: true },
  );
  refresh();
}

export { workCardHtml } from '../lib/media/render';
export { parseCard } from '../lib/media/card';
