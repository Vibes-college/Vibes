import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RecoveryFault } from '../../src/lib/assistant/recovery.ts';
import type { PaseoAgent } from '@getpaseo/client';
import { AssistantStore } from '../../src/lib/assistant/store.ts';
import { respondToApproval } from '../../src/lib/assistant/approvals.ts';
import type { Connection, DaemonEvent } from '../../src/lib/assistant/paseo-client.ts';
import type { TimelinePage } from '../../src/lib/assistant/timeline.ts';
const memory = (): Storage => {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    clear: () => map.clear(),
  };
};
const offer = JSON.stringify({
  v: 2,
  serverId: 'test',
  daemonPublicKeyB64: Buffer.alloc(32, 1).toString('base64'),
  relay: { endpoint: 'relay.paseo.sh:443' },
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
const agent = (id = 'a'): PaseoAgent =>
  ({
    id,
    provider: 'codex',
    cwd: '/tmp/vibes',
    model: null,
    createdAt: '2026-09-07T00:00:00Z',
    updatedAt: '2026-09-07T00:00:00Z',
    lastUserMessageAt: null,
    status: 'idle',
    capabilities: {},
    currentModeId: null,
    availableModes: [],
    pendingPermissions: [],
    persistence: null,
    title: id,
    labels: {},
  }) as unknown as PaseoAgent;
const page = (id = 'a'): TimelinePage => ({
  requestId: 'r',
  agentId: id,
  agent: agent(id),
  direction: 'tail',
  projection: 'canonical',
  epoch: 'e1',
  reset: false,
  staleCursor: false,
  gap: false,
  window: { minSeq: 0, maxSeq: 0, nextSeq: 0 },
  startCursor: null,
  endCursor: null,
  hasOlder: false,
  hasNewer: false,
  entries: [],
  error: null,
});
function fixture() {
  let eventListener: ((event: DaemonEvent) => void) | undefined;
  let statusListener: Parameters<Connection['onStatus']>[0] | undefined;
  let status = 'idle';
  let current = agent();
  let sends = 0,
    cancels = 0,
    permissions = 0,
    subscriptions = 0;
  const driver: Connection = {
    connect: async () => {
      status = 'connected';
      statusListener?.({ status: 'connected' });
    },
    close: async () => {
      status = 'disposed';
    },
    verify: () => {},
    probe: async () => ({
      requestId: 'probe',
      clientSentAt: 0,
      serverReceivedAt: 0,
      serverSentAt: 0,
      rttMs: 1,
    }),
    info: () => null,
    heartbeat: () => {},
    status: () => status as ReturnType<Connection['status']>,
    onEvent: (callback) => {
      eventListener = callback;
      return () => {};
    },
    onStatus: (callback) => {
      statusListener = callback;
      return () => {};
    },
    directory: async () =>
      ({
        requestId: 'r',
        entries: [{ agent: current, project: null }],
        pageInfo: { hasMore: false },
      }) as unknown as Awaited<ReturnType<Connection['directory']>>,
    providers: async () => ({
      requestId: 'r',
      fetchedAt: 'now',
      providers: [{ provider: 'codex', available: true }],
    }),
    models: async () => ({ requestId: 'r', fetchedAt: 'now', provider: 'codex', models: [] }),
    subscribe: async () => {
      subscriptions++;
    },
    timeline: async (id) => ({ ...page(id), agent: { ...current, id } }),
    refresh: async (id) => ({ agent: { ...current, id }, project: null }),
    create: async () => ({ id: 'new' }) as Awaited<ReturnType<Connection['create']>>,
    send: async () => {
      sends++;
    },
    cancel: async () => {
      cancels++;
    },
    permission: async () => {
      permissions++;
    },
  };
  const store = new AssistantStore(memory(), memory(), () => driver);
  return {
    store,
    driver,
    emit: (event: DaemonEvent) => eventListener?.(event),
    status: (value: 'connected' | 'disconnected') => {
      status = value;
      statusListener?.({ status: value });
    },
    current: (value: PaseoAgent) => {
      current = value;
    },
    counts: () => ({ sends, cancels, permissions, subscriptions }),
  };
}
test('a stop with unknown outcome cannot falsely confirm a subsequent approval', async () => {
  const f = fixture();
  f.current({
    ...agent(),
    status: 'running',
    pendingPermissions: [{ id: 'p', provider: 'codex', kind: 'tool', name: 'Write' }],
  });
  await f.store.pair(offer, false);
  await f.store.select('a');
  f.driver.cancel = async () => {
    throw new Error('timeout');
  };
  await f.store.cancel();
  assert.equal(f.store.getSnapshot().error, 'cancelUnknown');
  await assert.rejects(
    respondToApproval(f.store, {
      approvalId: 'p',
      approved: true,
      optionId: 'allow',
    }),
    /Approval unavailable/,
  );
  assert.equal(f.counts().permissions, 0);
  assert.equal(f.store.getSnapshot().agent?.pendingPermissions.length, 1);
  await f.store.resync();
  assert.equal(f.store.getSnapshot().unknown, true);
  f.store.acknowledgeUnknown();
  await respondToApproval(f.store, { approvalId: 'p', approved: true, optionId: 'allow' });
  assert.equal(f.counts().permissions, 1);
});
test('running or pending approval cannot send; unknown outcome requires authoritative refresh', async () => {
  const f = fixture();
  await f.store.pair(offer, false);
  await f.store.select('a');
  f.current({ ...agent(), status: 'running' });
  await f.store.select('a');
  await f.store.send('interrupt');
  assert.equal(f.counts().sends, 0);
  f.current({
    ...agent(),
    pendingPermissions: [{ id: 'p', provider: 'codex', kind: 'tool', name: 'Read' }],
  });
  await f.store.select('a');
  await f.store.send('interrupt');
  assert.equal(f.counts().sends, 0);
  f.current(agent());
  await f.store.select('a');
  f.driver.send = async () => {
    throw new Error('timeout');
  };
  await f.store.send('once');
  assert.equal(f.store.getSnapshot().error, 'sendUnknown');
  let retried = false;
  f.driver.send = async () => {
    retried = true;
  };
  await f.store.send('twice');
  assert.equal(retried, false);
  await f.store.select('a');
  assert.equal(f.store.getSnapshot().unknown, true);
  f.store.acknowledgeUnknown();
  await f.store.send('after refresh');
  assert.equal(retried, true);
});
test('a late history response cannot overwrite another session or a forgotten device', async () => {
  const f = fixture();
  await f.store.pair(offer, false);
  const pending = deferred<TimelinePage>();
  f.driver.timeline = async (id) => (id === 'a' ? pending.promise : page(id));
  const first = f.store.select('a');
  await f.store.select('b');
  pending.resolve(page('a'));
  await first;
  assert.equal(f.store.getSnapshot().selectedId, 'b');
  assert.equal(f.store.getSnapshot().agent?.id, 'b');
  await f.store.forget();
  f.emit({ type: 'agent_update', agentId: 'a', payload: { kind: 'upsert', agent: agent() } });
  assert.equal(f.store.getSnapshot().agent, null);
  assert.equal(f.store.getSnapshot().device, false);
});
test('stop and permission remain pending until the daemon confirms; duplicate operations are blocked', async () => {
  const f = fixture();
  await f.store.pair(offer, false);
  f.current({
    ...agent(),
    status: 'running',
    pendingPermissions: [{ id: 'p', provider: 'codex', kind: 'tool', name: 'Read' }],
  });
  await f.store.select('a');
  const pending = deferred<void>();
  let calls = 0;
  f.driver.permission = async () => {
    calls++;
    await pending.promise;
  };
  const first = f.store.permission('a', 'p', { behavior: 'allow' });
  await f.store.permission('a', 'p', { behavior: 'allow' });
  assert.equal(calls, 1);
  assert.equal(f.store.getSnapshot().agent?.pendingPermissions.length, 1);
  f.current({ ...agent(), status: 'running' });
  pending.resolve();
  await first;
  assert.equal(f.store.getSnapshot().agent?.pendingPermissions.length, 0);
  const stop = deferred<void>();
  f.driver.cancel = async () => stop.promise;
  const stopping = f.store.cancel();
  assert.equal(f.store.getSnapshot().agent?.status, 'running');
  f.current(agent());
  stop.resolve();
  await stopping;
  assert.equal(f.store.getSnapshot().agent?.status, 'idle');
  await f.store.permission('a', 'p', { behavior: 'allow' });
  assert.equal(f.store.getSnapshot().error, 'permissionExpired');
});
test('every reconnect resubscribes and reloads before enabling operations', async () => {
  const f = fixture();
  await f.store.pair(offer, false);
  await f.store.select('a');
  const count = f.counts().subscriptions;
  f.status('disconnected');
  await f.store.send('offline');
  assert.equal(f.counts().sends, 0);
  f.status('connected');
  await f.store.resync();
  assert.ok(f.counts().subscriptions > count);
  assert.equal(f.store.getSnapshot().connection, 'ready');
});

test('covered stream sequences are ignored, gaps refetch, and a changed epoch replaces the snapshot', async () => {
  const f = fixture();
  await f.store.pair(offer, false);
  const row = {
    provider: 'codex' as const,
    timestamp: '2026-09-07T00:00:00Z',
    turnId: 't',
    seqStart: 1,
    seqEnd: 3,
    sourceSeqRanges: [{ startSeq: 1, endSeq: 3 }],
    collapsed: [],
    item: { type: 'assistant_message' as const, text: 'canonical' },
  };
  let snapshots = 0;
  f.driver.timeline = async () => {
    snapshots++;
    return { ...page(), epoch: snapshots >= 3 ? 'e2' : 'e1', entries: [row] };
  };
  await f.store.select('a');
  const emit = (seq: number, epoch = 'e1') =>
    f.emit({
      type: 'agent_stream',
      agentId: 'a',
      timestamp: row.timestamp,
      seq,
      epoch,
      event: {
        type: 'timeline',
        provider: 'codex',
        turnId: 't',
        item: { type: 'assistant_message', text: 'delta' },
      },
    });
  emit(2);
  assert.equal(f.store.getSnapshot().rows.length, 1);
  emit(5);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(snapshots, 2);
  emit(4, 'e2');
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(snapshots, 3);
  assert.deepEqual(f.store.getSnapshot().rows, [row]);
});
test('an old operation cannot clear a new busy state after reconnect', async () => {
  const f = fixture();
  await f.store.pair(offer, false);
  await f.store.select('a');
  const old = deferred<void>(),
    fresh = deferred<void>();
  let calls = 0;
  f.driver.send = async () => (++calls === 1 ? old.promise : fresh.promise);
  const first = f.store.send('old');
  f.status('disconnected');
  f.status('connected');
  await f.store.resync();
  assert.equal(f.store.getSnapshot().unknown, true);
  f.store.acknowledgeUnknown();
  const second = f.store.send('new');
  assert.equal(f.store.getSnapshot().busy, true);
  old.reject(new Error('late error'));
  await first;
  assert.equal(f.store.getSnapshot().busy, true);
  assert.equal(f.store.getSnapshot().error, null);
  fresh.resolve();
  await second;
  assert.equal(f.store.getSnapshot().busy, false);
});
test('a newer agent update wins over a refresh response already in flight', async () => {
  const f = fixture();
  await f.store.pair(offer, false);
  await f.store.select('a');
  const pending = deferred<Awaited<ReturnType<Connection['refresh']>>>();
  f.driver.refresh = () => pending.promise;
  f.emit({
    type: 'agent_stream',
    agentId: 'a',
    timestamp: '2026-09-07T00:00:00Z',
    event: { type: 'turn_completed', provider: 'codex' },
  });
  f.emit({
    type: 'agent_update',
    agentId: 'a',
    payload: { kind: 'upsert', agent: { ...agent(), status: 'running' } },
  });
  pending.resolve({ agent: agent(), project: null });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(f.store.getSnapshot().agent?.status, 'running');
});

test('temporary history failures retain the same-session snapshot and heal without a new connection', async () => {
  const f = fixture();
  await f.store.pair(offer, false);
  await f.store.select('a');
  const old = page();
  old.entries = [
    {
      provider: 'codex',
      item: { type: 'assistant_message', text: 'previous', messageId: 'old' },
      timestamp: '2026-09-07T00:00:00Z',
      seqStart: 0,
      seqEnd: 0,
      sourceSeqRanges: [],
      collapsed: [],
    },
  ];
  f.driver.timeline = async () => old;
  await f.store.select('a');
  let reads = 0;
  f.driver.timeline = async () => {
    if (++reads === 1) throw new Error('transient');
    return old;
  };
  await f.store.resync();
  assert.equal(f.store.getSnapshot().connection, 'offline');
  assert.deepEqual(f.store.getSnapshot().rows, old.entries);
  await f.store.send('blocked while stale');
  assert.equal(f.counts().sends, 0);
  await new Promise((resolve) => setTimeout(resolve, 1100));
  assert.equal(f.store.getSnapshot().connection, 'ready');
  assert.equal(reads, 2);
  await f.store.disconnect();
});

test('a probe failure invalidates the client and identity faults never retry automatically', async () => {
  const f = fixture();
  await f.store.pair(offer, false);
  await f.store.select('a');
  f.driver.probe = async () => {
    throw new Error('timeout');
  };
  await f.store.resync();
  assert.equal(f.driver.status(), 'disposed');
  await f.store.disconnect();
  const other = fixture();
  other.driver.verify = () => {
    throw new RecoveryFault('identity', 'identity', true);
  };
  await other.store.pair(offer, false);
  assert.equal(other.store.getSnapshot().recoveryStage, 'blocked');
  await other.store.recoverFrom('network');
  assert.equal(other.store.getSnapshot().error, 'identity');
  assert.equal(other.store.getSnapshot().retryMs, null);
  await other.store.forget();
  assert.equal(JSON.parse(other.store.exportDiagnostics()).events.length, 0);
});

test('review: buffered pre-snapshot status must not overwrite newer snapshot', async () => {
  const f = fixture();
  await f.store.pair(offer, false);
  await f.store.select('a');
  const pending = deferred<TimelinePage>();
  f.driver.timeline = async () => pending.promise;
  const sync = f.store.resync();
  await new Promise((r) => setImmediate(r));
  f.emit({
    type: 'agent_update',
    agentId: 'a',
    payload: {
      kind: 'upsert',
      agent: { ...agent(), status: 'running', updatedAt: '2026-09-07T00:00:01Z' },
    },
  });
  pending.resolve({
    ...page(),
    agent: { ...agent(), status: 'idle', updatedAt: '2026-09-07T00:00:02Z' },
  });
  await sync;
  assert.equal(f.store.getSnapshot().agent?.status, 'idle');
  await f.store.disconnect();
});
test('review: older request failure must not discard buffered live status', async () => {
  const f = fixture();
  await f.store.pair(offer, false);
  f.driver.timeline = async () => ({
    ...page(),
    startCursor: { epoch: 'e1', seq: 4 },
    hasOlder: true,
  });
  await f.store.select('a');
  const pending = deferred<TimelinePage>();
  f.driver.timeline = async () => pending.promise;
  const older = f.store.older();
  f.emit({
    type: 'agent_update',
    agentId: 'a',
    payload: { kind: 'upsert', agent: { ...agent(), status: 'running' } },
  });
  pending.reject(new Error('transient'));
  await older;
  assert.equal(f.store.getSnapshot().agent?.status, 'running');
  await f.store.disconnect();
});

test('review: failed older load must keep resolved approval disabled during authoritative refresh', async () => {
  const f = fixture();
  f.current({
    ...agent(),
    pendingPermissions: [{ id: 'p', provider: 'codex', kind: 'tool', name: 'Write' }],
  });
  await f.store.pair(offer, false);
  f.driver.timeline = async () => ({
    ...page(),
    agent: {
      ...agent(),
      pendingPermissions: [{ id: 'p', provider: 'codex', kind: 'tool', name: 'Write' }],
    },
    startCursor: { epoch: 'e1', seq: 4 },
    hasOlder: true,
  });
  await f.store.select('a');
  const pending = deferred<TimelinePage>();
  f.driver.timeline = async () => pending.promise;
  const fresh = deferred<Awaited<ReturnType<Connection['refresh']>>>();
  f.driver.refresh = () => fresh.promise;
  const older = f.store.older();
  f.emit({
    type: 'agent_permission_resolved',
    agentId: 'a',
    requestId: 'p',
    resolution: { behavior: 'deny' },
  } as unknown as DaemonEvent);
  pending.reject(new Error('transient'));
  await older;
  const approving = f.store.permission('a', 'p', { behavior: 'allow' });
  await new Promise((r) => setImmediate(r));
  fresh.resolve({ agent: agent(), project: null });
  await approving;
  const calls = f.counts().permissions;
  await f.store.disconnect();
  assert.equal(calls, 0);
});
