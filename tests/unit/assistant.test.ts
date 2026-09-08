import { contextMessage, splitContext } from '../../src/lib/assistant/labels.ts';
import { questions } from '../../src/lib/assistant/questions.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  parsePairing,
  saveDevice,
  readDevice,
  forgetDevice,
} from '../../src/lib/assistant/pairing.ts';
import { mergeRows, toMessages, type TimelineRow } from '../../src/lib/assistant/timeline.ts';

const offer = {
  v: 2,
  serverId: 'test-device',
  daemonPublicKeyB64: Buffer.alloc(32, 7).toString('base64'),
  relay: { endpoint: 'relay.paseo.sh:443', useTls: true },
};
function storage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    key: (i) => [...values.keys()][i] ?? null,
    clear: () => values.clear(),
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => {
      values.set(k, v);
    },
    removeItem: (k) => {
      values.delete(k);
    },
  };
}
test('pairing accepts only a bounded official encrypted offer with a valid public key', () => {
  assert.deepEqual(parsePairing(JSON.stringify(offer)), offer);
  assert.deepEqual(
    parsePairing(
      'https://paseo.sh/connect#offer=' + Buffer.from(JSON.stringify(offer)).toString('base64url'),
    ),
    offer,
  );
  for (const change of [
    { v: 1 },
    { relay: { endpoint: 'evil.test:443' } },
    { relay: { endpoint: 'relay.paseo.sh:443', useTls: false } },
    { daemonPublicKeyB64: 'bad' },
    { serverId: 'x'.repeat(513) },
  ]) {
    assert.throws(() => parsePairing(JSON.stringify({ ...offer, ...change })));
  }
  assert.throws(() => parsePairing('x'.repeat(10001)));
});
test('storage defaults to one tab, explicit remember and forget remove stale copies', () => {
  const tab = storage(),
    local = storage();
  const device = {
    offer: parsePairing(JSON.stringify(offer)),
    clientId: 'client',
    selectedId: 'agent',
  };
  saveDevice(device, false, tab, local);
  assert.equal(local.length, 0);
  assert.equal(readDevice(tab, local)?.selectedId, 'agent');
  saveDevice(device, true, tab, local);
  assert.equal(tab.length, 0);
  assert.equal(local.length, 1);
  forgetDevice(tab, local);
  assert.equal(readDevice(tab, local), null);
});
const row = (seq: number, item: TimelineRow['item'], turnId = 't1'): TimelineRow => ({
  seqStart: seq,
  seqEnd: seq,
  item,
  turnId,
  provider: 'codex',
  timestamp: '2026-09-07T00:00:00Z',
  sourceSeqRanges: [{ startSeq: seq, endSeq: seq }],
  collapsed: [],
});
test('canonical rows deduplicate sequence without losing same-message text fragments', () => {
  const a = row(1, { type: 'assistant_message', text: 'hello ', messageId: 'm' });
  const b = row(2, { type: 'assistant_message', text: 'world', messageId: 'm' });
  const rows = mergeRows([a], [b, a]);
  assert.equal(rows.length, 2);
  const messages = toMessages(rows, false);
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0].content, [{ type: 'text', text: 'hello world' }]);
  assert.equal(
    toMessages([...rows, row(3, { type: 'assistant_message', text: 'next' }, 't2')], false).length,
    2,
  );
});
test('tool lifecycle updates one card and errors remain visible', () => {
  const running = row(1, {
    type: 'tool_call',
    callId: 'c',
    name: 'Read',
    status: 'running',
    detail: { type: 'read', filePath: 'README.md' },
    error: null,
  });
  const done = row(2, {
    ...running.item,
    type: 'tool_call',
    callId: 'c',
    name: 'Read',
    status: 'completed',
    detail: { type: 'read', filePath: 'README.md', content: 'ok' },
    error: null,
  });
  const messages = toMessages([running, done, row(3, { type: 'error', message: 'failed' })], false);
  assert.equal(messages.length, 2);
  const part = messages[0].content[0];
  assert.ok(typeof part !== 'string' && part.type === 'tool-call');
  assert.ok(JSON.stringify(messages[0]).includes('ok'));
  assert.ok(JSON.stringify(messages[1]).includes('failed'));
});

test('public work context is displayed as a source without losing the wire text, and malformed suffixes stay literal', () => {
  const work = {
    title: 'Title',
    url: 'https://vibes.college/zh/works/example/',
    source: 'https://example.com/work',
    summary: 'Public summary',
  };
  const wire = contextMessage('Explain it', work);
  assert.deepEqual(splitContext(wire), { text: 'Explain it', work });
  const message = toMessages([row(1, { type: 'user_message', text: wire })], false)[0];
  assert.deepEqual(message.content, [{ type: 'text', text: 'Explain it' }]);
  assert.deepEqual(message.metadata?.custom?.work, work);
  const unsafe = contextMessage('Keep this text', { ...work, url: 'javascript:alert(1)' });
  assert.deepEqual(splitContext(unsafe), { text: unsafe });
  assert.deepEqual(splitContext(wire.slice(0, -4)), { text: wire.slice(0, -4) });
  assert.deepEqual(
    toMessages([row(2, { type: 'reasoning', text: 'Visible provider reasoning' })], false)[0]
      .content,
    [{ type: 'reasoning', text: 'Visible provider reasoning' }],
  );
});
test('forget attempts both storage copies even when one storage is blocked', () => {
  const tab = storage(),
    local = storage();
  local.setItem('vibes.local-assistant.v1', 'saved');
  tab.removeItem = () => {
    throw new Error('denied');
  };
  assert.throws(() => forgetDevice(tab, local));
  assert.equal(local.length, 0);
});
test('question parsing rejects ambiguous headers and unsupported option structures', () => {
  const request = {
    id: 'q',
    provider: 'codex' as const,
    kind: 'question' as const,
    name: 'AskUserQuestion',
    input: {
      questions: [
        {
          header: 'Scope',
          question: 'Choose scope',
          multiSelect: true,
          options: [{ label: 'UI', description: 'Visible work' }],
        },
      ],
    },
  };
  assert.equal(questions(request)[0].multiSelect, true);
  assert.deepEqual(
    questions({
      ...request,
      input: { questions: [...request.input.questions, ...request.input.questions] },
    }),
    [],
  );
  assert.deepEqual(
    questions({
      ...request,
      input: { questions: [{ header: 'Scope', question: 'Choose', options: [null] }] },
    }),
    [],
  );
});
