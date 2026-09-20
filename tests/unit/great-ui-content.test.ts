import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { entries, index, capabilities } from '../../src/features/great-ui/content-build.mjs';
import { validateCatalog, validateDetail } from '../../src/features/great-ui/catalog.ts';
import { validateCapabilities } from '../../src/features/great-ui/composition/validate.ts';
import { createTask, taskText } from '../../src/features/great-ui/task.mjs';
import { demoPlan } from '../../src/features/great-ui/composition/demos.ts';
import crossReviews from '../../src/features/great-ui/data/cross-source-review.json' with { type: 'json' };
import reviews from '../../src/features/great-ui/data/source-review.json' with { type: 'json' };
import upstream from '../../src/features/great-ui/data/upstream-catalog.json' with { type: 'json' };
import recordings from '../../src/features/great-ui/data/local-recordings.json' with { type: 'json' };

test('all owned recordings match their provenance and never request the unavailable author host', async () => {
  assert.equal(Object.keys(recordings).length, 51);
  for (const [slug, recording] of Object.entries(recordings)) {
    const entry = entries.find((item: { slug: string }) => item.slug === slug)!;
    assert.equal(entry.reference, recording.source);
    assert.equal(entry.previewRecording, recording.video.path.replace(/^public/, ''));
    assert.equal(entry.poster, recording.poster.path.replace(/^public/, ''));
    assert.match(entry.recordingCredit, /本地录制/);
    assert.ok(recording.sourceFrames > 10);
    for (const asset of [
      recording.video,
      recording.poster,
      ...Object.values(recording.renditions).flatMap((variant) => [variant.video, variant.poster]),
    ]) {
      const bytes = await readFile(new URL('../../' + asset.path, import.meta.url));
      assert.equal(bytes.length, asset.bytes, asset.path);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.path);
    }
  }
  assert.ok(
    entries.every(
      (entry: { previewRecording: string | null }) =>
        !entry.previewRecording?.startsWith('https://ik.imagekit.io/zoffdbb7mk/'),
    ),
  );
});

test('all 51 published works have distinct Chinese learning material, fixed source review and resolvable relations', () => {
  assert.equal(validateCatalog(index).length, 51);
  assert.equal(validateCapabilities(capabilities).length, 51);
  assert.ok(
    validateCapabilities(capabilities).every((work) => work.sourceReviewed && work.browserObserved),
  );
  assert.deepEqual(
    new Set(
      index
        .filter((x: { id: string }) => x.id.startsWith('great-ui-'))
        .map((x: { slug: string }) => x.slug),
    ),
    new Set(upstream.entries.map((x) => x.slug)),
  );
  assert.equal(new Set(entries.map((x: { summary: string }) => x.summary)).size, 51);
  assert.equal(
    new Set(entries.map((x: { sections: { text: string }[] }) => x.sections[1].text)).size,
    51,
  );
  for (const entry of entries) {
    validateDetail(entry, entry);
    assert.match(entry.title, /[\u4e00-\u9fff]/);
    assert.ok(entry.principles.length, `${entry.slug} has no mechanism mapping`);
    const review = [
      ...reviews.entries.map((review) => ({ ...review, revision: reviews.revision })),
      ...crossReviews.entries,
    ].find((x) => x.slug === entry.slug)!;
    assert.ok(review, entry.slug);
    assert.equal(review.id, entry.id);
    assert.equal(entry.revision, review.revision);
    for (const file of [review.implementation, review.preview]) {
      assert.equal(file.reviewed, true);
      assert.match(file.sha256, /^[a-f0-9]{64}$/);
      assert.ok(file.bytes > 0);
    }
    assert.ok(entry.source.endsWith('/' + review.implementation.path));
    assert.ok(entry.previewSource.endsWith('/' + review.preview.path));
    for (const related of [...entry.related.alternatives, ...entry.related.principles]) {
      assert.ok(
        index.some(
          (x: { slug: string; title: string }) =>
            x.slug === related.slug && x.title === related.title,
        ),
      );
      assert.notEqual(related.slug, entry.slug);
    }
  }
});

