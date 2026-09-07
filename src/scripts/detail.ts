import { onPageLoad } from './page-lifecycle';
import { watchReadingLinks } from './reading-prefetch';
import { installDetailGestures } from './detail-gestures';
import { installReadingProgress } from './reading-progress';
import { detailNavigation } from './detail-transition';

onPageLoad((signal) => {
  const detail = document.querySelector<HTMLElement>('.detail-page');
  if (!detail) return;
  watchReadingLinks(detail, signal);

  const navigateWork = detailNavigation(detail, signal);
  // 排除链接、表格、文本选择等操作，避免阅读与横向滚动误切换。
  function isInteractive(target: EventTarget | null) {
    return (
      target instanceof Element &&
      Boolean(
        target.closest(
          'a, button, input, textarea, select, summary, table, pre, [contenteditable], video, audio',
        ),
      )
    );
  }
  installDetailGestures(detail, navigateWork, signal);
  // The cover needs no progress measurements; initialize only as reading approaches.
  const readingObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      readingObserver.disconnect();
      installReadingProgress(detail, signal);
    },
    { rootMargin: '80px' },
  );
  readingObserver.observe(detail.querySelector('#reading')!);
  signal.addEventListener('abort', () => readingObserver.disconnect(), { once: true });

  // 桌面方向键提供等价导航，不截取输入、选择或带修饰键的操作。
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        isInteractive(event.target) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        window.getSelection()?.toString()
      )
        return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        navigateWork(event.key === 'ArrowLeft' ? 'previous' : 'next');
      }
    },
    { signal },
  );
  // 从当前标签页保留的同语言目录恢复返回入口，拒绝外部或作品详情地址。
  const back = document.querySelector<HTMLAnchorElement>('[data-back-link]');
  try {
    const locale = detail?.dataset.locale;
    const value = locale && sessionStorage.getItem(`explore:${locale}`);
    if (back && value) {
      const url = new URL(value, location.origin);
      if (
        url.origin === location.origin &&
        url.pathname.startsWith(`/${locale}/`) &&
        !url.pathname.includes('/works/')
      )
        back.href = url.pathname + url.search;
    }
  } catch {
    /* Storage can be unavailable; the static directory link remains valid. */
  }
});
