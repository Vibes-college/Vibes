import {
  parseAssistantEvent,
  type AssistantEvent,
  type AssistantLocale,
  type PaseoHandle,
  type PaseoModule,
  type Presentation,
} from './contract';
import { parsePaseoAssetConfig } from './asset-contract';

type Stage =
  'idle' | 'loading' | 'initializing' | 'operable' | 'resource-error' | 'fatal' | 'disposed';
interface Environment extends Presentation {
  root: HTMLElement;
  width: number;
  height: number;
  locale: AssistantLocale;
  subscribe(listener: () => void): () => void;
  setPresentation(value: Presentation): void;
  setLocale(value: AssistantLocale): void;
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
const retry = panel.querySelector<HTMLButtonElement>('[data-paseo-retry]')!;
const locale = (): AssistantLocale =>
  document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
const listeners = new Set<() => void>();
let stage: Stage = 'idle';
let handle: PaseoHandle | undefined;
let starting: Promise<void> | undefined;
let nativeRequest: Promise<PaseoModule> | undefined;
let opener: HTMLElement | undefined;
let stalled = false;
let timer: ReturnType<typeof setTimeout> | undefined;
const styleRequests = new Map<string, Promise<void>>();
const notify = () => {
  for (const listener of listeners) listener();
};
const environment: Environment = {
  root,
  width: root.clientWidth || Math.min(720, innerWidth),
  height: root.clientHeight || innerHeight - 100,
  visible: !panel.hidden,
  focused: false,
  pageVisible: !document.hidden,
  locale: locale(),
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
      value.pageVisible === this.pageVisible
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
  const value = {
    visible: !panel.hidden && stage !== 'fatal' && stage !== 'disposed',
    focused: root.contains(document.activeElement) && document.hasFocus(),
    pageVisible: !document.hidden,
  };
  environment.setPresentation(value);
}
function renderStatus() {
  const zh = locale() === 'zh';
  panel.setAttribute('aria-label', zh ? '本地助手' : 'Local assistant');
  panel.querySelector('[data-paseo-close]')!.textContent = zh ? '收起' : 'Close';
  panel.querySelector('[data-paseo-exit]')!.textContent = zh ? '退出并刷新' : 'Exit and reload';
  const messages = zh
    ? {
        idle: '正在加载本地助手…',
        loading: '正在加载本地助手…',
        initializing: '正在打开 Paseo…',
        operable: '本地助手已打开。',
        'resource-error': '助手资源加载失败，请检查网络后重试。',
        fatal: '助手初始化失败，请刷新页面后再打开。',
        disposed: '正在退出；本地任务不会因此停止。',
      }
    : {
        idle: 'Loading the local assistant…',
        loading: 'Loading the local assistant…',
        initializing: 'Opening Paseo…',
        operable: 'The local assistant is open.',
        'resource-error': 'Assistant resources failed to load. Check your connection and retry.',
        fatal: 'Assistant initialization failed. Reload the page, then open it again.',
        disposed: 'Exiting; local tasks will continue.',
      };
  status.textContent = stalled
    ? zh
      ? '加载尚未完成。可刷新页面后再打开助手。'
      : 'Loading has not finished. Reload the page, then open the assistant again.'
    : messages[stage];
  panel.dataset.paseoState = stage;
  notice.hidden = stage === 'operable';
  retry.hidden = stalled || stage !== 'resource-error';
  panel.querySelector<HTMLButtonElement>('[data-paseo-reload]')!.hidden =
    !stalled && stage !== 'resource-error' && stage !== 'fatal';
  retry.textContent =
    stage === 'resource-error' && !stalled
      ? zh
        ? '重试'
        : 'Retry'
      : zh
        ? '刷新页面'
        : 'Reload page';
  root.hidden = stage === 'fatal';
  document
    .querySelectorAll('[data-paseo-open]')
    .forEach((button) => button.setAttribute('aria-expanded', String(!panel.hidden)));
}
function receive(input: AssistantEvent) {
  const event = parseAssistantEvent(input);
  if (!event || stage === 'disposed' || stage === 'fatal') return;
  if (event.type === 'close') {
    hideAssistant();
    return;
  }
  if (event.type === 'ready') {
    stage = 'operable';
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
      },
      onEvent: receive,
    });
  } catch {
    clearTimeout(timer);
    if (mounting || (stage as Stage) === 'fatal') stage = 'fatal';
    else stage = 'resource-error';
    renderStatus();
  } finally {
    starting = undefined;
  }
}
export async function openAssistant(button?: HTMLElement, visible = true) {
  if (stage === 'disposed') return;
  opener = button ?? opener;
  panel.hidden = !visible;
  panel.dataset.openRequested = String(visible);
  environment.setLocale(locale());
  presentation();
  renderStatus();
  if (visible) root.focus({ preventScroll: true });
  if (stage === 'idle' || stage === 'resource-error') starting ??= start();
  await starting;
}
export function hideAssistant() {
  panel.hidden = true;
  panel.dataset.openRequested = 'false';
  presentation();
  renderStatus();
  (opener?.isConnected
    ? opener
    : document.querySelector<HTMLButtonElement>('[data-paseo-open]')
  )?.focus({ preventScroll: true });
}
export async function exitAssistant() {
  if (stage === 'disposed') return;
  try {
    if (handle) await handle.dispatch({ version: 1, type: 'dispose' });
    else location.reload();
  } catch {
    // Native dispose normally reloads; only recover here if it failed to exit.
    location.reload();
  }
}
retry.addEventListener('click', () => {
  if (stage === 'resource-error' && !stalled) void openAssistant();
  else location.reload();
});
for (const type of ['focusin', 'focusout', 'visibilitychange'])
  document.addEventListener(type, () => queueMicrotask(presentation));
window.addEventListener('focus', presentation);
window.addEventListener('blur', presentation);
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
