import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePublicWorkDraft,
  parseHostCommand,
  parseAssistantEvent,
  PUBLIC_DRAFT_LIMITS,
} from '../../src/features/paseo-webui/contract.ts';

const draft = {
  requestId: '843837fc-e8e0-4f28-a8c7-12ea6be888bf',
  id: 'example-work',
  title: '公开作品',
  canonicalUrl: 'https://vibes.college/zh/works/example-work/',
};

test('article requests contain only bounded public identity and a distinct request id', () => {
  const result = parsePublicWorkDraft(draft);
  assert.deepEqual(result, draft);
  assert.notEqual(result, draft);
  for (const key of ['requestId', 'id', 'title'] as const) {
    assert.equal(parsePublicWorkDraft({ ...draft, [key]: '' }), null);
    assert.equal(
      parsePublicWorkDraft({ ...draft, [key]: 'x'.repeat(PUBLIC_DRAFT_LIMITS[key] + 1) }),
      null,
    );
  }
  assert.equal(parsePublicWorkDraft({ ...draft, id: '../host' }), null);
  assert.equal(parsePublicWorkDraft({ ...draft, title: '\u0000' }), null);
  for (const field of ['summary', 'sourceUrl', 'token', 'rpc', 'approval', 'secret'])
    assert.equal(parsePublicWorkDraft({ ...draft, [field]: 'not-allowed' }), null);
  for (const url of [
    'javascript:alert(1)',
    'file:///private/a',
    'http://example.com',
    'https://user:pass@example.com',
    'https://example.com/?token=x',
    'https://example.com/#pairing',
  ])
    assert.equal(parsePublicWorkDraft({ ...draft, canonicalUrl: url }), null);
});

test('contract rejects unknown operations, protocol versions, fields and accessors', () => {
  for (const type of ['rpc', 'send', 'approve', 'stop', 'connect', 'forget'])
    assert.equal(parseHostCommand({ version: 1, type, value: {} }), null);
  assert.equal(parseHostCommand({ version: 2, type: 'locale', value: 'zh' }), null);
  assert.equal(parseHostCommand({ version: 1, type: 'locale', value: 'fr' }), null);
  assert.equal(parseHostCommand({ version: 1, type: 'dispose', value: true }), null);
  let read = false;
  const accessor = {
    version: 1,
    type: 'locale',
    get value() {
      read = true;
      return 'zh';
    },
  };
  assert.equal(parseHostCommand(accessor), null);
  assert.equal(read, false);
  assert.equal(parseHostCommand(Object.create({ version: 1, type: 'dispose' })), null);
  assert.equal(parseHostCommand({ version: 1, type: 'dispose', [Symbol('secret')]: true }), null);
});

test('surface is independent of visibility, focus and document activity', () => {
  for (const surface of ['compact', 'full']) {
    const command = {
      version: 1,
      type: 'presentation',
      value: { visible: false, focused: true, pageVisible: true, surface },
    };
    assert.deepEqual(parseHostCommand(command), command);
    assert.equal(parseHostCommand({ ...command, value: { ...command.value, visible: 1 } }), null);
    assert.equal(
      parseHostCommand({ ...command, value: { ...command.value, surface: 'chat' } }),
      null,
    );
    const event = { version: 1, type: 'surface', value: surface };
    assert.deepEqual(parseAssistantEvent(event), event);
  }
  assert.equal(parseAssistantEvent({ version: 1, type: 'surface', value: 'build' }), null);
  assert.deepEqual(parseHostCommand({ version: 1, type: 'draft', value: draft }), {
    version: 1,
    type: 'draft',
    value: draft,
  });
  assert.deepEqual(parseHostCommand({ version: 1, type: 'draft', value: null }), {
    version: 1,
    type: 'draft',
    value: null,
  });
});

test('assistant events never expose private state or arbitrary error details', () => {
  for (const event of [
    { version: 1, type: 'ready' },
    { version: 1, type: 'saved-hosts' },
    { version: 1, type: 'close' },
    { version: 1, type: 'state', value: 'operable' },
    { version: 1, type: 'error', code: 'resource', retryable: true },
  ])
    assert.deepEqual(parseAssistantEvent(event), event);
  for (const event of [
    { version: 1, type: 'error', code: 'resource', retryable: true, stack: 'secret' },
    { version: 1, type: 'error', code: 'raw exception text', retryable: true },
    { version: 1, type: 'state', value: 'connected-authoritative' },
    { version: 1, type: 'ready', session: 'private-chat' },
    { version: 1, type: 'saved-hosts', address: 'private-computer' },
  ])
    assert.equal(parseAssistantEvent(event), null);
});
