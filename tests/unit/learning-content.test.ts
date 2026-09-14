import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readCatalog } from '../../src/lib/content/catalog.ts';
import { validateCatalog } from '../../src/lib/content/validate.ts';
import { parseLearningBody, learningLanguageSchema } from '../../src/lib/content/learning.ts';
import { sourceRevision } from '../../src/lib/content/revision.ts';
import { publishedWorks, browsePages } from '../../src/lib/content/views.ts';
import { learningEntry } from '../../src/features/great-ui/markdown-content.ts';
import { createTask, taskText } from '../../src/features/great-ui/task.mjs';
import { compileProse } from '../../src/features/great-ui/compile-prose.ts';

const catalog = readCatalog();
const original = catalog.works.find((work) => work.meta.id === 'great-ui-accordion')!;

test('one Markdown edit changes visible explanation and both task formats', () => {
  const work = structuredClone(original);
  const version = work.versions.zh!;
  const sentence = '问题标题始终可见，点击后才显示答案。';
  version.body = version.body.replace(sentence, '先阅读问题，按需打开完整答案。');
  version.data.learning!.goals[0].action = '先验证关键答案支持键盘展开，再加入动效。';
  const entry = learningEntry(work, 'zh', 'https://vibes.college');
  assert.match(entry.sections[0].text, /先阅读问题/);
  const task = createTask(entry, { goalId: 'faithful', placement: '帮助页', changes: '' });
  const text = taskText(JSON.parse(JSON.stringify(task)));
  assert.match(text, /先阅读问题/);
  assert.match(text, /关键答案支持键盘/);
  assert.equal(task.media.url, 'https://vibes.college/great-ui/media/accordion-source-capture.mp4');
  assert.equal(task.media.localPath, null);
  assert.doesNotMatch(text, /本机素材：|localhost|127\.0\.0\.1|\/Users\//);
  assert.notEqual(sourceRevision(work), sourceRevision(original));
});

test('broken Markdown structure and missing or duplicate structured goals are rejected', () => {
  const body = original.versions.zh!.body;
  for (const changed of [
    body.replace('## 改造设计', '## 改造方案'),
    body + '\n## 拆解设计\n重复',
    body.replace('### 适合用在哪里', '### 使用建议'),
  ])
    assert.throws(() => parseLearningBody(changed, 'test/zh.md'), /test\/zh.md/);
  const text = structuredClone(original.versions.zh!.data.learning!);
  assert.equal(learningLanguageSchema.safeParse({ ...text, goals: [] }).success, false);
  assert.equal(
    learningLanguageSchema.safeParse({ ...text, goals: [text.goals[0], text.goals[0]] }).success,
    false,
  );
});

test('Markdown compiles links, lists and emphasis without executable markup', async () => {
  const entry = learningEntry(original, 'zh');
  const source =
    '**清楚的标题**与[[disclosure|渐进披露]]。\n\n- [原作](https://www.great-ui.com)\n- `activeIndex`';
  entry.sections[0].text = source;
  const compiled = await compileProse(entry);
  assert.match(JSON.stringify(compiled.prose[source]), /"tag":"strong"/);
  assert.match(JSON.stringify(compiled.prose[source]), /"tag":"ul"/);
  assert.match(JSON.stringify(compiled.prose[source]), /"href":"https:\/\/www.great-ui.com"/);
  for (const unsafe of ['<script>alert(1)</script>', '[点击](javascript:alert)']) {
    entry.sections[0].text = unsafe;
    await assert.rejects(compileProse(entry));
  }
});

test('collection is listed once while child pages remain searchable and language truthful', () => {
  const pages = browsePages(catalog, 'zh').filter((page) => !page.tag);
  const listed = pages.flatMap((page) => page.works);
  assert.equal(listed.filter((work) => work.slug === 'great-ui-learning').length, 1);
  assert.equal(listed.filter((work) => work.meta.learning).length, 0);
  assert.ok(publishedWorks(catalog, 'zh').some((work) => work.slug === original.meta.id));
  assert.ok(!publishedWorks(catalog, 'en').some((work) => work.slug === original.meta.id));
});

test('orphaned collections, mismatched language data and unknown term references fail catalog validation', () => {
  for (const change of [
    (work: typeof original) => {
      work.meta.learning!.collectionId = 'missing-collection';
    },
    (work: typeof original) => {
      delete work.versions.zh!.data.learning;
    },
    (work: typeof original) => {
      work.versions.zh!.body += '\n[[missing-term|未知术语]]';
    },
    (work: typeof original) => {
      work.meta.learning!.media.video = '/great-ui/media/missing-recording.mp4';
    },
  ]) {
    const copy = structuredClone(catalog);
    change(copy.works.find((work) => work.meta.id === original.meta.id)!);
    assert.throws(() => validateCatalog(copy));
  }
});
