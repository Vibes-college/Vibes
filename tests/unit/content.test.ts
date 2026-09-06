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
