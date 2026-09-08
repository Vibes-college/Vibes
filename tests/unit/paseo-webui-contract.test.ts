import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePublicWorkDraft,
  parseHostCommand,
  parseAssistantEvent,
  PUBLIC_DRAFT_LIMITS,
} from '../../src/features/paseo-webui/contract.ts';

const draft = {
  id: 'example-work',
  title: '公开作品',
  canonicalUrl: 'https://vibes.college/zh/works/example-work/',
  sourceUrl: 'https://example.com/work',
  summary: '正文只是待查看的资料，不自动发送。',
};
test('public draft accepts bounded metadata and returns a detached copy', () => {
  const result = parsePublicWorkDraft(draft);
  assert.deepEqual(result, draft);
  assert.notEqual(result, draft);
  assert.ok(parsePublicWorkDraft({ ...draft, summary: 'x'.repeat(PUBLIC_DRAFT_LIMITS.summary) }));
  assert.equal(
    parsePublicWorkDraft({ ...draft, summary: 'x'.repeat(PUBLIC_DRAFT_LIMITS.summary + 1) }),
    null,
  );
  assert.equal(parsePublicWorkDraft({ ...draft, title: '' }), null);
  assert.equal(
    parsePublicWorkDraft({ ...draft, title: 'x'.repeat(PUBLIC_DRAFT_LIMITS.title + 1) }),
    null,
  );
  assert.equal(parsePublicWorkDraft({ ...draft, id: '../host' }), null);
  assert.equal(parsePublicWorkDraft({ ...draft, summary: '\u0000' }), null);
});
test('public draft rejects connection fields and URL-carried credentials', () => {
  for (const field of ['token', 'pairing', 'rpc', 'chat', 'approval', 'secret'])
    assert.equal(parsePublicWorkDraft({ ...draft, [field]: 'not-allowed' }), null);
  for (const url of [
    'javascript:alert(1)',
    'file:///private/a',
    'http://example.com',
    'https://user:pass@example.com',
    'https://example.com/?token=x',
    'https://example.com/#pairing',
  ]) {
    assert.equal(parsePublicWorkDraft({ ...draft, canonicalUrl: url }), null);
    assert.equal(parsePublicWorkDraft({ ...draft, sourceUrl: url }), null);
  }
  assert.ok(parsePublicWorkDraft({ ...draft, sourceUrl: null }));
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
test('presentation and lifecycle preserve separate visible, focus and page signals', () => {
  const command = {
    version: 1,
    type: 'presentation',
    value: { visible: false, focused: true, pageVisible: true },
  };
  assert.deepEqual(parseHostCommand(command), command);
  assert.equal(parseHostCommand({ ...command, value: { ...command.value, visible: 1 } }), null);
  assert.deepEqual(parseHostCommand({ version: 1, type: 'dispose' }), {
    version: 1,
    type: 'dispose',
  });
  assert.deepEqual(parseHostCommand({ version: 1, type: 'draft', value: null }), {
    version: 1,
    type: 'draft',
    value: null,
  });
  assert.deepEqual(parseHostCommand({ version: 1, type: 'draft', value: draft })?.type, 'draft');
});
test('assistant events expose only bounded public states and fixed error codes', () => {
  for (const event of [
    { version: 1, type: 'ready' },
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
  ])
    assert.equal(parseAssistantEvent(event), null);
});
