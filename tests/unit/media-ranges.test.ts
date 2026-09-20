import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../src/worker.ts';

const bytes = Uint8Array.from({ length: 10 }, (_, index) => index);
const path = 'https://vibes.college/great-ui/media/example.mp4';
const headers = {
  'content-type': 'video/mp4',
  'content-length': String(bytes.length),
  etag: '"recording-v1"',
  'cache-control': 'public, max-age=0, must-revalidate',
  'content-security-policy': "default-src 'self'",
  'x-content-type-options': 'nosniff',
};

function fixture(
  options: { body?: Uint8Array<ArrayBuffer>; status?: number; headers?: HeadersInit } = {},
) {
  const received: Request[] = [];
  const ASSETS = {
    async fetch(request: Request) {
      received.push(request);
      return new Response(request.method === 'HEAD' ? null : (options.body ?? bytes), {
        status: options.status ?? 200,
        headers: options.headers ?? headers,
      });
    },
  };
  return { received, ASSETS };
}

test('static media returns exact closed, open and suffix byte ranges with original headers', async () => {
  for (const [range, from, to] of [
    ['bytes=0-1', 0, 1],
    ['bytes=4-', 4, 9],
    ['bytes=-3', 7, 9],
    ['bytes=8-99', 8, 9],
    ['bytes=-99', 0, 9],
    ['BYTES=0-0', 0, 0],
  ] as const) {
    const env = fixture();
    const response = await worker.fetch(new Request(path, { headers: { range } }), env);
    assert.equal(response.status, 206, range);
    assert.equal(response.headers.get('content-range'), `bytes ${from}-${to}/10`);
    assert.equal(response.headers.get('content-length'), String(to - from + 1));
    assert.equal(response.headers.get('accept-ranges'), 'bytes');
    for (const [name, value] of Object.entries(headers))
      if (name !== 'content-length') assert.equal(response.headers.get(name), value, name);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes.slice(from, to + 1));
    assert.equal(env.received[0].url, path);
    assert.equal(env.received[0].headers.get('range'), null);
    assert.equal(env.received[0].headers.get('accept-encoding'), 'identity');
  }
});

test('unsatisfiable media ranges return 416 with the actual representation length', async () => {
  for (const range of [
    'bytes=10-',
    'bytes=30-50',
    'bytes=-0',
    'bytes=4-2',
    'bytes=99999999999999999999-',
  ]) {
    const response = await worker.fetch(new Request(path, { headers: { range } }), fixture());
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('content-range'), 'bytes */10');
    assert.equal(response.headers.get('content-length'), '0');
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
});

test('unsupported ranges and stale or weak validators preserve the complete response', async () => {
  for (const requestHeaders of [
    {},
    { range: 'bytes=0-1,4-5' },
    { range: 'bytes=-' },
    { range: 'items=0-1' },
    { range: 'bytes=0-1', 'if-range': '"old"' },
    { range: 'bytes=0-1', 'if-range': 'W/"recording-v1"' },
    { range: 'bytes=0-1', 'if-range': 'Sun, 20 Sep 2026 00:00:00 GMT' },
  ] as HeadersInit[]) {
    const env = fixture();
    const response = await worker.fetch(new Request(path, { headers: requestHeaders }), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-range'), null);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
    assert.equal(env.received[0].headers.get('if-range'), null);
  }
  const response = await worker.fetch(
    new Request(path, { headers: { range: 'bytes=0-1', 'if-range': '"recording-v1"' } }),
    fixture(),
  );
  assert.equal(response.status, 206);
});

test('HEAD stays bodyless; unrelated paths, methods, missing files and validators pass through', async () => {
  const head = await worker.fetch(
    new Request(path, { method: 'HEAD', headers: { range: 'bytes=0-1' } }),
    fixture(),
  );
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-length'), '10');
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  for (const request of [
    new Request('https://vibes.college/media/example.mp4', { headers: { range: 'bytes=0-1' } }),
    new Request('https://vibes.college/great-ui/media/poster.jpg'),
    new Request(path, { method: 'POST' }),
  ]) {
    const env = fixture();
    const response = await worker.fetch(request, env);
    assert.equal(response.headers.get('accept-ranges'), null);
    assert.equal(env.received[0], request);
  }
  for (const status of [404, 304]) {
    const env = fixture({ status, body: status === 304 ? undefined : bytes });
    if (status === 304) env.ASSETS.fetch = async () => new Response(null, { status, headers });
    const response = await worker.fetch(
      new Request(path, { headers: { 'if-none-match': '"recording-v1"', range: 'bytes=0-1' } }),
      env,
    );
    assert.equal(response.status, status);
    assert.equal(response.headers.get('accept-ranges'), null);
  }
});

test('range buffering refuses both announced and streamed oversized files', async () => {
  for (const announced of [true, false]) {
    let cancelled = false;
    const ASSETS = {
      async fetch() {
        return new Response(
          new ReadableStream({
            pull(controller) {
              controller.enqueue(new Uint8Array(1024 * 1024));
            },
            cancel() {
              cancelled = true;
            },
          }),
          {
            headers: {
              'content-type': 'video/mp4',
              ...(announced ? { 'content-length': '2097153' } : {}),
            },
          },
        );
      },
    };
    const response = await worker.fetch(new Request(path, { headers: { range: 'bytes=0-1' } }), {
      ASSETS,
    });
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('etag'), null);
    assert.equal(cancelled, true);
  }
});
