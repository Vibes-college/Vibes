import {
  parseAssistantEvent,
  type AssistantEvent,
  type AssistantLocale,
  type AssistantSurface,
  type PaseoHandle,
  type PaseoModule,
  type Presentation,
  type PublicWorkDraft,
} from './contract';
import { parsePaseoAssetConfig } from './asset-contract';
import { createPublicWorkDraft } from './page-context';
import { shellCopy, updateShellCopy } from './shell-copy';

type Stage =
  'idle' | 'loading' | 'initializing' | 'operable' | 'resource-error' | 'fatal' | 'disposed';
interface Environment extends Presentation {
  root: HTMLElement;
  width: number;
  height: number;
  locale: AssistantLocale;
  publicWork: PublicWorkDraft | null;
  subscribe(listener: () => void): () => void;
  setPresentation(value: Presentation): void;
  setLocale(value: AssistantLocale): void;
  setPublicWork(value: PublicWorkDraft | null): void;
  onEvent(event: AssistantEvent): void;
}
declare global {
  var __vibesPaseoEnvironment: Environment | undefined;
  var __vibesPaseo: PaseoModule | undefined;
}
const panel = document.getElementById('local-assistant')!;
const root = panel.querySelector<HTMLElement>('#root')!;
const config = parsePaseoAssetConfig(JSON.parse(panel.dataset.paseoConfig || 'null'));
if (!config) throw new Error('Invalid native asset configuration.');
const notice = panel.querySelector<HTMLElement>('[data-paseo-notice]')!;
const status = panel.querySelector<HTMLElement>('[data-paseo-status]')!;
const onboarding = panel.querySelector<HTMLElement>('[data-paseo-onboarding]')!;
const locale = (): AssistantLocale =>
  document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
const surface = (): AssistantSurface =>
  panel.dataset.paseoSurface === 'full' ? 'full' : 'compact';
const guideOpen = () => panel.dataset.paseoGuide !== 'false';
const listeners = new Set<() => void>();
let stage: Stage = 'idle';
let handle: PaseoHandle | undefined;
let starting: Promise<void> | undefined;
let nativeRequest: Promise<PaseoModule> | undefined;
let opener: HTMLElement | undefined;
let lastNativeFocus: HTMLElement | null = null;
let pendingDraft: PublicWorkDraft | null = null;
let delivering: Promise<void> | undefined;
let referenceError = false;
let nativeReady = false;
let stalled = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let retentionGeneration = 0;
const styleRequests = new Map<string, Promise<void>>();
const notify = () => {
  for (const listener of listeners) listener();
};
const environment: Environment = {
  root,
  width: root.clientWidth || Math.min(400, innerWidth),
  height: root.clientHeight || innerHeight - 100,
  visible: !panel.hidden && !guideOpen(),
  focused: false,
  pageVisible: !document.hidden,
  surface: surface(),
  locale: locale(),
  publicWork: null,
  subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setPresentation(value) {
    if (
      value.visible === this.visible &&
      value.focused === this.focused &&
      value.pageVisible === this.pageVisible &&
      value.surface === this.surface
    )
      return;
    Object.assign(this, value);
    notify();
  },
  setLocale(value) {
    if (this.locale !== value) {
      this.locale = value;
      notify();
    }
  },
  setPublicWork(value) {
    if (this.publicWork?.requestId === value?.requestId) return;
    this.publicWork = value;
    notify();
  },
  onEvent: receive,
};
Object.defineProperty(globalThis, '__vibesPaseoEnvironment', { value: environment });
new ResizeObserver(() => {
  if (!root.clientWidth || !root.clientHeight) return;
  if (environment.width === root.clientWidth && environment.height === root.clientHeight) return;
  environment.width = root.clientWidth;
  environment.height = root.clientHeight;
  notify();
}).observe(root);

