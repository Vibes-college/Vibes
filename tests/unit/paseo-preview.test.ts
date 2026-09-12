import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import {
  paseoPreviewHtml,
  paseoPreviewPolicy,
  withPaseoPreview,
} from '../../scripts/paseo-webui-preview.ts';

const source = readFileSync('src/features/paseo-webui/preview-carrier.js', 'utf8');
const token = '01234567-1234-4567-8901-0123456789ab';
function fixture() {
  const events: string[] = [];
  const replies: unknown[] = [];
  let listener: ((event: unknown) => void) | undefined;
  const parent = { postMessage: (value: unknown, origin: string) => replies.push([value, origin]) };
  const window = {
    parent,
    addEventListener: (_name: string, handler: typeof listener) => {
      listener = handler;
    },
    removeEventListener: () => {
      listener = undefined;
      events.push('remove');
    },
  };
  runInNewContext(source, {
    window,
    URL,
    location: { href: 'https://vibes.college/paseo-preview/' },
    document: {
      open: () => events.push('open'),
      write: (html: string) => events.push(html),
      close: () => events.push('close'),
    },
  });
  return {
    events,
    replies,
    parent,
    send: (data: unknown, origin = 'https://vibes.college', eventSource: unknown = parent) =>
      listener?.({ data, origin, source: eventSource }),
  };
}

test('HTML carrier accepts one file only after a same-parent same-origin token handshake', () => {
  const f = fixture();
  const init = { version: 1, type: 'vibes-html-init', token };
  f.send(init, 'https://other.invalid');
  f.send(init, undefined, {});
  f.send({ ...init, extra: 'reject' });
  assert.equal(f.replies.length, 0);
  f.send(init);
  assert.deepEqual(JSON.parse(JSON.stringify(f.replies)), [
    [{ version: 1, type: 'vibes-html-ready', token }, 'https://vibes.college'],
  ]);
  const content = {
    version: 1,
    type: 'vibes-html-content',
    token,
    html: '<script>untrusted()</script>',
  };
  f.send({ ...content, token: 'wrong' });
  f.send({ ...content, path: '/private/file.html' });
  assert.deepEqual(f.events, []);
  f.send(content);
  assert.deepEqual(f.events, ['remove', 'open', content.html, 'close']);
  f.send({ ...content, html: 'another file' });
  assert.equal(f.events.length, 4);
});

test('preview response replaces inherited policy only in its own sandboxed path', () => {
  const main =
    "/*\n  Content-Security-Policy: script-src 'self'; frame-src https://example.com; frame-ancestors 'none'\n  X-Frame-Options: DENY\n";
  const result = withPaseoPreview(main);
  const [ordinary, preview] = result.split('/paseo-preview/*');
  assert.ok(!ordinary.includes("'unsafe-inline'") && !ordinary.includes("'unsafe-eval'"));
  assert.match(preview, /! Content-Security-Policy\n/);
  assert.match(preview, /! X-Frame-Options\n/);
  assert.ok(preview.includes(paseoPreviewPolicy));
  assert.ok(paseoPreviewPolicy.includes('sandbox allow-scripts'));
  assert.ok(!paseoPreviewPolicy.includes('allow-same-origin'));
  assert.ok(paseoPreviewHtml().includes(source));
});
