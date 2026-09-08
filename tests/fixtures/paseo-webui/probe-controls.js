/* global ResizeObserver */
let ready = false;
let loading = false;
function mount() {
  window.__vibesPaseo.mount(document.getElementById('root'));
  ready = true;
  loading = false;
  document.getElementById('probe-status').textContent = 'Mounted';
}

document.addEventListener('click', (event) => {
  const id = event.target?.id;
  if (id === 'mount') {
    if (ready) {
      mount();
      return;
    }
    if (loading) return;
    loading = true;
    const root = document.getElementById('root');
    const listeners = new Set();
    const host = {
      root,
      width: root.clientWidth,
      height: root.clientHeight,
      visible: true,
      subscribe(callback) {
        listeners.add(callback);
        return () => listeners.delete(callback);
      },
    };
    new ResizeObserver(() => {
      if (!root.clientWidth || !root.clientHeight) return;
      host.width = root.clientWidth;
      host.height = root.clientHeight;
      for (const callback of listeners) callback();
    }).observe(root);
    window.__vibesPaseoEnvironment = host;
    const script = document.createElement('script');
    script.src = '/probe-entry.js';
    document.head.append(script);
  }
  if (id === 'toggle' && ready) {
    const root = document.getElementById('root');
    window.__vibesPaseoEnvironment.visible = root.hidden;
    window.__vibesPaseo.presentation(root.hidden);
  }
  if (id === 'resize') document.getElementById('paseo-probe').classList.toggle('wide');
});
window.addEventListener('vibes:paseo-module-ready', mount);
window.addEventListener('vibes:paseo-module-error', () => {
  loading = false;
  document.getElementById('probe-status').textContent = 'Load failed';
});
// Astro must keep the actual nodes: RN uses CSSOM rules that cloning text loses.
document.addEventListener('astro:before-swap', (event) => {
  for (const element of document.head.querySelectorAll('style[id]')) {
    if (!/^(react-native-stylesheet|unistyles-web|Reanimated|paseo-)/.test(element.id)) continue;
    element.setAttribute('data-astro-transition-persist', element.id);
    const placeholder = event.newDocument.createElement('style');
    placeholder.setAttribute('data-astro-transition-persist', element.id);
    event.newDocument.head.append(placeholder);
  }
});
