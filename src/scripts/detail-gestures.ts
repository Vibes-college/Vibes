type Direction = 'previous' | 'next';
export const detailGestureExclusions =
  '[data-media-gallery], [data-media-root], iframe, dialog, astro-island, [data-article-interactive], .reading-progress, .prose-table-scroll, .code-scroll, .katex-display, img[data-zoom], [role=tabpanel], button, input, textarea, select, summary, table, pre, [contenteditable], video, audio';

export function installDetailGestures(
  root: HTMLElement,
  navigate: (direction: Direction) => void,
  signal: AbortSignal,
) {
  const edge = root.querySelector<HTMLElement>('.edge-navigation')!;
  let state: { x: number; y: number; dx: number; direction?: Direction; held: boolean } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let suppressUntil = 0;
  const available = (direction: Direction) =>
    Boolean(root.querySelector(`a[data-direction="${direction}"]`));
  function clear() {
    clearTimeout(timer);
    state = undefined;
    delete edge.dataset.visible;
    delete edge.dataset.ready;
    delete root.dataset.gesturing;
  }
  function show(direction: Direction, y: number) {
    if (!available(direction)) {
      delete edge.dataset.visible;
      return;
    }
    edge.dataset.direction = direction;
    edge.dataset.visible = '';
    edge.style.setProperty('--edge-y', `${Math.max(48, Math.min(innerHeight - 48, y))}px`);
    edge.toggleAttribute('data-ready', Math.abs(state?.dx ?? 0) >= 70);
    root.dataset.gesturing = '';
  }
  function begin(x: number, y: number, target: EventTarget | null) {
    clear();
    if (
      !(target instanceof Element) ||
      target.closest(detailGestureExclusions) ||
      window.getSelection()?.toString()
    )
      return;
    // Leave iOS browser back/forward edge gestures under native control.
    if (x < 24 || x > innerWidth - 24) return;
    state = { x, y, dx: 0, held: false };
    // Text and links retain native selection/context menus; long press belongs to empty space.
    if (!target.closest('a, p, h1, h2, h3, li, dt, dd, .section-content')) {
      timer = setTimeout(() => {
        if (!state || window.getSelection()?.toString()) return;
        state.held = true;
        state.direction = x < innerWidth / 2 ? 'previous' : 'next';
        show(state.direction, y);
      }, 380);
    }
  }
  function move(x: number, y: number, event: Event) {
    if (!state) return;
    const dx = x - state.x;
    const dy = y - state.y;
    if (!state.direction) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
        clear();
        return;
      }
      if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      state.direction = dx < 0 ? 'next' : 'previous';
    }
    clearTimeout(timer);
    state.dx = dx;
    if (Math.abs(dx) > 22) state.direction = dx < 0 ? 'next' : 'previous';
    if (window.getSelection()?.toString()) {
      clear();
      return;
    }
    if (event.cancelable) event.preventDefault();
    show(state.direction, y);
  }
  function end(x: number, y: number, event: Event) {
    if (!state) return;
    // The end coordinate also supports sparse touch streams from accessibility tools.
    move(x, y, event);
    if (!state) return;
    const direction = state.direction;
    const commit = direction && Math.abs(state.dx) >= 70 && available(direction);
    if (direction) suppressUntil = performance.now() + 500;
    clear();
    if (commit) {
      if (event.cancelable) event.preventDefault();
      navigate(direction);
    }
  }
  root.addEventListener(
    'touchstart',
    (event) => {
      if (event.touches.length !== 1) {
        clear();
        return;
      }
      const point = event.touches[0];
      begin(point.clientX, point.clientY, event.target);
    },
    { passive: true, signal },
  );
  root.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length !== 1) {
        clear();
        return;
      }
      const point = event.touches[0];
      move(point.clientX, point.clientY, event);
    },
    { passive: false, signal },
  );
  root.addEventListener(
    'touchend',
    (event) => {
      const point = event.changedTouches[0];
      if (point) end(point.clientX, point.clientY, event);
      else clear();
    },
    { passive: false, signal },
  );
  root.addEventListener('touchcancel', clear, { signal });
  root.addEventListener(
    'pointerdown',
    (event) => {
      if (
        event.pointerType === 'mouse' &&
        event.button === 0 &&
        !(
          event.target instanceof Element &&
          event.target.closest('a, p, h1, h2, h3, li, dt, dd, .section-content')
        )
      )
        begin(event.clientX, event.clientY, event.target);
    },
    { signal },
  );
  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'mouse' && event.buttons === 1)
        move(event.clientX, event.clientY, event);
    },
    { signal },
  );
  window.addEventListener(
    'pointerup',
    (event) => {
      if (event.pointerType === 'mouse') end(event.clientX, event.clientY, event);
    },
    { signal },
  );
  window.addEventListener('blur', clear, { signal });
  root.addEventListener(
    'pointercancel',
    (event) => {
      if (event.pointerType === 'mouse') clear();
    },
    { signal },
  );
  root.addEventListener(
    'contextmenu',
    (event) => {
      if (state?.held) event.preventDefault();
    },
    { signal },
  );
  root.addEventListener(
    'click',
    (event) => {
      if (performance.now() < suppressUntil) {
        event.preventDefault();
        event.stopPropagation();
        suppressUntil = 0;
      }
    },
    { capture: true, signal },
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') clear();
    },
    { signal },
  );
  signal.addEventListener('abort', clear, { once: true });
}
