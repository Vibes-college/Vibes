let host: typeof import('../features/paseo-webui/host') | undefined;
let loading: Promise<void> | undefined;
const panel = () => document.getElementById('local-assistant')!;
const chinese = () => document.documentElement.lang.startsWith('zh');
function show(visible: boolean) {
  panel().hidden = !visible;
  panel().dataset.openRequested = String(visible);
  document
    .querySelectorAll('[data-paseo-open]')
    .forEach((button) => button.setAttribute('aria-expanded', String(visible)));
}
function enable() {
  document.querySelectorAll<HTMLButtonElement>('[data-paseo-open]').forEach((button) => {
    button.disabled = false;
  });
}
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element) || !panel()) return;
  const button = event.target.closest<HTMLButtonElement>('button');
  if (!button) return;
  if (button.hasAttribute('data-paseo-reload')) location.reload();
  if (button.hasAttribute('data-paseo-close')) {
    if (host) host.hideAssistant();
    else {
      show(false);
      document.querySelector<HTMLButtonElement>('[data-paseo-open]')?.focus();
    }
  }
  if (button.hasAttribute('data-paseo-exit')) {
    if (host) void host.exitAssistant();
    else location.reload();
  }
  if (button.hasAttribute('data-paseo-open')) {
    show(true);
    if (host) {
      void host.openAssistant(button);
      return;
    }
    if (loading) return;
    loading = import('../features/paseo-webui/host')
      .then(async (module) => {
        host = module;
        await host.openAssistant(button, panel().dataset.openRequested === 'true');
      })
      .catch(() => {
        const status = panel().querySelector('[data-paseo-status]');
        if (status)
          status.textContent = chinese()
            ? '加载失败，请刷新页面后再打开助手。'
            : 'Loading failed. Reload the page, then open the assistant again.';
        const retry = panel().querySelector<HTMLButtonElement>('[data-paseo-retry]');
        if (retry) {
          retry.hidden = false;
          retry.textContent = chinese() ? '刷新页面' : 'Reload page';
          retry.onclick = () => location.reload();
        }
      });
  }
});
document.addEventListener('astro:page-load', enable);
enable();
