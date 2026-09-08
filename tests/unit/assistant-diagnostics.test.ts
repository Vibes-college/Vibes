import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AssistantDiagnostics,
  diagnosticKey,
  type DiagnosticFields,
} from '../../src/lib/assistant/diagnostics.ts';
import { OperationLedger, operationKey } from '../../src/lib/assistant/operation-ledger.ts';
import type { TimelinePage } from '../../src/lib/assistant/timeline.ts';

function memory(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    key: (i) => [...values.keys()][i] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    clear: () => values.clear(),
  };
}

test('diagnostics whitelist fields before persistence/export, including untrusted stored entries', () => {
  const storage = memory();
  let now = 10_000;
  storage.setItem(
    diagnosticKey,
    JSON.stringify([
      {
        event: 'stage',
        boot: crypto.randomUUID(),
        at: now,
        stage: 'history',
        status: 'failed',
        code: 'secret-pairing-key',
        error: 'private output',
        url: 'wss://secret',
      },
    ]),
  );
  const diagnostic = new AssistantDiagnostics(storage, () => now);
  diagnostic.record('stage', {
    stage: 'history',
    status: 'failed',
    code: 'unknown',
    ...{ error: 'private output', url: 'secret-pairing-key', cwd: '/private/path' },
  } as DiagnosticFields);
  diagnostic.record('operation', {
    operation: diagnostic.alias('private-session-id'),
    session: diagnostic.alias('private-cwd'),
    status: 'unknown',
  });
  diagnostic.daemonVersion('secret-key-in-version');
  const output = diagnostic.export();
  for (const secret of [
    'private output',
    'secret',
    '/private/path',
    'private-session-id',
    'private-cwd',
  ])
    assert.equal(output.includes(secret), false);
  assert.equal(JSON.parse(output).events.length, 3);
  assert.equal(JSON.parse(output).events[0].code, undefined);
  now += 24 * 60 * 60 * 1000;
  assert.equal(JSON.parse(diagnostic.export()).events.length, 0);
  diagnostic.clear();
  assert.equal(storage.getItem(diagnosticKey), null);
});

test('diagnostic ring is bounded and failed storage does not break recording or export', () => {
  const storage = memory();
  const diagnostic = new AssistantDiagnostics(storage);
  for (let i = 0; i < 1200; i++)
    diagnostic.record('stage', { stage: 'history', status: 'success', rows: i });
  diagnostic.flush();
  assert.equal(JSON.parse(diagnostic.export()).events.length, 500);
  assert.ok(new TextEncoder().encode(storage.getItem(diagnosticKey)!).length <= 256 * 1024);
  storage.setItem = () => {
    throw new Error('quota secret');
  };
  assert.doesNotThrow(() => diagnostic.record('stage', { status: 'failed' }));
  assert.equal(JSON.parse(diagnostic.export()).storageAvailable, false);
  diagnostic.clear();
});

test('pending operations survive refresh without payloads and reconcile only with matching authoritative evidence', () => {
  const storage = memory();
  const ledger = new OperationLedger(storage);
  ledger.begin({ id: 'send-1', serverId: 'computer-1', sessionId: 'session-1', kind: 'send' });
  ledger.begin({
    id: 'approve-1',
    serverId: 'computer-1',
    sessionId: 'session-1',
    kind: 'permission',
    requestId: 'p1',
  });
  const restored = new OperationLedger(storage);
  assert.equal(restored.pending('computer-1', 'session-1')?.id, 'send-1');
  const page = {
    agentId: 'session-1',
    agent: { status: 'idle', pendingPermissions: [{ id: 'p1' }] },
    error: null,
    entries: [{ item: { type: 'user_message', text: 'private text', clientMessageId: 'send-1' } }],
  } as TimelinePage;
  assert.deepEqual(restored.reconcile('other-computer', page), []);
  assert.deepEqual(restored.reconcile('computer-1', { ...page, entries: [] }), []);
  assert.deepEqual(restored.reconcile('computer-1', page), ['send-1']);
  assert.equal(restored.pending('computer-1', 'session-1')?.kind, 'permission');
  assert.deepEqual(
    restored.reconcile('computer-1', {
      ...page,
      agent: { ...page.agent!, pendingPermissions: [] },
    }),
    ['approve-1'],
  );
  assert.equal(restored.pending('computer-1', 'session-1'), undefined);
  assert.equal(storage.getItem(operationKey)?.includes('private text'), false);
  restored.clear();
  assert.equal(storage.getItem(operationKey), null);
});
