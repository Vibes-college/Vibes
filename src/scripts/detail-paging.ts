import { detailGestureExclusions } from './detail-gestures';

/** Two independent pages: only the active page contributes to native document scrolling. */
export function installDetailPaging(root: HTMLElement, signal: AbortSignal) {
  const cover = root.querySelector<HTMLElement>('.detail-cover')!;
  const reading = root.querySelector<HTMLElement>('#reading')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let animation: Animation | undefined;
  let readingActive = false;
  let suppressUntil = 0;
  let wheelDistance = 0;
  let wheelTime = 0;
  let gesture: { x: number; y: number; dy: number; locked: boolean } | undefined;

  function show(next: boolean, animate = true) {
    const changed = readingActive !== next;
    readingActive = next;
    if (changed) animation?.cancel();
    cover.hidden = next;
    reading.hidden = !next;
    root.dataset.detailPage = next ? 'reading' : 'cover';
    if (changed) {
      // One position reset when exchanging pages; scrolling never drives the animation.
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (animate && !reduced.matches)
        animation = (next ? reading : cover).animate(
          { translate: [`0 ${next ? 56 : -56}px`, '0 0'], opacity: [0.4, 1] },
          { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' },
        );
      void animation?.finished
        .then(() => root.dispatchEvent(new Event('detail:page')))
        .catch(() => {});
    }
    root.dispatchEvent(new Event('detail:page'));
  }
  function turn(next: boolean) {
    suppressUntil = performance.now() + 400;
    history.pushState(history.state, '', next ? '#reading' : location.pathname + location.search);
    show(next);
    (next ? reading : cover).focus({ preventScroll: true });
  }
  function fromLocation() {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    show(Boolean(target && reading.contains(target)), false);
    target?.scrollIntoView({ behavior: 'instant' });
  }
  function atBoundary() {
    return readingActive ? scrollY <= 2 : cover.getBoundingClientRect().bottom <= innerHeight + 2;
  }
  cover.tabIndex = -1;
  fromLocation();
  window.addEventListener('hashchange', fromLocation, { signal });
  window.addEventListener('popstate', fromLocation, { signal });
  // Reveal a hidden destination before the browser follows a real fragment link.
  root.addEventListener(
    'click',
    (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
      if (!link) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target && reading.contains(target)) show(true, false);
    },
    { capture: true, signal },
  );
  root.addEventListener(
    'touchstart',
    (event) => {
      gesture = undefined;
      if (event.touches.length !== 1 || !atBoundary() || window.getSelection()?.toString()) return;
      const target = event.target;
      if (!(target instanceof Element) || target.closest(detailGestureExclusions)) return;
      const point = event.touches[0];
      if (point.clientX < 24 || point.clientX > innerWidth - 24) return;
      gesture = { x: point.clientX, y: point.clientY, dy: 0, locked: false };
    },
    { passive: true, signal },
  );
  root.addEventListener(
    'touchmove',
    (event) => {
      if (!gesture) return;
      if (event.touches.length !== 1 || window.getSelection()?.toString()) {
        gesture = undefined;
        return;
      }
      const dx = event.touches[0].clientX - gesture.x;
      const dy = event.touches[0].clientY - gesture.y;
      if (!gesture.locked) {
        if (Math.abs(dx) >= 14 && Math.abs(dx) >= Math.abs(dy) * 1.4) {
          gesture = undefined;
          return;
        }
        if (Math.abs(dy) < Math.max(8, Math.abs(dx) * 1.2)) return;
        if ((readingActive ? dy < 0 : dy > 0) || !event.cancelable) {
          gesture = undefined;
          return;
        }
        gesture.locked = true;
      }
      event.preventDefault();
      gesture.dy = dy;
    },
    { passive: false, signal },
  );
  root.addEventListener(
    'touchend',
    (event) => {
      const current = gesture;
      gesture = undefined;
      if (!current?.locked) return;
      if (event.cancelable) event.preventDefault();
      if ((readingActive ? current.dy : -current.dy) >= 72) turn(!readingActive);
    },
    { passive: false, signal },
  );
  root.addEventListener(
    'touchcancel',
    () => {
      gesture = undefined;
    },
    { signal },
  );
  root.addEventListener(
    'wheel',
    (event) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !atBoundary()) return;
      if (readingActive ? event.deltaY >= 0 : event.deltaY <= 0) return;
      if ((event.target as Element).closest(detailGestureExclusions)) return;
      event.preventDefault();
      const now = performance.now();
      if (now < suppressUntil) return;
      if (now - wheelTime > 180) wheelDistance = 0;
      wheelTime = now;
      wheelDistance +=
        Math.abs(event.deltaY) *
        (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (wheelDistance >= 72) {
        wheelDistance = 0;
        turn(!readingActive);
      }
    },
    { passive: false, signal },
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        window.getSelection()?.toString()
      )
        return;
      if ((event.target as Element).closest(detailGestureExclusions)) return;
      if (!atBoundary()) return;
      if (
        (!readingActive && ['ArrowDown', 'PageDown', ' '].includes(event.key)) ||
        (readingActive && ['ArrowUp', 'PageUp'].includes(event.key))
      ) {
        event.preventDefault();
        turn(!readingActive);
      }
    },
    { signal },
  );
  signal.addEventListener('abort', () => animation?.cancel(), { once: true });
}
