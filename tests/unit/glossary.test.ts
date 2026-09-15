import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { glossaryIndex, parseGlossaryTerm, readGlossary } from '../../src/lib/content/glossary.ts';
import { readCatalog } from '../../src/lib/content/catalog.ts';
import { validateCatalog } from '../../src/lib/content/validate.ts';
import { learningLanguageSchema } from '../../src/lib/content/learning.ts';
import { sourceRevision } from '../../src/lib/content/revision.ts';
import { learningMaterials } from '../../src/features/great-ui/site-content.ts';
import { createTask, taskText } from '../../src/features/great-ui/task.mjs';

const root = 'src/content/glossary/terms';
const glossary = readGlossary();

test('glossary rejects missing sections, invalid source URLs, duplicate identities and colliding aliases', () => {
  const file = `${root}/easing.md`;
  const source = readFileSync(file, 'utf8');
  for (const invalid of [
    source.replace('## 常见变体', '## 其他内容'),
    source.replace(glossary.easing.definition, ''),
    source.replace(glossary.easing.sources[0].url, 'javascript:alert(1)'),
    source + '\n## 适合用在哪里\n重复内容',
  ])
    assert.throws(() => parseGlossaryTerm(invalid, file), /easing\.md/);
  assert.throws(() => glossaryIndex([glossary.easing, glossary.easing]), /duplicate id/);
  assert.throws(
    () => glossaryIndex([glossary.easing, { ...glossary.spring, aliases: ['ＥＡＳＩＮＧ'] }]),
    /alias.*conflicts/,
  );
});

test('one shared Markdown edit reaches both works and task formats, invalidating only dependent content', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'vibes-glossary-'));
  try {
    cpSync(root, temporary, { recursive: true });
    const before = readCatalog();
    const oldMaterials = learningMaterials(before);
    const file = join(temporary, 'easing.md');
    const definition = '缓动描述速度在动画过程中怎样变化，同样时长可以有不同的加速和减速方式。';
    writeFileSync(file, readFileSync(file, 'utf8').replace(glossary.easing.definition, definition));
    const after = readCatalog('src/content/works', 'src/data/taxonomy.json', temporary);
    const materials = learningMaterials(after);
    for (const oldWork of before.works.filter((work) => work.meta.learning)) {
      const work = after.works.find((item) => item.meta.id === oldWork.meta.id)!;
      const changed = Object.values(work.versions.zh!.data.learning!.glossary).some(
        (usage) => usage.term === 'easing',
      );
      assert.equal(sourceRevision(work) !== sourceRevision(oldWork), changed, work.meta.id);
      const capability = materials.capabilities.find((item) => item.id === work.meta.id)!;
      const oldCapability = oldMaterials.capabilities.find((item) => item.id === work.meta.id)!;
      assert.equal(
        capability.contentRevision !== oldCapability.contentRevision,
        changed,
        work.meta.id,
      );
      assert.deepEqual(work.versions, oldWork.versions);
      if (changed) {
        const entry = materials.entries.find((item) => item.id === work.meta.id)!;
        assert.equal(entry.glossary.easing.definition, definition);
        const task = JSON.parse(
          JSON.stringify(
            createTask(entry, { goalId: 'faithful', placement: '测试位置', changes: '' }),
          ),
        );
        assert.equal(task.glossary.easing.definition, definition);
        assert.match(taskText(task), /缓动描述速度/);
        assert.match(taskText(task), /Adrian Punk/);
        assert.match(
          task.glossary.easing.reference,
          /\/blob\/.+\/src\/content\/glossary\/terms\/easing\.md$/,
        );
        assert.ok(
          !('sections' in task.glossary.easing),
          'full dictionary stays out of the detail payload',
        );
      }
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test('all learning entries resolve shared terms and cannot silently fall back to a local definition', () => {
  const catalog = readCatalog();
  const works = catalog.works.filter((work) => work.meta.learning);
  assert.equal(works.length, 51);
  for (const work of works) {
    for (const usage of Object.values(work.versions.zh!.data.learning!.glossary)) {
      assert.ok(glossary[usage.term]);
      assert.ok(usage.context && usage.parameter && usage.judgment);
      assert.ok(!('definition' in usage));
    }
  }
  const copy = structuredClone(catalog);
  const work = copy.works.find((item) => item.meta.id === 'great-ui-accordion')!;
  work.versions.zh!.data.learning!.glossary.easing.term = 'missing-term';
  assert.throws(() => validateCatalog(copy), /great-ui-accordion.*unknown term missing-term/);
  const text = structuredClone(works[0].versions.zh!.data.learning!);
  const first = Object.keys(text.glossary)[0];
  assert.equal(
    learningLanguageSchema.safeParse({
      ...text,
      glossary: { [first]: { ...text.glossary[first], definition: '旧定义' } },
    }).success,
    false,
  );
});
