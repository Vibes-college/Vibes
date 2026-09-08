import { bounded, RecoveryFault } from './recovery.ts';

export interface OwnedClient {
  close(): Promise<void>;
}

// Single-relay port of HostRuntimeController's ownership rules. Multi-candidate
// probing is intentionally absent: the SDK owns transport retries on this client.
export class ConnectionOwner<T extends OwnedClient> {
  client: T | null = null;
  generation = 0;
  private detach: (() => void) | null = null;
  private releasing: Promise<void> = Promise.resolve();
  private starts: number[] = [];
  private create: () => T;
  private mount: (client: T, valid: () => boolean) => () => void;
  private now: () => number;
  constructor(
    create: () => T,
    mount: (client: T, valid: () => boolean) => () => void,
    now = Date.now,
  ) {
    this.create = create;
    this.mount = mount;
    this.now = now;
  }
  async acquire(signal: AbortSignal): Promise<T> {
    const generation = this.generation;
    await this.releasing;
    if (signal.aborted || generation !== this.generation)
      throw new RecoveryFault('connect', 'canceled');
    if (this.client) return this.client;
    this.starts = this.starts.filter((at) => this.now() - at < 60_000);
    if (this.starts.length >= 3) throw new RecoveryFault('connect', 'cooldown');
    this.starts.push(this.now());
    const client = this.create();
    this.client = client;
    this.detach = this.mount(
      client,
      () => this.client === client && this.generation === generation,
    );
    return client;
  }
  release(): Promise<void> {
    this.generation++;
    this.detach?.();
    this.detach = null;
    const client = this.client;
    this.client = null;
    if (!client) return this.releasing;
    // A failed close poisons this chain: do not create another live client blindly.
    this.releasing = this.releasing.then(async () => {
      try {
        await bounded(client.close(), 4_000, new AbortController().signal, 'connect');
      } catch {
        throw new RecoveryFault('connect', 'release', true);
      }
    });
    return this.releasing;
  }
}
