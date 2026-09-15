import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import { readCatalog } from '../../src/lib/content/catalog.ts';
import { publishedWorks } from '../../src/lib/content/views.ts';
import { workCardHtml } from '../../src/lib/media/render.ts';
import { parseCard } from '../../src/lib/media/card.ts';
import { readLimited } from '../../src/lib/media/read.ts';
import { learningMetadataSchema } from '../../src/lib/content/learning.ts';
import { learningEntry } from '../../src/features/great-ui/markdown-content.ts';
import { createTask, taskText } from '../../src/features/great-ui/task.mjs';
import { validateDetail } from '../../src/features/great-ui/catalog.ts';

const catalog = readCatalog();
const collection = publishedWorks(catalog, 'zh').find((work) => work.slug === 'great-ui-learning')!;

test('collection projection contains only light previews and renders one media element', () => {
  const card = collection.mediaCard!;
  assert.equal(card.collection!.count, 51);
  assert.equal(card.collection!.items.length, 51);
  assert.ok(gzipSync(JSON.stringify(card.collection)).length < 6 * 1024);
  for (const item of card.collection!.items) {
    assert.ok(item.card.sources.every((source) => source.src.endsWith('-card.mp4')));
    assert.ok(item.card.poster.src.endsWith('-card-poster.jpg'));
  }
  const html = workCardHtml(collection, 'zh');
  assert.equal((html.match(/<video\b/g) || []).length, 1);
  assert.equal((html.match(/data-media-root/g) || []).length, 1);
  assert.equal((html.match(/<source\b/g) || []).length, 0);
  assert.equal((html.match(/data-media-image/g) || []).length, 1);
  assert.ok(!publishedWorks(catalog, 'en').some((work) => work.mediaCard?.collection));
});

test('search projections reject malformed, nested or external collection members and escape titles', () => {
  for (const mutate of [
    (card: typeof collection.mediaCard) => {
      card!.collection!.id = undefined as never;
    },
    (card: typeof collection.mediaCard) => {
      card!.collection!.items = [];
    },
    (card: typeof collection.mediaCard) => {
      card!.collection!.items.push(card!.collection!.items[0]);
    },
    (card: typeof collection.mediaCard) => {
      card!.collection!.items[0].card.sources[0].src = 'https://evil.invalid/clip.mp4';
    },
    (card: typeof collection.mediaCard) => {
      card!.collection!.items[0].card.collection = structuredClone(card!.collection);
    },
  ]) {
    const card = structuredClone(collection.mediaCard);
    mutate(card);
    assert.throws(() => parseCard(JSON.stringify(card)));
  }
  const work = structuredClone(collection);
  work.mediaCard!.collection!.items[0].title = '<script>alert(1)</script>';
  assert.ok(!workCardHtml(work, 'zh').includes('<script>'));
});

test('responsive media is validated and exported as available desktop and phone references', () => {
  const work = catalog.works.find((work) => work.meta.id === 'great-ui-text-reveal')!;
  const entry = learningEntry(work, 'zh', 'https://preview.example');
  const task = createTask(entry, { goalId: 'faithful', placement: '介绍页', changes: '' });
  assert.equal(
    task.media.mobileUrl,
    'https://preview.example/great-ui/media/text-reveal-mobile.mp4',
  );
  assert.ok(taskText(task).includes(task.media.mobileUrl));
  for (const patch of [
    { width: 0 },
    { duration: Infinity },
    { video: '/great-ui/media/../bad.mp4' },
  ]) {
    const meta = structuredClone(work.meta.learning!);
    Object.assign(meta.media.mobile!, patch);
    assert.equal(learningMetadataSchema.safeParse(meta).success, false);
    const changed = structuredClone(entry);
    Object.assign(changed.recordingMedia.mobile!, patch);
    assert.throws(() => validateDetail(changed, entry));
  }
});

test('bounded media reads accept exact limits and cancel streamed overflow without trusting headers', async () => {
  assert.deepEqual(
    new Uint8Array(
      await (await readLimited(new Response(new Uint8Array([1, 2, 3])), 3)).arrayBuffer(),
    ),
    new Uint8Array([1, 2, 3]),
  );
  await assert.rejects(readLimited(new Response('bad', { status: 500 }), 10));
  for (const init of [{ status: 500 }, { headers: { 'Content-Length': '4' } }]) {
    let cancelled = false;
    const stream = new ReadableStream({
      cancel() {
        cancelled = true;
      },
    });
    await assert.rejects(readLimited(new Response(stream, init), 3));
    assert.equal(cancelled, true);
  }
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(4));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(
    readLimited(new Response(stream, { headers: { 'Content-Length': '1' } }), 3),
  );
  assert.equal(cancelled, true);
});
