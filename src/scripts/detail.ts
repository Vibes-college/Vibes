const detail = document.querySelector<HTMLElement>('.detail-page');
let suppressClick = false;
let start: { x: number; y: number } | null = null;

// 切换到真实相邻网址，首尾没有对应链接时保持当前作品。
function navigateWork(direction: 'previous' | 'next') {
  const link = document.querySelector<HTMLAnchorElement>(`[data-direction="${direction}"]`);
  if (link) location.assign(link.href);
}
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
// 记录触摸起点，多指操作与可交互区域不进入切换手势。
detail?.addEventListener(
  'touchstart',
  (event) => {
    start =
      event.touches.length === 1 &&
      !(
        event.target instanceof Element &&
        event.target.closest('button, input, textarea, select, summary, table, pre, video, audio')
      )
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null;
  },
  { passive: true },
);
// 只有明确的横向滑动才切换，保留普通上下滚动与文本选取。
detail?.addEventListener(
  'touchend',
  (event) => {
    if (!start || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    start = null;
    if (
      Math.abs(dx) >= 70 &&
      Math.abs(dx) > Math.abs(dy) * 1.4 &&
      !window.getSelection()?.toString()
    ) {
      const direction = dx < 0 ? 'next' : 'previous';
      if (!document.querySelector(`[data-direction="${direction}"]`)) return;
      suppressClick = true;
      if (event.cancelable) event.preventDefault();
      navigateWork(direction);
    }
  },
  { passive: false },
);
// 取消手势时清除起点，避免下次触摸沿用旧坐标。
detail?.addEventListener('touchcancel', () => {
  start = null;
});
// 桌面方向键提供等价导航，不截取输入、选择或带修饰键的操作。
document.addEventListener('keydown', (event) => {
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
});
// 打开深层标题链接前先展开其所在章节，支持复制正文锚点。
function revealHash() {
  if (!location.hash) return;
  let id: string;
  try {
    id = decodeURIComponent(location.hash.slice(1));
  } catch {
    return;
  }
  const target = document.getElementById(id);
  const section = target?.closest('details');
  if (section) {
    section.open = true;
    target?.scrollIntoView();
  }
}
window.addEventListener('hashchange', revealHash);
revealHash();

// 滑动结束后不再触发预览或标签链接的点击。
detail?.addEventListener(
  'click',
  (event) => {
    if (suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }
  },
  true,
);
