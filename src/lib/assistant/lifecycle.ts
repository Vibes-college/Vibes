import type { AssistantStore } from './store.ts';

// Browser events are hints. A fresh SDK probe and authoritative snapshot decide readiness.
export function bindAssistantLifecycle(store: AssistantStore, win = window, doc = document) {
  const visible = () => store.visibility(doc.visibilityState !== 'hidden');
  const hide = () => store.visibility(false);
  const show = () => {
    visible();
    void store.recoverFrom('pageshow');
  };
  const network = () => {
    void store.recoverFrom('network');
  };
  const activity = (event: Event) => {
    if (event.target instanceof Element && event.target.closest('.assistant-ui-scope'))
      store.recordActivity();
  };
  visible();
  doc.addEventListener('visibilitychange', visible);
  win.addEventListener('pageshow', show);
  win.addEventListener('pagehide', hide);
  win.addEventListener('online', network);
  doc.addEventListener('pointerdown', activity, { passive: true });
  doc.addEventListener('keydown', activity);
  return () => {
    doc.removeEventListener('visibilitychange', visible);
    win.removeEventListener('pageshow', show);
    win.removeEventListener('pagehide', hide);
    win.removeEventListener('online', network);
    doc.removeEventListener('pointerdown', activity);
    doc.removeEventListener('keydown', activity);
  };
}
