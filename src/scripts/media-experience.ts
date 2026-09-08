import { embedUrl } from '../config/media';
import { mediaMessages } from '../lib/media/messages';
import type { Media, MediaText } from '../lib/media/schema';

export function installExperiences(pageSignal: AbortSignal) {
  const stops = new Map<HTMLElement, () => void>();
  const lifetimes = new Map<HTMLElement, AbortController>();
  function visible(root: HTMLElement) {
    const rect = root.getBoundingClientRect();
    return (
      root.isConnected &&
      !document.hidden &&
      !root.closest('[hidden]') &&
      rect.bottom > 0 &&
      rect.top < innerHeight
    );
  }
  function bind(root: HTMLElement) {
    const lifetime = new AbortController();
    lifetimes.set(root, lifetime);
    const signal = lifetime.signal;
    const { item, text } = JSON.parse(root.dataset.experience!) as {
      item: Extract<Media, { kind: 'embed' | 'demo' | 'chart' }>;
      text: MediaText[string];
    };
    const launch = root.querySelector<HTMLButtonElement>('[data-media-launch]')!;
    const exit = root.querySelector<HTMLButtonElement>('[data-media-exit]')!;
    const mount = root.querySelector<HTMLElement>('[data-media-mount]')!;
    const status = root.querySelector<HTMLElement>('[data-media-status]')!;
    const t = mediaMessages[root.dataset.locale === 'en' ? 'en' : 'zh'];
    let controller: AbortController | undefined;
    let cleanup: (() => void) | undefined;
    let refreshNeeded = false;
    function stop() {
      const wasActive = Boolean(controller);
      controller?.abort();
      controller = undefined;
      cleanup?.();
      cleanup = undefined;
      mount.replaceChildren();
      mount.hidden = true;
      exit.hidden = true;
      launch.hidden = false;
      launch.disabled = false;
      root.classList.remove('is-experiencing');
      status.textContent = '';
      if (wasActive) root.dispatchEvent(new CustomEvent('media:idle', { bubbles: true }));
    }
    stops.set(root, stop);
    launch.addEventListener(
      'click',
      () => {
        if (!visible(root)) return;
        if (refreshNeeded) {
          location.reload();
          return;
        }
        stop();
        controller = new AbortController();
        root.dispatchEvent(new CustomEvent('media:manual', { bubbles: true }));
        const active = controller;
        launch.disabled = true;
        status.textContent = t.loading;
        const ready = () => !signal.aborted && !active.signal.aborted && visible(root);
        const show = () => {
          if (!ready()) {
            stop();
            return;
          }
          mount.hidden = false;
          launch.hidden = true;
          exit.hidden = false;
          root.classList.add('is-experiencing');
          status.textContent = '';
          exit.focus({ preventScroll: true });
        };
        const failed = () => {
          if (!active.signal.aborted) {
            stop();
            status.textContent = t.failed;
            launch.textContent = t.retry;
          }
        };
        if (item.kind === 'embed') {
          const iframe = document.createElement('iframe');
          const url = embedUrl(item.provider, item.resourceId);
          iframe.title = text.title;
          iframe.allow =
            item.provider === 'spotify' || item.provider === 'youtube'
              ? 'autoplay; encrypted-media; fullscreen; picture-in-picture'
              : 'fullscreen; picture-in-picture';
          iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
          iframe.referrerPolicy = 'strict-origin-when-cross-origin';
          if (url === '/media/2048/game.txt') {
            // MIT source edition runs in an opaque sandbox, without parent access or
            // persistent storage. Its source files are counted in the media budget.
            iframe.setAttribute('sandbox', 'allow-scripts allow-popups');
            void fetch(import.meta.env.DEV ? url : '/media/2048/game-bundled.txt', {
              signal: active.signal,
            })
              .then(async (response) => {
                if (!response.ok) throw new Error('Game unavailable');
                const html = await response.text();
                if (new TextEncoder().encode(html).byteLength > 65536)
                  throw new Error('Game template too large');
                if (!ready()) return;
                // Production bundles exact-hash inline assets for the inherited CSP.
                // Astro dev still serves the original template and external assets.
                iframe.srcdoc = import.meta.env.DEV
                  ? html.replaceAll('="/media/2048/', `="${location.origin}/media/2048/`)
                  : html;
                // An older open document may retain a CSP without this build's hash.
                // Require a signal from the exact child; offer a full refresh on failure.
                const timer = window.setTimeout(() => {
                  if (!ready()) return;
                  failed();
                  refreshNeeded = true;
                  launch.textContent =
                    root.dataset.locale === 'en' ? 'Reload and retry' : '刷新重试';
                  launch.setAttribute('aria-label', launch.textContent);
                }, 5000);
                cleanup = () => window.clearTimeout(timer);
                const onMessage = (event: MessageEvent) => {
                  if (event.source !== iframe.contentWindow || event.data !== 'vibes-2048-ready')
                    return;
                  window.clearTimeout(timer);
                  window.removeEventListener('message', onMessage);
                  if (ready()) status.textContent = '';
                };
                window.addEventListener('message', onMessage, { signal: active.signal });
                mount.append(iframe);
                show();
                if (ready()) status.textContent = t.loading;
              })
              .catch(failed);
          } else {
            iframe.src = url;
            mount.append(iframe);
            show();
          }
          // Cross-origin load events cannot establish playback success. Keep a visible
          // exit and source link instead of falsely reporting a blocked iframe as ready.
        } else if (item.kind === 'demo') {
          void import('./media-demo')
            .then((module) => {
              if (!ready()) return;
              cleanup = module.mountDemo(
                mount,
                item.config,
                root.dataset.locale === 'en' ? 'en' : 'zh',
                active.signal,
              );
              show();
            })
            .catch(failed);
        } else {
          void import('./media-chart')
            .then(async (module) => {
              if (!ready()) return;
              await module.mountChart(
                mount,
                item,
                text,
                root.dataset.locale === 'en' ? 'en' : 'zh',
                active.signal,
              );
              if (ready()) show();
            })
            .catch(failed);
        }
      },
      { signal },
    );
    exit.addEventListener(
      'click',
      () => {
        stop();
        launch.focus({ preventScroll: true });
      },
      { signal },
    );
  }
  const observer = new IntersectionObserver(() => {
    for (const [root, stop] of stops) if (!visible(root)) stop();
  });
  const refresh = () => {
    for (const [root, stop] of stops) {
      if (!visible(root)) stop();
      if (!root.isConnected) {
        stop();
        observer.unobserve(root);
        lifetimes.get(root)?.abort();
        lifetimes.delete(root);
        stops.delete(root);
      }
    }
    for (const root of document.querySelectorAll<HTMLElement>('[data-experience]'))
      if (!stops.has(root)) {
        bind(root);
        observer.observe(root);
      }
  };
  const signal = pageSignal;
  document.addEventListener(
    'media:manual',
    (event) => {
      for (const [root, stop] of stops) if (root !== event.target) stop();
    },
    { signal },
  );
  document.addEventListener('media:refresh', refresh, { signal });
  document.addEventListener('visibilitychange', refresh, { signal });
  document.querySelector('.detail-page')?.addEventListener('detail:page', refresh, { signal });
  window.addEventListener(
    'pagehide',
    () => {
      for (const stop of stops.values()) stop();
    },
    { signal },
  );
  signal.addEventListener(
    'abort',
    () => {
      observer.disconnect();
      for (const stop of stops.values()) stop();
      for (const lifetime of lifetimes.values()) lifetime.abort();
      stops.clear();
      lifetimes.clear();
    },
    { once: true },
  );
  refresh();
  return refresh;
}
