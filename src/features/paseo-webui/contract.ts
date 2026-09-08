/** Only public presentation data crosses this boundary. Native pairing, chat,
 * approvals, stop and host removal remain owned by Paseo. No generic RPC exists. */
export const CONTRACT_VERSION = 1 as const;
export const PUBLIC_DRAFT_LIMITS = Object.freeze({ id: 100, title: 240, summary: 2000, url: 2048 });
export type AssistantLocale = 'zh' | 'en';
export interface PublicWorkDraft {
  id: string;
  title: string;
  canonicalUrl: string;
  sourceUrl: string | null;
  summary: string;
}
export interface Presentation {
  visible: boolean;
  focused: boolean;
  pageVisible: boolean;
}
export type HostCommand =
  | { version: 1; type: 'presentation'; value: Presentation }
  | { version: 1; type: 'locale'; value: AssistantLocale }
  | { version: 1; type: 'draft'; value: PublicWorkDraft | null }
  | { version: 1; type: 'dispose' };
export type AssistantEvent =
  | { version: 1; type: 'ready' }
  | { version: 1; type: 'close' }
  | { version: 1; type: 'state'; value: 'initializing' | 'operable' | 'disposed' }
  | {
      version: 1;
      type: 'error';
      code: 'resource' | 'initialization' | 'fatal';
      retryable: boolean;
    };
export interface PaseoMountOptions {
  root: HTMLElement;
  locale: AssistantLocale;
  presentation: Presentation;
  onEvent(event: AssistantEvent): void;
}
export interface PaseoModule {
  /** The same root returns the same handle, including concurrent calls. A second
   * root fails. A disposed instance cannot remount until the document reloads. */
  mount(options: PaseoMountOptions): Promise<PaseoHandle>;
}
export interface PaseoHandle {
  /** Hide/navigation never dispose. Dispose is an explicit terminal lifecycle
   * operation; it does not stop remote agents or erase the saved host registry. */
  dispatch(command: HostCommand): Promise<void>;
}

function record(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const ownKeys = Reflect.ownKeys(value);
  return (
    ownKeys.length === keys.length &&
    keys.every((key) => descriptors[key] && 'value' in descriptors[key]) &&
    ownKeys.every((key) => typeof key === 'string' && keys.includes(key))
  );
}
function hasControlCharacters(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) return true;
  }
  return false;
}
function text(value: unknown, max: number, empty = false): value is string {
  return (
    typeof value === 'string' &&
    (empty || value.trim().length > 0) &&
    value.length <= max &&
    !hasControlCharacters(value)
  );
}
function publicUrl(value: unknown): value is string {
  if (!text(value, PUBLIC_DRAFT_LIMITS.url)) return false;
  try {
    const url = new URL(value);
    // Draft URLs come from published metadata, never the current browser URL.
    // No connection/auth material is accepted in credentials, queries or hashes.
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}
export function parsePublicWorkDraft(value: unknown): PublicWorkDraft | null {
  if (!record(value, ['id', 'title', 'canonicalUrl', 'sourceUrl', 'summary'])) return null;
  if (
    !text(value.id, PUBLIC_DRAFT_LIMITS.id) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id) ||
    !text(value.title, PUBLIC_DRAFT_LIMITS.title) ||
    !text(value.summary, PUBLIC_DRAFT_LIMITS.summary, true) ||
    !publicUrl(value.canonicalUrl) ||
    (value.sourceUrl !== null && !publicUrl(value.sourceUrl))
  )
    return null;
  return {
    id: value.id,
    title: value.title,
    summary: value.summary,
    canonicalUrl: value.canonicalUrl,
    sourceUrl: value.sourceUrl as string | null,
  };
}
export function parseHostCommand(value: unknown): HostCommand | null {
  if (record(value, ['version', 'type']) && value.version === 1 && value.type === 'dispose')
    return { version: 1, type: 'dispose' };
  if (!record(value, ['version', 'type', 'value']) || value.version !== 1) return null;
  if (value.type === 'locale' && (value.value === 'zh' || value.value === 'en'))
    return { version: 1, type: 'locale', value: value.value };
  if (value.type === 'draft') {
    if (value.value === null) return { version: 1, type: 'draft', value: null };
    const draft = parsePublicWorkDraft(value.value);
    return draft ? { version: 1, type: 'draft', value: draft } : null;
  }
  if (value.type === 'presentation' && record(value.value, ['visible', 'focused', 'pageVisible'])) {
    const { visible, focused, pageVisible } = value.value;
    if (
      typeof visible === 'boolean' &&
      typeof focused === 'boolean' &&
      typeof pageVisible === 'boolean'
    )
      return { version: 1, type: 'presentation', value: { visible, focused, pageVisible } };
  }
  return null;
}
export function parseAssistantEvent(value: unknown): AssistantEvent | null {
  if (record(value, ['version', 'type']) && value.version === 1) {
    if (value.type === 'ready' || value.type === 'close') return { version: 1, type: value.type };
  }
  if (
    record(value, ['version', 'type', 'value']) &&
    value.version === 1 &&
    value.type === 'state'
  ) {
    if (value.value === 'initializing' || value.value === 'operable' || value.value === 'disposed')
      return { version: 1, type: 'state', value: value.value };
  }
  if (
    record(value, ['version', 'type', 'code', 'retryable']) &&
    value.version === 1 &&
    value.type === 'error'
  ) {
    if (
      (value.code === 'resource' || value.code === 'initialization' || value.code === 'fatal') &&
      typeof value.retryable === 'boolean'
    )
      return { version: 1, type: 'error', code: value.code, retryable: value.retryable };
  }
  return null;
}
