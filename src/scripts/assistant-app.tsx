import '@vitejs/plugin-react/preamble';
import { createRoot } from 'react-dom/client';
import { App } from '../components/assistant/App';
import { AssistantStore } from '../lib/assistant/store';
import { bindAssistantLifecycle } from '../lib/assistant/lifecycle';
import type { WorkContext } from '../lib/assistant/labels';
import '../components/assistant-ui/official.css';
function context(): WorkContext | null {
  const element = document.querySelector<HTMLElement>('[data-assistant-work]');
  if (!element) return null;
  const { title, source, summary } = element.dataset;
  const url = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
  if (!title || !source || !summary || !url) return null;
  return {
    title: title.slice(0, 300),
    source: source.slice(0, 2000),
    summary: summary.slice(0, 4000),
    url: url.slice(0, 2000),
  };
}
let mounted = false;
export function mountAssistant() {
  if (mounted) return;
  const element = document.getElementById('assistant-root');
  if (!element) return;
  // Access can throw before any storage method runs (for example blocked site data).
  let tab: Storage, local: Storage;
  try {
    tab = window.sessionStorage;
    local = window.localStorage;
  } catch {
    throw new Error('storage');
  }
  const store = new AssistantStore(tab, local);
  const root = createRoot(element);
  mounted = true;
  element.dataset.mounted = '';
  const render = () => {
    const locale = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
    root.render(<App store={store} locale={locale} work={context()} />);
  };
  render();
  const unbind = bindAssistantLifecycle(store);
  if (store.getSnapshot().device) void store.connect();
  document.addEventListener('astro:page-load', render);
  if (import.meta.hot)
    import.meta.hot.dispose(() => {
      unbind();
      document.removeEventListener('astro:page-load', render);
      void store.disconnect();
      root.unmount();
      mounted = false;
    });
}
