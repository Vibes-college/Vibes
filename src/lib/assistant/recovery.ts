// Ported from Paseo HostRuntimeController (single-flight/generation ownership) and
// ViewedTimelineSync (cancelable exponential retry). Source/differences: research.md.
export type RecoveryReason =
  'connect' | 'manual' | 'resume' | 'pageshow' | 'network' | 'transport' | 'gap' | 'retry';
export type RecoveryStage =
  | 'idle'
  | 'connect'
  | 'probe'
  | 'identity'
  | 'directory'
  | 'subscribe'
  | 'history'
  | 'ready'
  | 'waiting'
  | 'blocked';
export type FaultCode =
  | 'timeout'
  | 'unavailable'
  | 'identity'
  | 'protocol'
  | 'release'
  | 'cooldown'
  | 'canceled'
  | 'unknown';

export class RecoveryFault extends Error {
  readonly stage: RecoveryStage;
  readonly code: FaultCode;
  readonly terminal: boolean;
  constructor(stage: RecoveryStage, code: FaultCode, terminal = false) {
    super(code);
    this.stage = stage;
    this.code = code;
    this.terminal = terminal;
  }
}

export function bounded<T>(
  work: Promise<T>,
  ms: number,
  signal: AbortSignal,
  stage: RecoveryStage,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const cancel = () => fail(new RecoveryFault(stage, 'canceled'));
    const timer = setTimeout(() => fail(new RecoveryFault(stage, 'timeout')), ms);
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
    void work.then((value) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    }, fail);
  });
}

// Kept from ViewedTimelineSync; jitter is added only by the scheduling owner.
export const nextRetryDelay = (previous: number | undefined): number =>
  previous == null ? 1_000 : Math.min(previous * 2, 30_000);

export interface RetryPorts {
  run(signal: AbortSignal, reason: RecoveryReason, attempt: number): Promise<void>;
  failed(error: unknown, retryMs: number | null): void;
  schedule?(fn: () => void, ms: number): () => void;
  random?(): number;
}

export class RecoveryTask {
  private running: { promise: Promise<void>; controller: AbortController; version: number } | null =
    null;
  private cancelRetry: (() => void) | null = null;
  private version = 0;
  private delay: number | undefined;
  private attempt = 0;
  private blocked = false;
  enabled = false;
  visible = true;
  private ports: RetryPorts;
  constructor(ports: RetryPorts) {
    this.ports = ports;
  }
  get resources() {
    return { inFlight: this.running ? 1 : 0, retryTimers: this.cancelRetry ? 1 : 0 };
  }
  invalidate() {
    this.version++;
    this.running?.controller.abort();
    this.cancelRetry?.();
    this.cancelRetry = null;
  }
  stop() {
    this.enabled = false;
    this.invalidate();
    return this.running?.promise ?? Promise.resolve();
  }
  visibility(visible: boolean) {
    this.visible = visible;
    if (!visible) this.invalidate();
  }
  start(reason: RecoveryReason = 'connect') {
    this.enabled = true;
    this.blocked = false;
    return this.request(reason);
  }
  request(reason: RecoveryReason): Promise<void> {
    if (!this.enabled || !this.visible || this.blocked) return Promise.resolve();
    this.cancelRetry?.();
    this.cancelRetry = null;
    if (this.running) {
      const current = this.running;
      return current.version === this.version
        ? current.promise
        : current.promise.then(() => this.request(reason));
    }
    const controller = new AbortController();
    const version = this.version;
    const promise = Promise.resolve()
      .then(async () => {
        if (controller.signal.aborted) return;
        try {
          await this.ports.run(controller.signal, reason, ++this.attempt);
          if (!controller.signal.aborted) {
            this.delay = undefined;
            this.attempt = 0;
          }
        } catch (error) {
          if (controller.signal.aborted || version !== this.version || !this.enabled) return;
          const terminal = error instanceof RecoveryFault && error.terminal;
          this.blocked = terminal;
          this.delay = nextRetryDelay(this.delay);
          const retryMs = terminal
            ? null
            : Math.round(this.delay * (0.8 + (this.ports.random?.() ?? Math.random()) * 0.2));
          this.ports.failed(error, retryMs);
          if (retryMs !== null && this.visible) {
            const schedule =
              this.ports.schedule ??
              ((fn, ms) => {
                const handle = setTimeout(fn, ms);
                return () => clearTimeout(handle);
              });
            this.cancelRetry = schedule(() => {
              this.cancelRetry = null;
              void this.request('retry');
            }, retryMs);
          }
        }
      })
      .finally(() => {
        if (this.running?.promise === promise) this.running = null;
      });
    this.running = { promise, controller, version };
    return promise;
  }
}
