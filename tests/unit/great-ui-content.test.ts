import assert from 'node:assert/strict';
import { test } from 'node:test';
import { entries, index, capabilities } from '../../src/features/great-ui/content-build.mjs';
import { validateCatalog, validateDetail } from '../../src/features/great-ui/catalog.ts';
import { validateCapabilities } from '../../src/features/great-ui/composition/validate.ts';
import { createTask, taskText } from '../../src/features/great-ui/task.mjs';
import reviews from '../../src/features/great-ui/data/source-review.json' with { type: 'json' };
import upstream from '../../src/features/great-ui/data/upstream-catalog.json' with { type: 'json' };

test('all 48 published works have distinct Chinese learning material, fixed source review and resolvable relations', () => {
  assert.equal(validateCatalog(index).length, 48);
  assert.equal(validateCapabilities(capabilities).length, 48);
  assert.deepEqual(
    new Set(index.map((x: { slug: string }) => x.slug)),
    new Set(upstream.entries.map((x) => x.slug)),
  );
  assert.equal(new Set(entries.map((x: { summary: string }) => x.summary)).size, 48);
  assert.equal(
    new Set(entries.map((x: { sections: { text: string }[] }) => x.sections[1].text)).size,
    48,
  );
  for (const entry of entries) {
    validateDetail(entry, entry);
    assert.match(entry.title, /[\u4e00-\u9fff]/);
    assert.ok(entry.principles.length, `${entry.slug} has no mechanism mapping`);
    const review = reviews.entries.find((x: { slug: string }) => x.slug === entry.slug)!;
    assert.ok(review, entry.slug);
    assert.equal(review.id, entry.id);
    assert.equal(entry.revision, reviews.revision);
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

test('image previews remain images and task formats preserve the same user choices and fixed sources', () => {
  for (const slug of ['image-hover-reveal', 'avatar-stack']) {
    const entry = entries.find((x: { slug: string }) => x.slug === slug)!;
    assert.equal(entry.previewRecording, null);
    assert.match(entry.previewImage!, /^https:\/\/www.great-ui.com\/previews\/.*\.png$/);
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
