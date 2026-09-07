// Astro保留JS运行环境；每次换页只初始化当前DOM，离开时移除全局监听与计时器。
export function onPageLoad(setup: (signal: AbortSignal) => void) {
  let controller: AbortController | undefined;
  document.addEventListener('astro:before-swap', () => controller?.abort());
  document.addEventListener('astro:page-load', () => {
    controller?.abort();
    controller = new AbortController();
    setup(controller.signal);
  });
}
