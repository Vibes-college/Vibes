import type { PaseoAgent, PaseoAgentProvider } from '@getpaseo/client';
import type { AgentPermissionResponse } from '@getpaseo/protocol/agent-types';
import { createConnection, type Connection, type DaemonEvent } from './paseo-client.ts';
import {
  deviceKey,
  forgetDevice,
  parsePairing,
  readDevice,
  saveDevice,
  type SavedDevice,
} from './pairing.ts';
import { maximumRows, mergeRows, type TimelinePage, type TimelineRow } from './timeline.ts';

export interface AssistantState {
  connection: 'offline' | 'connecting' | 'syncing' | 'ready';
  device: boolean;
  selectedId: string;
  agents: PaseoAgent[];
  providers: PaseoAgentProvider[];
  agent: PaseoAgent | null;
  rows: TimelineRow[];
  loading: boolean;
  busy: boolean;
  hasOlder: boolean;
  error: string | null;
  outcome: 'completed' | 'failed' | 'canceled' | null;
}
const initial = (): AssistantState => ({
  connection: 'offline',
  device: false,
  selectedId: '',
  agents: [],
  providers: [],
  agent: null,
  rows: [],
  loading: false,
  busy: false,
  hasOlder: false,
  error: null,
  outcome: null,
});
export class AssistantStore {
  private state = initial();
  private listeners = new Set<() => void>();
  private driver: Connection | null = null;
  private device: SavedDevice | null = null;
  private remember = false;
  private generation = 0;
  private selection = 0;
  private transport = 0;
  private operation = 0;
  private refresh = 0;
  private epoch = '';
  private cursor: TimelinePage['startCursor'] = null;
  private buffered: DaemonEvent[] = [];
  private unsubscribers: (() => void)[] = [];
  private syncing: Promise<void> | null = null;
  private tab: Storage;
  private local: Storage;
  private factory: typeof createConnection;
  constructor(tab: Storage, local: Storage, factory = createConnection) {
    this.tab = tab;
    this.local = local;
    this.factory = factory;
    this.device = readDevice(tab, local);
    try {
      this.remember = !!local.getItem(deviceKey);
    } catch {
      this.state.error = 'storage';
    }
    this.state = {
      ...this.state,
      device: !!this.device,
      selectedId: this.device?.selectedId ?? '',
    };
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<AssistantState>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  report = (error: string) => this.update({ error });
  private persist() {
    if (!this.device) return true;
    try {
      saveDevice(this.device, this.remember, this.tab, this.local);
      return true;
    } catch {
      this.report('storage');
      return false;
    }
  }
  async pair(input: string, remember: boolean) {
    let offer;
    try {
      offer = parsePairing(input);
    } catch {
      this.report('pairing');
      return;
    }
    await this.disconnect();
    this.device = { offer, clientId: globalThis.crypto.randomUUID() };
    this.remember = remember;
    this.update({ ...initial(), device: true });
    const saved = this.persist();
    await this.connect();
    if (!saved && !this.state.error) this.report('storage');
  }
  async connect() {
    if (!this.device) return;
    await this.disconnect();
    const generation = this.generation;
    const driver = this.factory(this.device);
    this.driver = driver;
    const valid = () => generation === this.generation && this.driver === driver;
    this.unsubscribers = [
      driver.onEvent((event) => {
        if (valid()) this.event(event);
      }),
      driver.onStatus((status) => {
        if (!valid()) return;
        if (status.status === 'connected') void this.resync();
        else {
          this.transport++;
          this.operation++;
          this.syncing = null;
          this.selection++;
          this.buffered = [];
          this.update({
            connection: status.status === 'connecting' ? 'connecting' : 'offline',
            loading: false,
            busy: false,
          });
        }
      }),
    ];
    this.update({ connection: 'connecting', error: null });
    try {
      await driver.connect();
      if (valid()) await this.resync();
    } catch {
      if (valid()) this.update({ connection: 'offline', error: 'connect' });
    }
  }
  async disconnect() {
    this.generation++;
    this.transport++;
    this.operation++;
    this.selection++;
    this.syncing = null;
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.unsubscribers = [];
    const old = this.driver;
    this.driver = null;
    this.buffered = [];
    this.update({ connection: 'offline', busy: false, loading: false });
    if (old) await old.close();
  }
  async forget() {
    await this.disconnect();
    this.device = null;
    try {
      forgetDevice(this.tab, this.local);
    } catch {
      this.update({ ...initial(), error: 'forgetStorage' });
      return;
    }
    this.update(initial());
  }
  resync = async () => {
    if (this.syncing) return this.syncing;
    const driver = this.driver,
      generation = this.generation,
      transport = this.transport;
    if (!driver || driver.status() !== 'connected') return;
    this.update({ connection: 'syncing', loading: true });
    const job = (async () => {
      try {
        driver.verify();
        const [directory, providers] = await Promise.all([driver.directory(), driver.providers()]);
        if (generation !== this.generation || transport !== this.transport) return;
        if (providers.error) throw new Error('providers');
        const agents = directory.entries.map((entry) => entry.agent);
        this.update({
          agents,
          providers: providers.providers.filter((p) => p.available).map((p) => p.provider),
        });
        const selected = this.state.selectedId;
        if (selected) await this.select(selected);
        else this.update({ loading: false, connection: 'ready' });
      } catch {
        if (generation === this.generation && transport === this.transport)
          this.update({ loading: false, connection: 'offline', error: 'sync' });
      }
    })();
    this.syncing = job;
    await job;
    if (this.syncing === job) this.syncing = null;
  };
  select = async (id: string) => {
    const driver = this.driver,
      generation = this.generation,
      selection = ++this.selection;
    if (!driver || driver.status() !== 'connected') return;
    const valid = () => generation === this.generation && selection === this.selection;
    this.buffered = [];
    this.epoch = '';
    this.cursor = null;
    this.update({
      selectedId: id,
      agent: null,
      rows: [],
      loading: true,
      hasOlder: false,
      error: null,
      outcome: null,
    });
    try {
      await driver.subscribe(id);
      const page = await driver.timeline(id);
      if (!valid()) return;
      if (page.error || !page.agent) throw new Error('history');
      this.epoch = page.epoch;
      this.cursor = page.startCursor;
      this.update({
        agent: page.agent,
        rows: page.entries,
        hasOlder: page.hasOlder,
        loading: false,
        connection: 'ready',
      });
      if (this.device) {
        this.device = { ...this.device, selectedId: id };
        this.persist();
      }
      const buffered = this.buffered;
      this.buffered = [];
      for (const event of buffered) this.event(event);
    } catch {
      if (valid()) this.update({ loading: false, error: 'history', connection: 'offline' });
    }
  };
  older = async () => {
    const driver = this.driver,
      id = this.state.selectedId,
      generation = this.generation,
      selection = this.selection;
    if (!driver || !this.cursor || this.state.loading || !this.state.hasOlder) return;
    if (this.state.rows.length >= maximumRows) {
      this.report('historyLimit');
      return;
    }
    this.update({ loading: true });
    try {
      const page = await driver.timeline(id, 'before', this.cursor);
      if (generation !== this.generation || selection !== this.selection) return;
      if (page.error) throw new Error('history');
      if (page.epoch !== this.epoch || page.reset || page.staleCursor || page.gap) {
        await this.select(id);
        return;
      }
      this.cursor = page.startCursor;
      this.update({
        rows: mergeRows(this.state.rows, page.entries),
        hasOlder: page.hasOlder,
        loading: false,
      });
      const buffered = this.buffered;
      this.buffered = [];
      for (const event of buffered) this.event(event);
    } catch {
      if (generation === this.generation && selection === this.selection)
        this.update({ loading: false, error: 'history' });
    }
  };
  private event(event: DaemonEvent) {
    // A snapshot and a live update can cross in flight; replay selected-agent updates afterwards.
    if (this.state.loading && 'agentId' in event && event.agentId === this.state.selectedId) {
      this.buffered.push(event);
      if (this.buffered.length > maximumRows) void this.select(this.state.selectedId);
      return;
    }
    if (event.type === 'agent_update') {
      const update = event.payload;
      if (update.kind === 'upsert') {
        if (update.agent.id === this.state.selectedId) this.refresh++;
        const agents = this.state.agents.filter((agent) => agent.id !== update.agent.id);
        this.update({
          agents: [update.agent, ...agents].slice(0, 200),
          ...(update.agent.id === this.state.selectedId && !this.state.loading
            ? { agent: update.agent }
            : {}),
        });
      } else
        this.update({ agents: this.state.agents.filter((agent) => agent.id !== update.agentId) });
    }
    if (
      event.type === 'agent_update' &&
      event.payload.kind === 'remove' &&
      event.payload.agentId === this.state.selectedId
    ) {
      this.selection++;
      this.update({
        agent: null,
        rows: [],
        loading: false,
        selectedId: '',
        hasOlder: false,
        error: 'history',
      });
      return;
    }
    if (!('agentId' in event) || event.agentId !== this.state.selectedId) return;
    if (event.type === 'agent_stream') {
      const value = event.event;
      if (value.type === 'timeline') {
        if (event.seq === undefined || event.epoch !== this.epoch) {
          void this.select(event.agentId);
          return;
        }
        const last = this.state.rows.at(-1)?.seqEnd;
        // A canonical row may cover several stream sequence numbers.
        if (last !== undefined && event.seq <= last) return;
        if (last !== undefined && event.seq > last + 1) {
          void this.select(event.agentId);
          return;
        }
        const row: TimelineRow = {
          provider: value.provider,
          item: value.item,
          turnId: value.turnId,
          timestamp: event.timestamp,
          seqStart: event.seq,
          seqEnd: event.seq,
          sourceSeqRanges: [{ startSeq: event.seq, endSeq: event.seq }],
          collapsed: [],
        };
        const merged = mergeRows(this.state.rows, [row]);
        const trimmed = merged.length > maximumRows;
        const rows = merged.slice(-maximumRows);
        if (trimmed) this.cursor = { epoch: this.epoch, seq: rows[0].seqStart };
        this.update({ rows, ...(trimmed ? { hasOlder: true } : {}) });
      } else if (value.type === 'turn_started')
        this.update({
          outcome: null,
          ...(this.state.agent ? { agent: { ...this.state.agent, status: 'running' } } : {}),
        });
      else if (['turn_completed', 'turn_failed', 'turn_canceled'].includes(value.type)) {
        this.update({
          outcome:
            value.type === 'turn_completed'
              ? 'completed'
              : value.type === 'turn_canceled'
                ? 'canceled'
                : 'failed',
        });
        void this.refreshAgent(event.agentId);
      } else if (value.type === 'permission_requested' || value.type === 'permission_resolved')
        void this.refreshAgent(event.agentId);
    } else if (
      event.type === 'agent_permission_request' ||
      event.type === 'agent_permission_resolved'
    )
      void this.refreshAgent(event.agentId);
  }
  private async refreshAgent(id: string) {
    const generation = this.generation,
      selection = this.selection,
      refresh = ++this.refresh,
      driver = this.driver;
    if (!driver || this.state.selectedId !== id) return;
    try {
      const result = await driver.refresh(id);
      if (
        result &&
        generation === this.generation &&
        selection === this.selection &&
        refresh === this.refresh
      )
        this.update({ agent: result.agent });
    } catch {
      if (
        generation === this.generation &&
        selection === this.selection &&
        refresh === this.refresh
      )
        this.report('sync');
    }
  }
  models = async (provider: PaseoAgentProvider, cwd: string) => {
    if (!this.driver || this.state.connection !== 'ready') throw new Error('connect');
    return this.driver.models(provider, cwd);
  };
  create = async (provider: string, cwd: string) => {
    if (!cwd.trim() || !provider.includes('/')) {
      this.report('create');
      return;
    }
    const generation = this.generation,
      selection = this.selection;
    await this.operate(async (driver) => {
      const agent = await driver.create(provider, cwd.trim());
      if (generation === this.generation && selection === this.selection)
        await this.select(agent.id);
    }, 'create');
  };
  private async operate(action: (driver: Connection) => Promise<void>, error: string) {
    const driver = this.driver,
      generation = this.generation,
      selection = this.selection;
    if (
      !driver ||
      this.state.connection !== 'ready' ||
      this.state.loading ||
      this.state.busy ||
      this.state.error?.endsWith('Unknown')
    )
      return;
    const operation = ++this.operation;
    this.update({ busy: true, error: null });
    try {
      await action(driver);
    } catch {
      if (
        generation === this.generation &&
        selection === this.selection &&
        operation === this.operation
      )
        this.report(error);
    } finally {
      if (generation === this.generation && operation === this.operation)
        this.update({ busy: false });
    }
  }
  send = async (text: string) => {
    const agent = this.state.agent;
    if (
      !agent ||
      agent.status === 'running' ||
      agent.status === 'initializing' ||
      agent.pendingPermissions.length ||
      !text.trim()
    )
      return;
    const id = agent.id,
      generation = this.generation,
      selection = this.selection;
    await this.operate(async (driver) => {
      await driver.send(id, text, globalThis.crypto.randomUUID());
      if (
        generation === this.generation &&
        selection === this.selection &&
        this.state.selectedId === id
      )
        await this.select(id);
    }, 'sendUnknown');
  };
  cancel = async () => {
    const id = this.state.selectedId;
    await this.operate(async (driver) => {
      await driver.cancel(id);
      await this.refreshAgent(id);
    }, 'cancelUnknown');
  };
  permission = async (id: string, requestId: string, response: AgentPermissionResponse) => {
    if (
      this.state.agent?.id !== id ||
      !this.state.agent.pendingPermissions.some((p) => p.id === requestId)
    ) {
      this.report('permissionExpired');
      return;
    }
    await this.operate(async (driver) => {
      await driver.permission(id, requestId, response);
      await this.refreshAgent(id);
    }, 'permissionUnknown');
  };
}
