import { navigate } from 'astro:transitions/client';
type Direction = 'previous' | 'next';
let incoming: { path: string; direction: Direction } | undefined;

/** A short directional movement connects adjacent works without animating document history. */
export function detailNavigation(root: HTMLElement, signal: AbortSignal) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pages = [...root.querySelectorAll<HTMLElement>('.detail-cover, .reading-page')];
  let animations: Animation[] = [];
  let request = 0;
  if (incoming?.path === location.pathname && !reduced.matches) {
    const x = incoming.direction === 'next' ? 28 : -28;
    animations = pages.map((page) =>
      page.animate(
        { transform: [`translateX(${x}px)`, 'translateX(0)'], opacity: [0.35, 1] },
        { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' },
      ),
    );
  }
  incoming = undefined;
  const go = async (direction: Direction) => {
    const link = root.querySelector<HTMLAnchorElement>(`a[data-direction="${direction}"]`);
    if (!link) return;
    const current = ++request;
    animations.forEach((animation) => animation.cancel());
    if (!reduced.matches) {
      const x = direction === 'next' ? -24 : 24;
      animations = pages.map((page) =>
        page.animate(
          { transform: ['translateX(0)', `translateX(${x}px)`], opacity: [1, 0.35] },
          { duration: 140, easing: 'ease-out', fill: 'forwards' },
        ),
      );
      await Promise.all(animations.map((animation) => animation.finished.catch(() => {})));
    }
    if (signal.aborted || current !== request) return;
    incoming = { path: new URL(link.href).pathname, direction };
    try {
      await navigate(link.href);
    } catch {
      location.assign(link.href);
    }
  };
  root.querySelectorAll<HTMLAnchorElement>('a[data-direction]').forEach((link) => {
    link.addEventListener(
      'click',
      (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)
          return;
        event.preventDefault();
        void go(link.dataset.direction as Direction);
      },
      { signal },
    );
  });
  signal.addEventListener('abort', () => animations.forEach((animation) => animation.cancel()), {
    once: true,
  });
  return (direction: Direction) => {
    void go(direction);
  };
}
