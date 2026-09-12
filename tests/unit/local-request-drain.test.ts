import { EventEmitter } from 'node:events';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BrowserContext } from '@playwright/test';
import { trackLocalRequests } from '../local-request-drain.ts';

const origin = 'http://127.0.0.1:4322';
function fixture() {
  const events = new EventEmitter();
  const drain = trackLocalRequests(events as unknown as BrowserContext, origin);
  return { events, drain };
}

test('external image traffic cannot hold local proxy teardown open', async () => {
  const { events, drain } = fixture();
  events.emit('request', { url: () => 'https://i.ytimg.com/never-finishes.jpg' });
  await drain({ quietMs: 5, timeoutMs: 100 });
  assert.deepEqual(events.eventNames(), []);
});

test('local response bodies must finish or fail before teardown can complete', async () => {
  for (const settled of ['requestfinished', 'requestfailed']) {
    const { events, drain } = fixture();
    const request = { url: () => origin + '/image.png' };
    events.emit('request', request);
    let completed = false;
    const result = drain({ quietMs: 5, timeoutMs: 500 }).then(() => {
      completed = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 15));
    assert.equal(completed, false);
    events.emit(settled, request);
    await result;
    assert.deepEqual(events.eventNames(), []);
  }
});

test('a stuck local request fails and releases listeners without leaking URL credentials', async () => {
  const { events, drain } = fixture();
  events.emit('request', { url: () => origin + '/stuck.png?private=example' });
  await assert.rejects(drain({ quietMs: 5, timeoutMs: 25 }), {
    message: 'Local proxy requests did not drain: /stuck.png',
  });
  assert.deepEqual(events.eventNames(), []);
});
