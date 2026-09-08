import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConnectionOwner } from '../../src/lib/assistant/connection-owner.ts';
import {
  RecoveryTask,
  RecoveryFault,
  bounded,
  nextRetryDelay,
} from '../../src/lib/assistant/recovery.ts';
import { createClientActivityTracker } from '../../src/lib/assistant/activity.ts';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('ownership reuses one client, rejects old callbacks and waits for disposal before replacement', async () => {
  let created = 0;
  const closing = deferred<void>();
  const guards: (() => boolean)[] = [];
  const owner = new ConnectionOwner(
    () => ({ number: ++created, close: () => closing.promise }),
    (_, valid) => {
      guards.push(valid);
      return () => {};
    },
  );
  const signal = new AbortController().signal;
  const [a, b] = await Promise.all([owner.acquire(signal), owner.acquire(signal)]);
  assert.equal(a, b);
  assert.equal(created, 1);
  const released = owner.release();
  assert.equal(guards[0](), false);
  const next = owner.acquire(signal);
  await Promise.resolve();
  assert.equal(created, 1);
  closing.resolve();
  await released;
  assert.equal((await next).number, 2);
  await owner.release();
});

test('failed disposal blocks replacements and a forgotten generation cannot create a late client', async () => {
  let created = 0;
  const owner = new ConnectionOwner(
    () => ({
      close: async () => {
        throw new Error('secret');
      },
      number: ++created,
    }),
    () => () => {},
  );
  await owner.acquire(new AbortController().signal);
  await assert.rejects(
    owner.release(),
    (e: unknown) => e instanceof RecoveryFault && e.code === 'release',
  );
  await assert.rejects(owner.acquire(new AbortController().signal), /release/);
  assert.equal(created, 1);
  const clean = new ConnectionOwner(
    () => ({ close: async () => {}, number: ++created }),
    () => () => {},
  );
  const pending = clean.acquire(new AbortController().signal);
  await clean.release();
  await assert.rejects(pending, /canceled/);
  assert.equal(created, 1);
});

test('rebuilds have a rolling budget independent of manual retries', async () => {
  let now = 0,
    created = 0;
  const owner = new ConnectionOwner(
    () => ({ close: async () => {}, number: ++created }),
    () => () => {},
    () => now,
  );
  for (let i = 0; i < 3; i++) {
    await owner.acquire(new AbortController().signal);
    await owner.release();
  }
  await assert.rejects(owner.acquire(new AbortController().signal), /cooldown/);
  now = 60_001;
  await owner.acquire(new AbortController().signal);
  assert.equal(created, 4);
  await owner.release();
});

test('timeline retry port backs off, coalesces concurrent requests and ignores canceled work', async () => {
  let reads = 0;
  const scheduled: { fn: () => void; ms: number; canceled: boolean }[] = [];
  const task = new RecoveryTask({
    run: async () => {
      if (++reads < 3) throw new Error('history');
    },
    failed: () => {},
    random: () => 1,
    schedule: (fn, ms) => {
      const entry = { fn, ms, canceled: false };
      scheduled.push(entry);
      return () => {
        entry.canceled = true;
      };
    },
  });
  await Promise.all([task.start(), task.request('resume'), task.request('network')]);
  assert.equal(reads, 1);
  assert.equal(scheduled[0].ms, 1_000);
  await task.request('retry');
  assert.equal(scheduled[1].ms, 2_000);
  await task.request('retry');
  assert.equal(reads, 3);
  assert.equal(task.resources.retryTimers, 0);
  assert.equal(nextRetryDelay(30_000), 30_000);
  task.stop();
  await task.request('resume');
  assert.equal(reads, 3);
});

test('background cancellation and a bounded SDK timeout cannot strand the recovery queue', async () => {
  let calls = 0,
    failures = 0;
  const pending = deferred<void>();
  const task = new RecoveryTask({
    run: async (signal) => {
      if (++calls === 1) await bounded(pending.promise, 20_000, signal, 'history');
    },
    failed: () => {
      failures++;
    },
  });
  const old = task.start();
  await Promise.resolve();
  task.visibility(false);
  await old;
  assert.equal(failures, 0);
  task.visibility(true);
  await task.request('resume');
  assert.equal(calls, 2);
  pending.resolve();
  assert.equal(task.resources.inFlight, 0);
  task.stop();
  await assert.rejects(
    bounded(new Promise(() => {}), 5, new AbortController().signal, 'probe'),
    /timeout/,
  );
});

// Adapted from the upstream activity tests, using node:test rather than adding Vitest.
test('activity preserves away time and throttles genuine activity without advancing it on idle heartbeat', () => {
  let now = 1_700_000_000_000,
    resumed = -1,
    connected = true;
  const payloads: { lastActivityAt: string; appVisible: boolean }[] = [];
  const tracker = createClientActivityTracker({
    client: {
      get isConnected() {
        return connected;
      },
      sendHeartbeat: (p) => payloads.push(p),
    },
    deviceType: 'web',
    initialFocusedAgentId: 'a',
    initialFocusedTerminalId: null,
    initialAppVisible: true,
    now: () => now,
    onAppResumed: (ms) => {
      resumed = ms;
    },
  });
  tracker.maybeSendImmediateHeartbeat();
  now += 4999;
  tracker.maybeSendImmediateHeartbeat();
  assert.equal(payloads.length, 1);
  const lastActivity = payloads[0].lastActivityAt;
  now += 1;
  tracker.sendHeartbeat();
  assert.equal(payloads[1].lastActivityAt, lastActivity);
  tracker.notifyAppVisibility(false);
  now += 300_000;
  tracker.notifyAppVisibility(true);
  assert.equal(resumed, 300_000);
  tracker.sendHeartbeat();
  assert.equal(payloads.at(-1)?.appVisible, true);
  connected = false;
  const count = payloads.length;
  tracker.setFocusedAgentId('b');
  tracker.sendHeartbeat();
  assert.equal(payloads.length, count);
});