function presentation() {
  const visible = !panel.hidden && !guideOpen() && stage !== 'fatal' && stage !== 'disposed';
  environment.setPresentation({
    visible,
    focused: visible && root.contains(document.activeElement) && document.hasFocus(),
    pageVisible: !document.hidden,
    surface: surface(),
  });
}
function renderStatus() {
  const text = shellCopy[locale()];
  updateShellCopy(panel, locale());
  const messages: Record<Stage, string> = {
    idle: text.idle,
    loading: text.loading,
    initializing: text.initializing,
    operable: text.operable,
    'resource-error': text.resourceError,
    fatal: text.fatal,
    disposed: text.disposed,
  };
  status.textContent = referenceError
    ? text.referenceError
    : stalled
      ? text.stalled
      : messages[stage];
  panel.dataset.paseoState = stage;
  onboarding.hidden = !guideOpen();
  onboarding.setAttribute('aria-label', text.help);
  root.inert = guideOpen() || panel.hidden || stage === 'fatal';
  root.setAttribute('aria-hidden', String(root.inert));
  panel.inert = panel.hidden;
  panel.setAttribute('aria-hidden', String(panel.hidden));
  notice.hidden = stage === 'operable' && !guideOpen() && !referenceError;
  panel.querySelector<HTMLButtonElement>('[data-paseo-retry]')!.hidden =
    stalled || stage !== 'resource-error';
  panel.querySelector<HTMLButtonElement>('[data-paseo-reload]')!.hidden =
    !stalled && stage !== 'resource-error' && stage !== 'fatal';
  panel.querySelector<HTMLButtonElement>('[data-paseo-reference-retry]')!.hidden = !referenceError;
  panel.querySelector<HTMLButtonElement>('[data-paseo-expand]')!.hidden = surface() === 'full';
  panel.querySelector<HTMLButtonElement>('[data-paseo-compact]')!.hidden = surface() === 'compact';
  const close = panel.querySelector<HTMLButtonElement>('[data-paseo-close]')!;
  close.setAttribute('aria-label', surface() === 'full' ? text.compact : text.close);
  close.title = close.getAttribute('aria-label')!;
  document
    .querySelectorAll('[data-paseo-open]')
    .forEach((button) => button.setAttribute('aria-expanded', String(!panel.hidden)));
}
function receive(input: AssistantEvent) {
  const event = parseAssistantEvent(input);
  if (!event || stage === 'disposed' || stage === 'fatal') return;
  if (event.type === 'close') {
    closeAssistant();
    return;
  }
  if (event.type === 'saved-hosts') {
    // The native registry can skip first-time help without exposing pairing
    // material. This says nothing about whether that computer is online.
    if (panel.dataset.paseoGuideRequested !== 'true') showSetup(false, false);
    return;
  }
  if (event.type === 'surface') {
    setSurface(event.value);
    return;
  }
  if (event.type === 'ready' || (event.type === 'state' && event.value === 'operable')) {
    // This is a mounted native UI, not proof of pairing or a usable Agent.
    stage = 'operable';
    nativeReady = true;
    stalled = false;
    clearTimeout(timer);
  }
  if (event.type === 'state' && event.value === 'initializing') stage = 'initializing';
  if (event.type === 'state' && event.value === 'disposed') stage = 'disposed';
  if (event.type === 'error') {
    stage = event.retryable && event.code === 'resource' ? 'resource-error' : 'fatal';
    clearTimeout(timer);
  }
  renderStatus();
  presentation();
}
function loadStyle(file: { url: string; integrity: string }): Promise<void> {
  const existing = styleRequests.get(file.url);
  if (existing) return existing;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = file.url;
  link.integrity = file.integrity;
  link.crossOrigin = 'anonymous';
  link.dataset.paseoResource = file.url;
  const request = new Promise<void>((resolve, reject) => {
    link.onload = () => resolve();
    link.onerror = () => {
      link.remove();
      styleRequests.delete(file.url);
      reject(new Error('resource'));
    };
    document.head.append(link);
  });
  styleRequests.set(file.url, request);
  return request;
}
function loadNative(): Promise<PaseoModule> {
  if (globalThis.__vibesPaseo) return Promise.resolve(globalThis.__vibesPaseo);
  if (nativeRequest) return nativeRequest;
  const script = document.createElement('script');
  script.src = config!.script.url;
  script.integrity = config!.script.integrity;
  script.crossOrigin = 'anonymous';
  script.dataset.paseoResource = config!.script.url;
  nativeRequest = new Promise<PaseoModule>((resolve, reject) => {
    script.onload = () => {
      if (typeof globalThis.__vibesPaseo?.mount === 'function') resolve(globalThis.__vibesPaseo);
      else {
        stage = 'fatal';
        reject(new Error('initialization'));
      }
    };
    script.onerror = () => {
      script.remove();
      nativeRequest = undefined;
      reject(new Error('resource'));
    };
    document.head.append(script);
  });
  return nativeRequest;
}
async function start() {
  stage = 'loading';
  stalled = false;
  renderStatus();
  presentation();
  timer = setTimeout(() => {
    stalled = true;
    renderStatus();
  }, 30000);
  let mounting = false;
  try {
    const [module] = await Promise.all([loadNative(), ...config!.styles.map(loadStyle)]);
    stage = 'initializing';
    mounting = true;
    renderStatus();
    handle = await module.mount({
      root,
      locale: locale(),
      presentation: {
        visible: environment.visible,
        focused: environment.focused,
        pageVisible: environment.pageVisible,
        surface: environment.surface,
      },
      onEvent: receive,
    });
    if (nativeReady && (stage as Stage) !== 'disposed' && (stage as Stage) !== 'fatal') {
      stage = 'operable';
      stalled = false;
      clearTimeout(timer);
      renderStatus();
    }
    await flushArticleReference();
  } catch {
    clearTimeout(timer);
    if (mounting || (stage as Stage) === 'fatal') stage = 'fatal';
    else stage = 'resource-error';
    renderStatus();
    presentation();
  } finally {
    starting = undefined;
  }
}
async function flushArticleReference() {
  if (!handle || delivering || !pendingDraft) return;
  delivering = (async () => {
    while (handle && pendingDraft) {
      const draft = pendingDraft;
      try {
        await handle.dispatch({ version: 1, type: 'draft', value: draft });
        if (pendingDraft.requestId === draft.requestId) pendingDraft = null;
        referenceError = false;
      } catch {
        referenceError = true;
        break;
      }
    }
    renderStatus();
  })();
  await delivering;
  delivering = undefined;
}
export function attachArticleReference(reference: unknown, requestId: string) {
  const draft = createPublicWorkDraft(reference, requestId);
  if (!draft) return;
  pendingDraft = draft;
  referenceError = false;
  void flushArticleReference();
}

