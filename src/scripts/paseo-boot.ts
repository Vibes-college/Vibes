export {};

let host: typeof import('../features/paseo-webui/host') | undefined;
let loading: Promise<void> | undefined;
let pendingDraft: { reference: unknown; requestId: string } | null = null;
let latestOpener: HTMLElement | undefined;
const panel = () => document.getElementById('local-assistant');
const locale = () => (document.documentElement.lang.startsWith('zh') ? 'zh' : 'en');
function show(visible: boolean) {
  const element = panel();
  if (!element) return;
  element.hidden = !visible;
  element.inert = !visible;
  element.setAttribute('aria-hidden', String(!visible));
  element.dataset.openRequested = String(visible);
  document
    .querySelectorAll('[data-paseo-open]')
    .forEach((button) => button.setAttribute('aria-expanded', String(visible)));
}
function setup(showGuide: boolean) {
  const element = panel();
  if (!element) return;
  element.dataset.paseoGuide = String(showGuide);
  element.dataset.paseoGuideRequested = String(showGuide);
  element.querySelector<HTMLElement>('[data-paseo-onboarding]')!.hidden = !showGuide;
  const root = element.querySelector<HTMLElement>('#root')!;
  root.inert = showGuide || element.hidden;
  root.setAttribute('aria-hidden', String(root.inert));
  if (!showGuide) {
    try {
      localStorage.setItem('vibes:paseo:setup-dismissed', '1');
    } catch {
      /* Optional preference. */
    }
  }
}
function enable() {
  const element = panel();
  if (!element) return;
  if (!host) {
    try {
      if (localStorage.getItem('vibes:paseo:setup-dismissed') === '1') setup(false);
    } catch {
      /* The guide remains usable when browser storage is unavailable. */
    }
    // Current-page text comes from Astro. The long bilingual help and strict
    // native contract stay in the click-loaded host, outside Explore's graph.
    const copy: Record<string, string> = JSON.parse(
      document.querySelector<HTMLElement>('[data-paseo-copy-map]')?.dataset.paseoCopyMap || '{}',
    );
    for (const node of element.querySelectorAll<HTMLElement>('[data-paseo-copy]')) {
      const text = copy[node.dataset.paseoCopy!];
      if (typeof text === 'string') node.textContent = text;
    }
    for (const node of element.querySelectorAll<HTMLElement>('[data-paseo-label]')) {
      const text = copy[node.dataset.paseoLabel!];
      if (typeof text === 'string') {
        node.setAttribute('aria-label', text);
        node.title = text;
      }
    }
    if (copy.assistant) element.setAttribute('aria-label', copy.assistant);
  }
  document.querySelectorAll<HTMLButtonElement>('[data-paseo-open]').forEach((button) => {
    button.disabled = false;
    button.setAttribute('aria-expanded', String(!element.hidden));
  });
}
function changeSurface(value: 'compact' | 'full') {
  if (host) {
    host.setSurface(value);
    return;
  }
  const element = panel();
  if (!element) return;
  element.dataset.paseoSurface = value;
  element.querySelector<HTMLButtonElement>('[data-paseo-expand]')!.hidden = value === 'full';
  element.querySelector<HTMLButtonElement>('[data-paseo-compact]')!.hidden = value === 'compact';
}
function startHost() {
  if (loading) return;
  loading = import('../features/paseo-webui/host')
    .then(async (module) => {
      host = module;
      if (pendingDraft) {
        host.attachArticleReference(pendingDraft.reference, pendingDraft.requestId);
        pendingDraft = null;
      }
      await host.openAssistant(latestOpener, panel()?.dataset.openRequested === 'true');
    })
    .catch(() => {
      const element = panel();
      if (!element) return;
      element.dataset.paseoState = 'fatal';
      const status = element.querySelector('[data-paseo-status]');
      if (status)
        status.textContent =
          locale() === 'zh'
            ? '助手无法打开，请刷新页面后重试。'
            : 'The assistant could not open. Reload the page to retry.';
      element.querySelector<HTMLElement>('[data-paseo-notice]')!.hidden = false;
      element.querySelector<HTMLButtonElement>('[data-paseo-reload]')!.hidden = false;
    });
}
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element) || !panel()) return;
  const button = event.target.closest<HTMLButtonElement>('button');
  if (!button) return;
  if (button.hasAttribute('data-paseo-reload')) location.reload();
  if (button.hasAttribute('data-paseo-close')) {
    if (host) host.closeAssistant();
    else if (panel()?.dataset.paseoSurface === 'full') changeSurface('compact');
    else {
      show(false);
      latestOpener?.focus({ preventScroll: true });
    }
  }
  if (button.hasAttribute('data-paseo-expand')) changeSurface('full');
  if (button.hasAttribute('data-paseo-compact')) changeSurface('compact');
  if (button.hasAttribute('data-paseo-help')) {
    if (host) host.showSetup(true);
    else setup(true);
  }
  if (button.hasAttribute('data-paseo-connect')) {
    if (host) host.showSetup(false);
    else setup(false);
  }
  if (!button.hasAttribute('data-paseo-open')) return;
  latestOpener = button;
  if (button.hasAttribute('data-paseo-article-open')) {
    try {
      // Capture the clicked article before any async import or Astro navigation.
      // The lazy host strictly validates this snapshot before it reaches Paseo.
      const draft = {
        reference: JSON.parse(button.dataset.paseoPublicWork || 'null') as unknown,
        requestId: crypto.randomUUID(),
      };
      if (host) host.attachArticleReference(draft.reference, draft.requestId);
      else pendingDraft = draft;
    } catch {
      /* Invalid optional metadata must not prevent native chat. */
    }
  }
  if (host) {
    void host.openAssistant(button);
    return;
  }
  show(true);
  startHost();
});
document.addEventListener('astro:page-load', enable);
enable();
