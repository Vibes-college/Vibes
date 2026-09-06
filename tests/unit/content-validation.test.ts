import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateCatalog } from '../../src/lib/content/validate.ts';
import { languageSchema, workSchema } from '../../src/lib/content/schema.ts';
import { readCatalog } from '../../src/lib/content/catalog.ts';
import { migrateEntries } from '../../scripts/migrate-content.ts';
import { sourceRevision, needsReview } from '../../src/lib/content/revision.ts';
import type { LegacyWork } from '../../scripts/migrate-content.ts';

const entry: LegacyWork = {
  slug: 'example',
  title: 'Title',
  type: 'paper',
  creator: 'A',
  url: 'https://example.org/',
  summary: 'Summary',
  description: 'Description',
  preview: 'paper',
  eyebrow: 'Paper',
  display: 'Display',
  note: 'Note',
  color: '#ffffff',
};
function fixture() {
  return migrateEntries([entry, { ...entry, slug: 'second' }], {
    example: '---\nreadingTitle: Title\n---\n## 正文\nContent',
    second: '## Second\nContent',
  });
}

test('migration preserves identity, order, all preview and content fields and Markdown body', () => {
  const catalog = fixture();
  assert.deepEqual(
    catalog.works.map((work) => [work.meta.id, work.meta.order]),
    [
      ['example', 0],
      ['second', 1],
    ],
  );
  const work = catalog.works[0];
  assert.equal(work.versions.zh?.body, '\n## 正文\nContent');
  assert.deepEqual(work.versions.zh?.data.previewText, {
    eyebrow: 'Paper',
    display: 'Display',
    note: 'Note',
  });
  assert.equal(work.meta.sourceUrl, entry.url);
  assert.equal(work.versions.zh?.data.title, entry.title);
  assert.equal(work.versions.zh?.data.summary, entry.summary);
  assert.equal(work.versions.zh?.data.description, entry.description);
  assert.equal(work.versions.en, undefined);
  assert.equal(catalog.taxonomy.filter((tag) => tag.kind === 'creator').length, 1);
});

test('catalog rejects duplicate identities, order, alias collisions and absent references', () => {
  for (const mutate of [
    (c: ReturnType<typeof fixture>) => {
      c.works[1].meta.id = 'example';
    },
    (c: ReturnType<typeof fixture>) => {
      c.works[1].meta.order = 0;
    },
    (c: ReturnType<typeof fixture>) => {
      c.works[0].meta.typeId = 'missing';
    },
    (c: ReturnType<typeof fixture>) => {
      c.works[0].meta.tagIds = ['missing'];
    },
    (c: ReturnType<typeof fixture>) => {
      delete c.works[0].versions.zh;
    },
    (c: ReturnType<typeof fixture>) => {
      c.taxonomy[0].aliases.en.push('Papers');
    },
  ]) {
    const catalog = fixture();
    mutate(catalog);
    assert.throws(() => validateCatalog(catalog));
  }
  const meta = fixture().works[0].meta;
  assert.equal(workSchema.safeParse({ ...meta, sourceUrl: 'javascript:alert(1)' }).success, false);
  assert.equal(
    workSchema.safeParse({ ...meta, preview: { ...meta.preview, color: 'red;display:none' } })
      .success,
    false,
  );
  assert.equal(
    languageSchema.safeParse({ ...fixture().works[0].versions.zh!.data, locale: 'fr' }).success,
    false,
  );
});

test('published translation requires a published original and explicit revision, stale translations remain available', () => {
  const c = fixture();
  const work = c.works[0];
  work.versions.en = {
    ...structuredClone(work.versions.zh!),
    data: { ...work.versions.zh!.data, locale: 'en' },
  };
  assert.throws(() => validateCatalog(c), /sourceRevision/);
  work.versions.en.data.sourceRevision = sourceRevision(work);
  assert.doesNotThrow(() => validateCatalog(c));
  assert.equal(needsReview(work, 'en'), false);
  work.versions.zh!.body += '\nUpdated original';
  assert.equal(needsReview(work, 'en'), true);
  assert.doesNotThrow(() => validateCatalog(c));
  work.versions.zh!.data.status = 'draft';
  assert.throws(() => validateCatalog(c), /before original/);
});

test('file identity and unknown language failures identify the actual file', () => {
  const root = mkdtempSync(join(tmpdir(), 'vibes-content-'));
  try {
    const c = fixture();
    const directory = join(root, 'works', 'example');
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(root, 'taxonomy.json'), JSON.stringify(c.taxonomy));
    writeFileSync(
      join(directory, 'work.json'),
      JSON.stringify({ ...c.works[0].meta, id: 'other' }),
    );
    assert.throws(
      () => readCatalog(join(root, 'works'), join(root, 'taxonomy.json')),
      /work.json.*match directory/,
    );
    writeFileSync(join(directory, 'work.json'), JSON.stringify(c.works[0].meta));
    writeFileSync(join(directory, 'fr.md'), '# Unknown');
    assert.throws(
      () => readCatalog(join(root, 'works'), join(root, 'taxonomy.json')),
      /fr.md.*unsupported/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
