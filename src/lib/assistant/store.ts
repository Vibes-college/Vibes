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
import { ConnectionOwner } from './connection-owner.ts';
import {
  RecoveryTask,
  RecoveryFault,
  bounded,
  type RecoveryStage,
  type RecoveryReason,
} from './recovery.ts';
import { AssistantDiagnostics } from './diagnostics.ts';
import { OperationLedger, type OperationKind } from './operation-ledger.ts';
import { createClientActivityTracker, type ClientActivityTracker } from './activity.ts';

export interface AssistantState {
  connection: 'offline' | 'connecting' | 'syncing' | 'ready';
  recoveryStage: RecoveryStage;
  retryMs: number | null;
  unknown: boolean;
  diagnosticWarning: boolean;
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
  recoveryStage: 'idle',
  retryMs: null,
  unknown: false,
  diagnosticWarning: false,
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
  private owner: ConnectionOwner<Connection>;
  private recovery: RecoveryTask;
  private diagnostics: AssistantDiagnostics;
  private ledger: OperationLedger;
  private activity: ClientActivityTracker;
  private get driver() {
    return this.owner.client;
  }
  private pairVersion = 0;
  private verifiedGeneration = -1;
  private recoveryId = 0;
  private subscribed = false;
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
  private tab: Storage;
  private local: Storage;
  constructor(tab: Storage, local: Storage, factory = createConnection) {
    this.tab = tab;
    this.local = local;
    this.diagnostics = new AssistantDiagnostics(tab);
    this.ledger = new OperationLedger(tab);
    this.diagnostics.onStorageChange = (available) =>
      this.update({ diagnosticWarning: !available || !this.ledger.available });
    this.owner = new ConnectionOwner(
      () => {
        if (!this.device) throw new RecoveryFault('connect', 'canceled');
        return factory(this.device);
      },
      (driver, valid) => this.mountClient(driver, valid),
    );
    this.recovery = new RecoveryTask({
      run: (signal, reason, attempt) => this.recover(signal, reason, attempt),
      failed: (error, retryMs) => {
        const fault =
          error instanceof RecoveryFault
            ? error
            : new RecoveryFault(this.state.recoveryStage, 'unknown');
        this.update({
          connection: 'offline',
          loading: false,
          recoveryStage: fault.terminal ? 'blocked' : 'waiting',
          retryMs,
          error:
            fault.code === 'identity'
              ? 'identity'
              : fault.code === 'release'
                ? 'release'
                : fault.stage === 'history' || fault.stage === 'subscribe'
                  ? 'history'
                  : fault.stage === 'directory'
                    ? 'sync'
                    : 'connect',
        });
        this.diagnostics.record('recovery', {
          status: 'failed',
          stage: fault.stage,
          code: fault.code,
          recovery: this.recoveryId,
          ...(retryMs === null ? {} : { retryMs }),
        });
      },
    });
    const isConnected = () => this.driver?.status() === 'connected';
    this.activity = createClientActivityTracker({
      client: {
        get isConnected() {
          return isConnected();
        },
        sendHeartbeat: (payload) => {
          try {
            this.driver?.heartbeat(payload);
          } catch {
            /* Advisory activity must not stop recovery. */
          }
        },
      },
      deviceType: 'web',
      initialFocusedAgentId: null,
      initialFocusedTerminalId: null,
      initialAppVisible: true,
      now: Date.now,
      onAppResumed: (awayMs) => this.diagnostics.record('lifecycle', { status: 'visible', awayMs }),
    });
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
    const version = ++this.pairVersion;
    await this.disconnect();
    if (version !== this.pairVersion) return;
    this.ledger.clear();
    this.device = { offer, clientId: globalThis.crypto.randomUUID() };
    this.remember = remember;
    this.update({ ...initial(), device: true });
    const saved = this.persist();
    await this.connect();
    if (!saved && !this.state.error) this.report('storage');
  }
  private mountClient(driver: Connection, valid: () => boolean) {
    this.generation++;
    let previous = driver.status();
    const offEvent = driver.onEvent((event) => {
      if (valid() && this.verifiedGeneration === this.generation) this.event(event);
    });
    const offStatus = driver.onStatus((status) => {
      if (!valid()) return;
      this.diagnostics.record('transport', {
        status: status.status,
        generation: this.generation,
        ...('attempt' in status ? { attempt: status.attempt } : {}),
      });
      if (status.status === 'connected') void this.recovery.request('transport');
      else {
        if (previous === 'connected') {
          this.invalidateData();
          this.recovery.invalidate();
          void this.recovery.request('transport');
        }
        this.update({
          connection: status.status === 'connecting' ? 'connecting' : 'offline',
          loading: false,
        });
      }
      previous = status.status;
    });
    return () => {
      offEvent();
      offStatus();
    };
  }
  private invalidateData() {
    this.generation++;
    this.transport++;
    this.selection++;
    this.operation++;
    this.verifiedGeneration = -1;
    this.subscribed = false;
    this.buffered = [];
    this.update({ busy: false, loading: false, unknown: this.hasUnknown() });
  }
  private hasUnknown() {
    return (
      !!this.device && !!this.ledger.pending(this.device.offer.serverId, this.state.selectedId)
    );
  }
  async connect() {
    if (this.device) await this.recovery.start('connect');
  }
  async disconnect() {
    const settled = this.recovery.stop();
    this.invalidateData();
    this.update({ connection: 'offline', recoveryStage: 'idle', retryMs: null });
    try {
      await this.owner.release();
    } catch {
      this.update({ recoveryStage: 'blocked', error: 'release' });
    }
    await settled;
    this.diagnostics.record('recovery', {
      status: 'canceled',
      stage: 'idle',
      connections: 0,
      subscriptions: 0,
      ...this.recovery.resources,
    });
    this.diagnostics.flush();
  }
  async forget() {
    this.pairVersion++;
    this.device = null;
    await this.disconnect();
    this.ledger.clear();
    this.diagnostics.clear();
    try {
      forgetDevice(this.tab, this.local);
    } catch {
      this.update({ ...initial(), error: 'forgetStorage' });
      return;
    }
    this.update({
      ...initial(),
      ...(!this.ledger.available || !this.diagnostics.storageAvailable
        ? { error: 'forgetStorage' }
        : {}),
    });
  }
  resync = async () => {
    if (this.device) await this.recovery.start('manual');
  };
  visibility = (visible: boolean) => {
    const changed = this.activity.notifyAppVisibility(visible).changed;
    this.recovery.visibility(visible);
    if (!changed) return;
    this.activity.sendHeartbeat();
    if (!visible) {
      this.selection++;
      this.buffered = [];
      this.update({ connection: 'offline', loading: false });
      this.diagnostics.record('lifecycle', { status: 'hidden' });
      this.diagnostics.flush();
    } else void this.recovery.request('resume');
  };
  recoverFrom = (reason: 'pageshow' | 'network') => this.recovery.request(reason);
  recordActivity = () => {
    this.activity.recordUserActivity();
    this.activity.maybeSendImmediateHeartbeat();
  };
  exportDiagnostics = () => this.diagnostics.export();
  acknowledgeUnknown = () => {
    if (!this.device || this.state.connection !== 'ready') return;
    const entry = this.ledger.pending(this.device.offer.serverId, this.state.selectedId);
    if (entry) this.ledger.resolve(entry.id);
    this.update({ unknown: this.hasUnknown(), error: null });
  };
  private async stage<T>(
    stage: RecoveryStage,
    action: () => Promise<T>,
    signal: AbortSignal,
    ms = 10_000,
  ) {
    if (signal.aborted) throw new RecoveryFault(stage, 'canceled');
    this.update({ recoveryStage: stage });
    const start = performance.now();
    const recovery = this.recoveryId;
    this.diagnostics.record('stage', {
      stage,
      status: 'start',
      recovery,
      generation: this.generation,
    });
    try {
      const value = await bounded(Promise.resolve().then(action), ms, signal, stage);
      this.diagnostics.record('stage', {
        stage,
        status: 'success',
        recovery,
        elapsedMs: performance.now() - start,
      });
      return value;
    } catch (error) {
      const fault = error instanceof RecoveryFault ? error : new RecoveryFault(stage, 'unknown');
      this.diagnostics.record('stage', {
        stage,
        status: signal.aborted ? 'canceled' : 'failed',
        recovery,
        code: fault.code,
        elapsedMs: performance.now() - start,
      });
      throw fault;
    }
  }
  private async recover(signal: AbortSignal, reason: RecoveryReason, attempt: number) {
    if (!this.device) return;
    this.recoveryId++;
    const started = performance.now();
    this.diagnostics.record('recovery', {
      status: 'start',
      reason,
      attempt,
      recovery: this.recoveryId,
    });
    this.update({
      connection: 'syncing',
      loading: true,
      error: null,
      retryMs: null,
      unknown: this.hasUnknown(),
    });
    const driver = await this.owner.acquire(signal);
    try {
      const connected = driver.status() === 'connected';
      if (!connected) {
        this.update({ connection: 'connecting' });
        await this.stage('connect', () => driver.connect(), signal, 20_000);
      } else {
        const probe = await this.stage('probe', () => driver.probe(), signal, 5_000);
        this.diagnostics.record('stage', { stage: 'probe', status: 'success', rttMs: probe.rttMs });
      }
      await this.stage('identity', async () => driver.verify(), signal);
    } catch (error) {
      if (!signal.aborted) {
        this.invalidateData();
        await this.owner.release();
      }
      throw error;
    }
    if (signal.aborted) return;
    this.verifiedGeneration = this.generation;
    this.diagnostics.daemonVersion(driver.info()?.version);
    this.update({ connection: 'syncing', loading: true });
    const generation = this.generation;
    const [directory, providers] = await this.stage(
      'directory',
      () => Promise.all([driver.directory(), driver.providers()]),
      signal,
    );
    if (providers.error) throw new RecoveryFault('directory', 'unavailable');
    if (signal.aborted || generation !== this.generation) return;
    this.update({
      agents: directory.entries.map((entry) => entry.agent),
      providers: providers.providers.filter((p) => p.available).map((p) => p.provider),
    });
    const id = this.state.selectedId;
    if (id) await this.loadSelected(id, driver, signal);
    if (signal.aborted || generation !== this.generation) return;
    this.activity.setFocusedAgentId(this.state.selectedId || null);
    this.activity.sendHeartbeat();
    this.update({
      connection: 'ready',
      recoveryStage: 'ready',
      loading: false,
      retryMs: null,
      unknown: this.hasUnknown(),
      diagnosticWarning: !this.ledger.available || !this.diagnostics.storageAvailable,
    });
    this.diagnostics.record('recovery', {
      status: 'success',
      recovery: this.recoveryId,
      elapsedMs: performance.now() - started,
      connections: 1,
      subscriptions: this.subscribed ? 1 : 0,
      rows: this.state.rows.length,
      ...this.recovery.resources,
    });
  }
  select = async (id: string) => {
    const changed = id !== this.state.selectedId;
    this.recovery.invalidate();
    this.selection++;
    this.buffered = [];
    if (changed) {
      this.epoch = '';
      this.cursor = null;
    }
    this.update({
      selectedId: id,
      connection: 'syncing',
      loading: true,
      ...(changed ? { agent: null, rows: [], hasOlder: false, outcome: null } : {}),
      error: null,
    });
    if (this.device) {
      this.device = { ...this.device, selectedId: id };
      this.persist();
    }
    this.update({ unknown: this.hasUnknown() });
    this.activity.setFocusedAgentId(id || null);
    await this.recovery.request('manual');
  };
  private async loadSelected(id: string, driver: Connection, signal: AbortSignal) {
    const selection = ++this.selection;
    const valid = () => !signal.aborted && selection === this.selection;
    this.buffered = [];
    await this.stage('subscribe', () => driver.subscribe(id), signal);
    if (!valid()) return;
    this.subscribed = true;
    const page = await this.stage('history', () => driver.timeline(id), signal);
    if (!valid()) return;
    if (page.agentId !== id || (page.agent && page.agent.id !== id))
      throw new RecoveryFault('history', 'protocol', true);
    if (page.error || !page.agent || page.hasNewer)
      throw new RecoveryFault('history', 'unavailable');
    this.epoch = page.epoch;
    this.cursor = page.startCursor;
    this.update({ agent: page.agent, rows: page.entries, hasOlder: page.hasOlder, loading: false });
    if (this.device) {
      for (const operation of this.ledger.reconcile(this.device.offer.serverId, page))
        this.diagnostics.record('operation', {
          status: 'confirmed',
          operation: this.diagnostics.alias(operation),
        });
    }
    const buffered = this.buffered;
    this.buffered = [];
    for (const event of buffered) this.event(event);
  }
  older = async () => {
    const driver = this.driver,
      id = this.state.selectedId,
      generation = this.generation,
      selection = this.selection;
    if (
      !driver ||
      this.state.connection !== 'ready' ||
      !this.cursor ||
      this.state.loading ||
      !this.state.hasOlder
    )
      return;
    if (this.state.rows.length >= maximumRows) {
      this.report('historyLimit');
      return;
    }
    this.update({ loading: true });
    try {
      const page = await bounded(
        driver.timeline(id, 'before', this.cursor),
        10_000,
        new AbortController().signal,
        'history',
      );
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
      if (value.type === 'timeline' && value.item.type === 'tool_call') {
        this.diagnostics.record('tool', {
          kind: ['read', 'write', 'browser', 'command'].includes(value.item.detail.type)
            ? value.item.detail.type
            : 'other',
          status:
            value.item.status === 'running'
              ? 'submitted'
              : value.item.status === 'completed'
                ? 'success'
                : value.item.status === 'failed'
                  ? 'failed'
                  : 'canceled',
          session: this.diagnostics.alias(event.agentId),
        });
      }
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
      const result = await bounded(
        driver.refresh(id),
        10_000,
        new AbortController().signal,
        'history',
      );
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
        void this.recovery.request('gap');
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
    const generation = this.generation;
    const agent = await this.operate('create', (driver) => driver.create(provider, cwd.trim()));
    if (agent && generation === this.generation) await this.select(agent.id);
  };
  private async operate<T>(
    kind: OperationKind,
    action: (driver: Connection, operationId: string) => Promise<T>,
    requestId?: string,
  ): Promise<T | undefined> {
    const driver = this.driver,
      device = this.device,
      generation = this.generation,
      selection = this.selection;
    if (
      !driver ||
      !device ||
      this.state.connection !== 'ready' ||
      this.state.loading ||
      this.state.busy ||
      this.hasUnknown()
    )
      return;
    const operation = ++this.operation;
    const id = crypto.randomUUID();
    if (
      !this.ledger.begin({
        id,
        serverId: device.offer.serverId,
        sessionId: this.state.selectedId,
        kind,
        ...(requestId ? { requestId } : {}),
      })
    ) {
      this.report('operationLimit');
      return;
    }
    this.update({ busy: true, error: null, diagnosticWarning: !this.ledger.available });
    const started = performance.now();
    this.diagnostics.record('operation', {
      kind,
      status: 'submitted',
      operation: this.diagnostics.alias(id),
      session: this.diagnostics.alias(this.state.selectedId),
    });
    try {
      const result = await bounded(
        Promise.resolve().then(() => action(driver, id)),
        20_000,
        new AbortController().signal,
        'ready',
      );
      this.ledger.resolve(id);
      this.diagnostics.record('operation', {
        kind,
        status: 'confirmed',
        operation: this.diagnostics.alias(id),
        elapsedMs: performance.now() - started,
      });
      return result;
    } catch {
      this.diagnostics.record('operation', {
        kind,
        status: 'unknown',
        operation: this.diagnostics.alias(id),
        elapsedMs: performance.now() - started,
      });
      if (
        generation === this.generation &&
        selection === this.selection &&
        operation === this.operation
      )
        this.report(`${kind}Unknown`);
      return undefined;
    } finally {
      if (generation === this.generation && operation === this.operation)
        this.update({
          busy: false,
          unknown: this.hasUnknown(),
          diagnosticWarning: !this.ledger.available,
        });
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
    const sent = await this.operate('send', async (driver, messageId) => {
      await driver.send(id, text, messageId);
      return true;
    });
    if (
      sent &&
      generation === this.generation &&
      selection === this.selection &&
      this.state.selectedId === id
    )
      await this.select(id);
  };
  cancel = async () => {
    const id = this.state.selectedId,
      generation = this.generation;
    const confirmed = await this.operate('cancel', async (driver) => {
      await driver.cancel(id);
      return true;
    });
    if (confirmed && generation === this.generation) await this.refreshAgent(id);
  };
  permission = async (id: string, requestId: string, response: AgentPermissionResponse) => {
    const generation = this.generation;
    if (
      this.state.agent?.id !== id ||
      !this.state.agent.pendingPermissions.some((p) => p.id === requestId)
    ) {
      this.report('permissionExpired');
      return;
    }
    const confirmed = await this.operate(
      'permission',
      async (driver) => {
        await driver.permission(id, requestId, response);
        return true;
      },
      requestId,
    );
    if (confirmed && generation === this.generation) await this.refreshAgent(id);
  };
}
