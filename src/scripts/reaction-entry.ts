const faces = ['🥰', '🤩', '😕', '🥺', '😄'];
export const reactionKey = (id: string) => `reaction:${location.pathname}:${id}`;
export function showReaction(button: HTMLButtonElement, value: string) {
  button.querySelector('[data-reaction-value]')!.textContent = value;
  button.toggleAttribute('data-selected', Boolean(value));
}
export function installReactionEntry(detail: HTMLElement, signal: AbortSignal) {
  const buttons = detail.querySelectorAll<HTMLButtonElement>('[data-reaction]');
  for (const button of buttons) {
    button.hidden = false;
    try {
      const value = localStorage.getItem(reactionKey(button.dataset.reaction!));
      if (value && faces.includes(value)) showReaction(button, value);
    } catch {
      /* Reading and reacting remain available without storage. */
    }
  }
  let ready: Promise<typeof import('./section-reactions')> | undefined;
  let open: ((button: HTMLButtonElement) => void) | undefined;
  const load = () =>
    (ready ??= import('./section-reactions').catch((error: unknown) => {
      ready = undefined;
      throw error;
    }));
  const activate = async (button: HTMLButtonElement) => {
    if (button.hasAttribute('aria-busy')) return;
    button.setAttribute('aria-busy', 'true');
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    try {
      const module = await load();
      if (!signal.aborted) {
        open ??= module.installReactions(signal, faces, reactionKey, showReaction);
        open(button);
      }
    } catch {
      /* A later click may retry a failed network request. */
    } finally {
      button.removeAttribute('aria-busy');
    }
  };
  // Let HTML/images finish first; only a reader lingering in the article warms the module.
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let idle: number | undefined;
  let inReading = false;
  const cancel = () => {
    clearTimeout(timer);
    if (idle !== undefined) window.cancelIdleCallback?.(idle);
  };
  const warm = () => {
    cancel();
    if (
      ready ||
      !inReading ||
      document.hidden ||
      document.readyState !== 'complete' ||
      connection?.saveData ||
      signal.aborted
    )
      return;
    timer = setTimeout(() => {
      const fetch = () => {
        if (!signal.aborted && !document.hidden && inReading) void load().catch(() => {});
      };
      if ('requestIdleCallback' in window)
        idle = window.requestIdleCallback(fetch, { timeout: 3000 });
      else fetch();
    }, 1500);
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      inReading = entry.isIntersecting;
      warm();
    },
    { rootMargin: '0px 0px -80px 0px' },
  );
  observer.observe(detail.querySelector('#reading')!);
  window.addEventListener('load', warm, { signal, once: true });
  document.addEventListener('visibilitychange', warm, { signal });
  signal.addEventListener(
    'abort',
    () => {
      cancel();
      observer.disconnect();
    },
    { once: true },
  );
  let dragFrom: HTMLButtonElement | undefined;
  let ignoreClick: HTMLButtonElement | undefined;
  detail.addEventListener(
    'pointerdown',
    (event) => {
      ignoreClick = undefined;
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-reaction]');
      if (!button) return;
      ignoreClick = button;
      dragFrom = button.getAttribute('aria-expanded') === 'true' ? undefined : button;
      void activate(button);
    },
    { signal },
  );
  document.addEventListener(
    'pointerup',
    (event) => {
      if (!dragFrom) return;
      const choice = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLButtonElement>('.reaction-menu button');
      choice?.click();
      dragFrom = undefined;
    },
    { signal },
  );
  document.addEventListener(
    'pointercancel',
    () => {
      dragFrom = undefined;
    },
    { signal },
  );
  detail.addEventListener(
    'click',
    (event) => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-reaction]');
      if (button && !(event.detail > 0 && ignoreClick === button)) void activate(button);
    },
    { signal },
  );
}
