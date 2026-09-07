import { prefetch } from 'astro:prefetch';

const readingSelector = '.card-link, [data-direction]';

function readingLink(target: EventTarget | null) {
  const link =
    target instanceof Element ? target.closest<HTMLAnchorElement>(readingSelector) : null;
  if (
    !link ||
    link.origin !== location.origin ||
    !/^\/(zh|en)\/works\/[^/]+\/$/.test(link.pathname)
  )
    return;
  return link;
}

// 每个列表仅前6项参与自动预取；不把滚动浏览变成整站下载。
export function watchReadingLinks(root: Element, signal: AbortSignal) {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  const timers = new Map<Element, ReturnType<typeof setTimeout>>();
  const observer = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      clearTimeout(timers.get(target));
      timers.delete(target);
      if (isIntersecting) {
        timers.set(
          target,
          setTimeout(() => {
            timers.delete(target);
            observer.unobserve(target);
            const link = readingLink(target);
            if (link && !signal.aborted) prefetch(link.href);
          }, 300),
        );
      }
    }
  });
  root.querySelectorAll(readingSelector).forEach((link, index) => {
    if (index < 6) observer.observe(link);
  });
  const stop = () => {
    observer.disconnect();
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    signal.removeEventListener('abort', stop);
  };
  signal.addEventListener('abort', stop, { once: true });
  return stop;
}

// 委托到document使搜索动态卡片和换页后的DOM同样响应键盘、鼠标与触摸意图。
let hover: ReturnType<typeof setTimeout> | undefined;
document.addEventListener('pointerover', (event) => {
  if (event.pointerType === 'touch') return;
  const link = readingLink(event.target);
  if (!link || link.contains(event.relatedTarget as Node | null)) return;
  clearTimeout(hover);
  hover = setTimeout(() => prefetch(link.href), 80);
});
document.addEventListener('pointerout', (event) => {
  const link = readingLink(event.target);
  if (link && !link.contains(event.relatedTarget as Node | null)) clearTimeout(hover);
});
document.addEventListener('focusin', (event) => {
  const link = readingLink(event.target);
  if (link) prefetch(link.href);
});
document.addEventListener(
  'touchstart',
  (event) => {
    const link = readingLink(event.target);
    // 已触摸具体目标属于用户意图，慢网只限制自动提前下载。
    if (link) prefetch(link.href, { ignoreSlowConnection: true });
  },
  { passive: true },
);
document.addEventListener('astro:before-swap', () => clearTimeout(hover));