test('adapted targets do not inherit incompatible original requirements', () => {
  const accordion = entries.find((entry: { slug: string }) => entry.slug === 'accordion')!;
  const single = createTask(accordion, { placement: '', changes: '', goalId: 'compare' });
  assert.ok(single.referenceDesign.preserve.includes('同一时刻最多展开一项'));
  assert.match(single.goal.action, /多个展开项/);
  assert.doesNotMatch(JSON.stringify([single.preserve, single.checks]), /最多展开一项|初始第二项/);
  const product = createTask(
    accordion,
    { placement: '', changes: '', goalId: 'faithful' },
    demoPlan(capabilities, 'product', 'normal'),
  );
  assert.equal(product.goal.id, 'product');
  assert.match(JSON.stringify([product.preserve, product.checks]), /问答允许同时展开/);
  assert.doesNotMatch(
    JSON.stringify([product.goal, product.preserve, product.checks]),
    /最多展开一项|初始第二项/,
  );
  for (const slug of ['staggered-page-transition', 'accordion', 'text-reveal']) {
    const entry = entries.find((item: { slug: string }) => item.slug === slug)!;
    assert.ok(
      entry.sections.some((section: { text: string }) => /\[\[.+?\|.+?\]\]/.test(section.text)),
      slug,
    );
  }
});

test('corrupt nested data, unsafe URLs and stale detail IDs fail before rendering', () => {
  const original = entries[3];
  const mutations: [string[], unknown][] = [
    [['learning', 'goals'], 'invalid'],
    [['learning', 'goals', '0', 'judge'], null],
    [['learning', 'adjustments'], [[null, 1, {}]]],
    [['glossary', original.terms[0], 'definition'], {}],
    [['sections', '0', 'text'], '[[missing|错误术语]]'],
    [['source'], 'https://evil.test/blob/' + original.revision + '/ui'],
    [['related', 'alternatives'], [null]],
    [['checks'], [null]],
    [['recording'], 'javascript:alert(1)'],
    [['id'], 'wrong'],
  ];
  for (const [path, replacement] of mutations) {
    const value = structuredClone(original);
    let parent = value as unknown as Record<string, unknown>;
    for (const key of path.slice(0, -1)) parent = parent[key] as Record<string, unknown>;
    parent[path.at(-1)!] = replacement;
    assert.throws(() => validateDetail(value, original), /完整加载/);
  }
  assert.throws(() => validateCatalog([...index, index[0]]), /重复/);
  assert.throws(() =>
    validateCatalog([
      { ...index[0], classification: { type: '组件', purpose: [null], behavior: [] } },
    ]),
  );
  const broken = structuredClone(capabilities);
  Object.assign(broken[0], {
    resources: [{ name: 'route', scope: 'unrecognized', phase: '*', mode: 'exclusive' }],
  });
  assert.throws(() => validateCapabilities(broken));
});

test('recorded hover previews and task formats preserve the same user choices and fixed sources', () => {
  for (const slug of ['image-hover-reveal', 'avatar-stack']) {
    const entry = entries.find((x: { slug: string }) => x.slug === slug)!;
    assert.equal(entry.previewRecording, `/great-ui/media/${slug}-demo.mp4`);
    assert.equal(entry.previewImage, null);
  }
  for (const entry of entries) {
    for (const goal of entry.learning.goals) {
      const task = createTask(entry, {
        placement: '  产品详情页  ',
        changes: '保留深色配色，说明失败原因',
        goalId: goal.id,
      });
      const reloaded = JSON.parse(JSON.stringify(task));
      const text = taskText(reloaded);
      assert.equal(reloaded.placement, '产品详情页');
      assert.equal(reloaded.goal.id, goal.id);
      for (const value of [
        reloaded.placement,
        reloaded.changes,
        goal.action,
        goal.judge,
        entry.source,
        entry.revision,
      ])
        assert.ok(text.includes(value));
      assert.ok(!text.includes('undefined'), entry.slug);
    }
  }
});

test('cross-source detail and capability validation reject mismatched repositories and source IDs', () => {
  for (const sourceId of ['beui', 'rare-ui', 'microkit']) {
    const entry = entries.find((entry: { sourceId: string }) => entry.sourceId === sourceId)!;
    for (const change of [
      { sourceId: 'unregistered' },
      {
        source: entry.source.replace(/github.com\/[^/]+\/[^/]+/, 'github.com/Saurabh-2607/GreatUI'),
      },
      { reference: entry.reference + '?redirect=other' },
      { previewSource: entry.previewSource.replace(entry.revision, '0'.repeat(40)) },
      { sourceRaw: entry.sourceRaw.replace('raw.githubusercontent.com', 'evil.test') },
      { author: 'Saurabh Sharma · Great UI' },
    ])
      assert.throws(() => validateDetail({ ...entry, ...change }, entry));
    const capability = capabilities.find((work) => work.id === entry.id)!;
    for (const change of [
      { sourceId: 'unregistered' },
      { reference: 'https://evil.test/' },
      { source: capability.source + '/../other.tsx' },
      { sourceRevision: 'main' },
    ])
      assert.throws(() => validateCapabilities([{ ...capability, ...change }]));
  }
});