interface SurfaceRetention {
  active: HTMLElement | null;
  selection: { start: number; end: number; direction: 'forward' | 'backward' | 'none' } | null;
  timeline: HTMLElement | null;
  bottomOffset: number;
  articleY: number;
}
let hiddenRetention: SurfaceRetention | undefined;
function captureSurface(): SurfaceRetention {
  const active =
    document.activeElement instanceof HTMLElement && root.contains(document.activeElement)
      ? document.activeElement
      : lastNativeFocus?.isConnected
        ? lastNativeFocus
        : null;
  const input = active instanceof HTMLTextAreaElement ? active : null;
  const timeline =
    [...root.querySelectorAll<HTMLElement>('[data-testid="agent-chat-scroll"]')].find(
      (element) => element.clientHeight > 0 && element.clientWidth > 0,
    ) ?? null;
  return {
    active,
    selection: input
      ? {
          start: input.selectionStart,
          end: input.selectionEnd,
          direction: input.selectionDirection,
        }
      : null,
    timeline,
    bottomOffset: timeline ? timeline.scrollHeight - timeline.clientHeight - timeline.scrollTop : 0,
    articleY: scrollY,
  };
}
function restoreSurface(snapshot: SurfaceRetention, restoreArticle: boolean) {
  const generation = ++retentionGeneration;
  let frames = 0;
  const restore = () => {
    if (generation !== retentionGeneration || panel.hidden) return;
    if (restoreArticle) window.scrollTo({ top: snapshot.articleY, behavior: 'instant' });
    if (snapshot.timeline?.isConnected) {
      snapshot.timeline.scrollTop = Math.max(
        0,
        snapshot.timeline.scrollHeight - snapshot.timeline.clientHeight - snapshot.bottomOffset,
      );
    }
    if (snapshot.active?.isConnected && !guideOpen()) {
      snapshot.active.focus({ preventScroll: true });
      if (snapshot.active instanceof HTMLTextAreaElement && snapshot.selection) {
        const { start, end, direction } = snapshot.selection;
        snapshot.active.setSelectionRange(start, end, direction);
      }
    }
    if (++frames < 3) requestAnimationFrame(restore);
  };
  requestAnimationFrame(restore);
}
export function setSurface(value: AssistantSurface) {
  if (surface() === value || stage === 'disposed') return;
  const snapshot = captureSurface();
  panel.dataset.paseoSurface = value;
  renderStatus();
  presentation();
  restoreSurface(snapshot, true);
}
export async function openAssistant(button?: HTMLElement, visible = true) {
  if (stage === 'disposed') return;
  opener = button ?? opener;
  const wasHidden = panel.hidden;
  panel.hidden = !visible;
  panel.dataset.openRequested = String(visible);
  environment.setLocale(locale());
  renderStatus();
  presentation();
  if (visible && wasHidden) {
    if (hiddenRetention) restoreSurface(hiddenRetention, false);
    else if (guideOpen())
      panel
        .querySelector<HTMLButtonElement>('[data-paseo-connect]')
        ?.focus({ preventScroll: true });
    else root.focus({ preventScroll: true });
  }
  if (stage === 'idle' || stage === 'resource-error') starting ??= start();
  await starting;
}
export function hideAssistant() {
  if (!panel.hidden) hiddenRetention = captureSurface();
  retentionGeneration++;
  panel.hidden = true;
  panel.dataset.openRequested = 'false';
  renderStatus();
  presentation();
  (opener?.isConnected ? opener : document.querySelector<HTMLButtonElement>('.paseo-entry'))?.focus(
    { preventScroll: true },
  );
}
export function closeAssistant() {
  if (surface() === 'full') setSurface('compact');
  else hideAssistant();
}
export function showSetup(show: boolean, focus = true) {
  panel.dataset.paseoGuide = String(show);
  panel.dataset.paseoGuideRequested = String(show);
  if (!show) {
    // This preference only dismisses help. The native UI still checks actual
    // devices, connection and Agent availability; it is not a pairing flag.
    try {
      localStorage.setItem('vibes:paseo:setup-dismissed', '1');
    } catch {
      /* Optional preference. */
    }
  }
  renderStatus();
  presentation();
  if (!show && focus) root.focus({ preventScroll: true });
}
function viewport() {
  const view = window.visualViewport;
  panel.style.setProperty('--paseo-viewport-height', `${view?.height ?? innerHeight}px`);
  panel.style.setProperty('--paseo-viewport-width', `${view?.width ?? innerWidth}px`);
  panel.style.setProperty('--paseo-viewport-top', `${view?.offsetTop ?? 0}px`);
  panel.style.setProperty('--paseo-viewport-left', `${view?.offsetLeft ?? 0}px`);
}
panel.querySelector('[data-paseo-retry]')!.addEventListener('click', () => {
  if (stage === 'resource-error' && !stalled) void openAssistant();
});
panel.querySelector('[data-paseo-reference-retry]')!.addEventListener('click', () => {
  referenceError = false;
  void flushArticleReference();
});
document.addEventListener('focusin', (event) => {
  if (event.target instanceof HTMLElement && root.contains(event.target))
    lastNativeFocus = event.target;
  queueMicrotask(presentation);
});
for (const type of ['focusout', 'visibilitychange'])
  document.addEventListener(type, () => queueMicrotask(presentation));
window.addEventListener('focus', presentation);
window.addEventListener('blur', presentation);
window.addEventListener('resize', viewport);
window.visualViewport?.addEventListener('resize', viewport);
window.visualViewport?.addEventListener('scroll', viewport);
document.addEventListener('astro:page-load', () => {
  environment.setLocale(locale());
  renderStatus();
  presentation();
});
document.addEventListener('astro:before-swap', (event) => {
  const next = (event as Event & { newDocument: Document }).newDocument;
  for (const element of document.head.querySelectorAll<HTMLElement>(
    'style[id], link[data-paseo-resource]',
  )) {
    if (
      !element.dataset.paseoResource &&
      !/^(react-native-stylesheet|unistyles-web|Reanimated|paseo-)/.test(element.id)
    )
      continue;
    const key = element.dataset.paseoResource || element.id;
    element.setAttribute('data-astro-transition-persist', key);
    const placeholder = next.createElement(element.tagName.toLowerCase());
    placeholder.setAttribute('data-astro-transition-persist', key);
    next.head.append(placeholder);
  }
});
viewport();
renderStatus();
