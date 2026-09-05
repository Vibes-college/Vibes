import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';

// 验证每张卡片都有唯一地址、完整文章和安全的来源网址。
test('every work has a unique route, article, and HTTPS source', () => {
  const works = JSON.parse(readFileSync('src/data/works.json', 'utf8'));
  assert.ok(works.length > 0);
  const slugs = new Set();
  for (const work of works) {
    assert.match(work.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!slugs.has(work.slug), `重复地址：${work.slug}`);
    slugs.add(work.slug);
    assert.equal(new URL(work.url).protocol, 'https:');
    assert.ok(work.title && work.summary && work.description);
    assert.ok(existsSync(`src/content/articles/${work.slug}.md`), `缺少文章：${work.slug}`);
  }
});
