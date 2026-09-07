import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateMediaFiles } from '../../src/lib/media/files.ts';
import { projectCard, parseCard } from '../../src/lib/media/card.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mediaSchema, presentationSchema, mediaTextSchema } from '../../src/lib/media/schema.ts';
import { validateMedia } from '../../src/lib/media/validate.ts';
import { isMediaUrl, embedUrl, mediaLimits, mediaFrameOrigins } from '../../src/config/media.ts';

const provenance = { url: 'https://vibes.college/', credit: 'Vibes', license: 'CC0' };
const image = {
  id: 'poster',
  kind: 'image',
  src: '/media/lab/poster.webp',
  width: 480,
  height: 320,
  provenance,
};
const clip = {
  id: 'clip',
  kind: 'video',
  sources: [{ src: '/media/lab/clip.mp4', type: 'video/mp4', bytes: 3000 }],
  width: 480,
  height: 320,
  duration: 8,
  hasAudio: false,
  posterId: 'poster',
  provenance,
};
const parse = (values: unknown[]) => values.map((value) => mediaSchema.parse(value));

test('media accepts ordinary assets and rejects unsafe or unregistered sources', () => {
  assert.equal(mediaSchema.parse(image).kind, 'image');
  for (const src of [
    'javascript:alert(1)',
    '//evil.test/a.mp4',
    '/media/../secret',
    '/media/%2e%2e/a',
    '/media/a\\b',
    'https://evil.test/a.mp4',
  ])
    assert.equal(isMediaUrl(src), false, src);
  assert.equal(isMediaUrl('/media/lab/poster.webp'), true);
  assert.throws(() => mediaSchema.parse({ ...image, width: -1 }));
  assert.throws(() => mediaSchema.parse({ ...image, surprise: true }));
  assert.throws(() => embedUrl('bilibili', 'javascript:alert(1)'));
  assert.match(embedUrl('bilibili', 'BV1Mfbzz7E8P'), /^https:\/\/player\.bilibili\.com\//);
});

test('media references and card budgets fail with actionable field paths', () => {
  const presentation = presentationSchema.parse({
    card: { mediaId: 'clip', mode: 'motion' },
    detail: { items: ['clip', 'poster'] },
    fallbackId: 'poster',
  });
  assert.doesNotThrow(() => validateMedia(parse([image, clip]), presentation));
  assert.throws(() => validateMedia(parse([image, image]), presentation), /duplicate.*poster/);
  assert.throws(() => validateMedia(parse([clip]), presentation), /poster/);
  assert.throws(
    () => validateMedia(parse([image, { ...clip, duration: 13 }]), presentation),
    /card.*duration/,
  );
  assert.throws(
    () => validateMedia(parse([image, { ...clip, hasAudio: true }]), presentation),
    /card.*audio/,
  );
  assert.throws(
    () =>
      validateMedia(
        parse([
          image,
          { ...clip, sources: [{ ...clip.sources[0], bytes: mediaLimits.cardVideoBytes + 1 }] },
        ]),
        presentation,
      ),
    /card.*bytes/,
  );
  assert.throws(
    () =>
      validateMedia(parse([image, { ...clip, chapters: [{ id: 'end', start: 9 }] }]), presentation),
    /chapters/,
  );
  assert.throws(
    () => validateMedia(parse([image, { ...clip, posterId: 'clip' }]), presentation),
    /posterId/,
  );
});

test('animation posters must be static and presentation cannot refer to arbitrary ids', () => {
  assert.throws(
    () => validateMedia(parse([{ ...image, animated: true, posterId: 'poster' }]), undefined),
    /posterId/,
  );
  assert.throws(
    () =>
      validateMedia(
        parse([image]),
        presentationSchema.parse({
          card: { mediaId: 'missing', mode: 'image' },
          detail: { items: ['poster'] },
          fallbackId: 'poster',
        }),
      ),
    /card.mediaId/,
  );
});

test('localized media, chapters and chart context are complete and time-bounded', () => {
  const media = parse([image, { ...clip, chapters: [{ id: 'start', start: 0 }] }]);
  const presentation = presentationSchema.parse({
    card: { mediaId: 'clip', mode: 'motion' },
    detail: { items: ['clip'] },
    fallbackId: 'poster',
  });
  const text = mediaTextSchema.parse({
    poster: { title: 'Poster', alt: 'Actual image' },
    clip: {
      title: 'Clip',
      chapters: { start: 'Start' },
      transcript: [{ start: 0, text: 'Opening' }],
    },
  });
  assert.doesNotThrow(() => validateMedia(media, presentation, text));
  assert.throws(() => validateMedia(media, presentation, {}), /missing localized/);
  assert.throws(
    () =>
      validateMedia(media, presentation, { ...text, poster: { ...text.poster, alt: undefined } }),
    /alt/,
  );
  assert.throws(
    () => validateMedia(media, presentation, { ...text, clip: { ...text.clip, chapters: {} } }),
    /chapters/,
  );
  assert.throws(
    () =>
      validateMedia(media, presentation, {
        ...text,
        clip: { ...text.clip, transcript: [{ start: 8, text: 'Outside' }] },
      }),
    /transcript/,
  );
});

test('registered embeds match CSP and card projection excludes full assets and language bodies', () => {
  const headers = readFileSync(new URL('../../public/_headers', import.meta.url), 'utf8');
  for (const origin of mediaFrameOrigins) assert.ok(headers.includes(origin), origin);
  for (const [provider, id] of [
    ['youtube', 'eMlx5fFNoYc'],
    ['spotify', 'track/4PTG3Z6ehGkBFwjybzWkR8'],
    ['site', 'yaoda-ninja'],
  ]) {
    const url = embedUrl(provider, id);
    assert.ok(mediaFrameOrigins.includes(new URL(url).origin));
  }
  for (const id of ['https://evil.test', '__proto__', 'constructor', '2048/../'])
    assert.throws(() => embedUrl('site', id));
  const media = parse([
    image,
    clip,
    {
      ...clip,
      id: 'full',
      duration: 120,
      sources: [{ ...clip.sources[0], src: '/media/lab/full.mp4' }],
    },
  ]);
  const presentation = presentationSchema.parse({
    card: { mediaId: 'clip', mode: 'motion' },
    detail: { items: ['full'] },
    fallbackId: 'poster',
  });
  const text = mediaTextSchema.parse({
    poster: { title: 'Poster', alt: 'Actual image' },
    clip: { title: 'Clip' },
    full: { title: 'Private full title' },
  });
  const projected = projectCard(media, presentation, text)!;
  assert.deepEqual(parseCard(JSON.stringify(projected)), projected);
  assert.ok(!JSON.stringify(projected).includes('full'));
  assert.throws(() =>
    parseCard(
      JSON.stringify({
        ...projected,
        sources: [{ src: 'javascript:alert(1)', type: 'video/mp4' }],
      }),
    ),
  );
});

test('local files enforce actual bytes, containment and WebVTT content', () => {
  const root = mkdtempSync(join(tmpdir(), 'vibes-media-'));
  try {
    mkdirSync(join(root, 'media/lab'), { recursive: true });
    writeFileSync(join(root, 'media/lab/poster.webp'), '123');
    assert.doesNotThrow(() => validateMediaFiles(parse([{ ...image, bytes: 3 }]), root));
    assert.throws(() => validateMediaFiles(parse([{ ...image, bytes: 4 }]), root), /actual 3/);
    writeFileSync(join(root, 'media/lab/clip.mp4'), Buffer.alloc(3000));
    writeFileSync(join(root, 'media/lab/caption.vtt'), 'invalid');
    assert.throws(
      () =>
        validateMediaFiles(
          parse([{ ...clip, captions: [{ src: '/media/lab/caption.vtt', locale: 'zh' }] }]),
          root,
        ),
      /WebVTT/,
    );
    writeFileSync(
      join(root, 'media/lab/caption.vtt'),
      'WEBVTT\n\n00:00.000 --> 00:01.000\nTest cue\n',
    );
    assert.doesNotThrow(() =>
      validateMediaFiles(
        parse([{ ...clip, captions: [{ src: '/media/lab/caption.vtt', locale: 'zh' }] }]),
        root,
      ),
    );
    symlinkSync(join(tmpdir()), join(root, 'media/outside'));
    assert.throws(
      () => validateMediaFiles(parse([{ ...image, src: '/media/outside' }]), root),
      /escapes/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
