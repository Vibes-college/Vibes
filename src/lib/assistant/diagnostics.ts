import type { RecoveryReason, RecoveryStage, FaultCode } from './recovery.ts';

export const diagnosticKey = 'vibes.local-assistant.diagnostics.v1';
const maxBytes = 256 * 1024;
const maxEvents = 500;
const lifetimeMs = 24 * 60 * 60 * 1000;
const stages = [
  'idle',
  'connect',
  'probe',
  'identity',
  'directory',
  'subscribe',
  'history',
  'ready',
  'waiting',
  'blocked',
];
const reasons = ['connect', 'manual', 'resume', 'pageshow', 'network', 'transport', 'gap', 'retry'];
const codes = [
  'timeout',
  'unavailable',
  'identity',
  'protocol',
  'release',
  'cooldown',
  'canceled',
  'unknown',
];
const events = ['recovery', 'stage', 'transport', 'lifecycle', 'operation', 'tool', 'storage'];
const statuses = [
  'start',
  'success',
  'failed',
  'canceled',
  'submitted',
  'confirmed',
  'unknown',
  'hidden',
  'visible',
  'connected',
  'disconnected',
  'connecting',
  'disposed',
  'idle',
];
const kinds = [
  'send',
  'create',
  'permission',
  'cancel',
  'read',
  'write',
  'browser',
  'command',
  'other',
];
const numericKeys = [
  'generation',
  'recovery',
  'attempt',
  'elapsedMs',
  'awayMs',
  'retryMs',
  'rows',
  'buffered',
  'connections',
  'subscriptions',
  'inFlight',
  'retryTimers',
  'rttMs',
  'seq',
  'count',
] as const;
export interface DiagnosticFields {
  stage?: RecoveryStage;
  reason?: RecoveryReason;
  code?: FaultCode;
  status?: (typeof statuses)[number];
  kind?: (typeof kinds)[number];
  session?: number;
  operation?: number;
  generation?: number;
  recovery?: number;
  attempt?: number;
  elapsedMs?: number;
  awayMs?: number;
  retryMs?: number;
  rows?: number;
  buffered?: number;
  connections?: number;
  subscriptions?: number;
  inFlight?: number;
  retryTimers?: number;
  rttMs?: number;
  seq?: number;
  count?: number;
}
interface Entry extends DiagnosticFields {
  event: string;
  at: number;
  boot: string;
}
const bootPattern = /^[a-f0-9-]{36}$/;
const version = (value: unknown) =>
  typeof value === 'string' && /^\d+(?:[._]\d+){0,3}(?:-[\w.-]{1,24})?$/.test(value)
    ? value
    : 'unknown';

// Both recording and rehydration project onto a whitelist. Never serialize errors,
// SDK log arguments, IDs, URLs, tool payloads or the contents of browser storage.
function fields(input: Record<string, unknown>): DiagnosticFields {
  const out: Record<string, unknown> = {};
  for (const [key, choices] of Object.entries({
    stage: stages,
    reason: reasons,
    code: codes,
    status: statuses,
    kind: kinds,
  }))
    if (typeof input[key] === 'string' && choices.includes(input[key] as string))
      out[key] = input[key];
  for (const key of [...numericKeys, 'session', 'operation']) {
    const value = input[key];
    if (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= Number.MAX_SAFE_INTEGER
    )
      out[key] = Math.round(value);
  }
  return out;
}

export class AssistantDiagnostics {
  private storage: Storage;
  private now: () => number;
  private entries: Entry[] = [];
  private aliases = new Map<string, number>();
  private nextAlias = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private boot = crypto.randomUUID();
  private daemon = 'unknown';
  storageAvailable = true;
  onStorageChange?: (available: boolean) => void;
  constructor(storage: Storage, now = Date.now) {
    this.storage = storage;
    this.now = now;
    try {
      const raw = storage.getItem(diagnosticKey);
      if (raw && raw.length <= maxBytes) {
        const value = JSON.parse(raw);
        if (Array.isArray(value))
          for (const item of value.slice(-maxEvents)) {
            if (
              item &&
              events.includes(item.event) &&
              typeof item.boot === 'string' &&
              bootPattern.test(item.boot) &&
              Number.isFinite(item.at) &&
              item.at <= now() &&
              now() - item.at < lifetimeMs
            )
              this.entries.push({
                ...fields(item),
                event: item.event,
                at: item.at,
                boot: item.boot,
              });
          }
      }
    } catch {
      this.storageAvailable = false;
    }
    this.prune();
  }
  alias(value: string) {
    if (!this.aliases.has(value)) {
      // Bound metadata independently of the event ring. Old numeric aliases never get reused.
      if (this.aliases.size >= maxEvents) this.aliases.delete(this.aliases.keys().next().value!);
      this.aliases.set(value, ++this.nextAlias);
    }
    return this.aliases.get(value)!;
  }
  daemonVersion(value: unknown) {
    this.daemon = version(value);
  }
  record(event: (typeof events)[number], input: DiagnosticFields = {}) {
    if (!events.includes(event)) return;
    this.entries.push({
      ...fields(input as Record<string, unknown>),
      event,
      at: this.now(),
      boot: this.boot,
    });
    this.prune();
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.flush();
      }, 1_000);
      this.timer.unref?.();
    }
  }
  private prune() {
    this.entries = this.entries
      .filter((entry) => entry.at <= this.now() && this.now() - entry.at < lifetimeMs)
      .slice(-maxEvents);
    while (new TextEncoder().encode(JSON.stringify(this.entries)).byteLength > maxBytes)
      this.entries.shift();
  }
  flush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.prune();
    const previous = this.storageAvailable;
    try {
      this.storage.setItem(diagnosticKey, JSON.stringify(this.entries));
      this.storageAvailable = true;
    } catch {
      this.storageAvailable = false;
    }
    if (previous !== this.storageAvailable) this.onStorageChange?.(this.storageAvailable);
  }
  clear() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.entries = [];
    this.aliases.clear();
    this.daemon = 'unknown';
    try {
      this.storage.removeItem(diagnosticKey);
      this.storageAvailable = true;
    } catch {
      this.storageAvailable = false;
    }
  }
  export() {
    this.flush();
    const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
    const build = (import.meta as ImportMeta & { env?: { PUBLIC_ASSISTANT_BUILD?: string } }).env
      ?.PUBLIC_ASSISTANT_BUILD;
    return JSON.stringify(
      {
        schema: 1,
        environment: {
          build:
            typeof build === 'string' && /^[a-f0-9]{7,40}$/.test(build) ? build : 'development',
          sdk: '0.7.2',
          daemon: this.daemon,
          browser: /Version\/[\d.]+.*Safari/.test(ua)
            ? 'Safari'
            : /Chrome\//.test(ua)
              ? 'Chromium'
              : 'unknown',
          browserVersion: version(ua.match(/(?:Version|Chrome)\/([\d.]+)/)?.[1]),
          system: /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : 'unknown',
          systemVersion: version(ua.match(/(?:OS|Mac OS X) ([\d_]+)/)?.[1]),
        },
        storageAvailable: this.storageAvailable,
        events: this.entries,
      },
      null,
      2,
    );
  }
}
