import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readCatalog } from '../../src/lib/content/catalog.ts';

// 实际内容从独立文件读取，原文与已发布译文均具有完整正文和安全来源。
test('every work has a unique route, article, and HTTPS source', () => {
  const catalog = readCatalog();
  assert.ok(catalog.works.length > 0);
  for (const work of catalog.works) {
    assert.equal(new URL(work.meta.sourceUrl).protocol, 'https:');
    assert.ok(work.versions[work.meta.originalLocale]?.body.trim());
    for (const version of Object.values(work.versions)) {
      assert.ok(version.data.title && version.data.summary && version.data.description);
      assert.ok(version.body.length > 0);
    }
  }
});

// Read real schema-valid content through the same CLI/Astro loader, without mutating it.
test('catalog accepts MDX, preserves revisions and rejects duplicate language variants', async () => {
  const { mkdtempSync, cpSync, renameSync, rmSync, readFileSync, writeFileSync } =
    await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const { sourceRevision } = await import('../../src/lib/content/revision.ts');
  const root = mkdtempSync(join(tmpdir(), 'vibes-mdx-'));
  try {
    const folder = join(root, 'prose-ui-showcase');
    cpSync('src/content/works/prose-ui-showcase', folder, { recursive: true });
    const taxonomy = resolve('src/data/taxonomy.json');
    const original = readCatalog(root, taxonomy).works[0];
    renameSync(join(folder, 'zh.md'), join(folder, 'zh.mdx'));
    const mdx = readCatalog(root, taxonomy).works[0];
    assert.equal(sourceRevision(mdx), sourceRevision(original));
    assert.equal(mdx.versions.zh?.body, original.versions.zh?.body);
    writeFileSync(join(folder, 'zh.md'), readFileSync(join(folder, 'zh.mdx')));
    assert.throws(() => readCatalog(root, taxonomy), /duplicate article for zh/);
    rmSync(join(folder, 'zh.md'));
    writeFileSync(join(folder, 'en.mdx'), readFileSync(join(folder, 'zh.mdx')));
    assert.throws(() => readCatalog(root, taxonomy), /locale must match filename/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
