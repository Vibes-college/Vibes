import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseDocument, type Document } from '../../scripts/docs-frontmatter.ts';
import {
  isImplementation,
  sourceRevisions,
  validateLivingLinks,
} from '../../scripts/docs-sources.ts';

// 最小现状说明用于测试源码变动、重命名和路径覆盖，不读取真实工作区。
function doc(entries: string[], revision = 'pending', body = '# Current\n'): Document {
  return parseDocument(
    'docs/features/flow.md',
    `---\ntense: 'living'\ndescribes: 'Flow'\nstatus: 'current'\nshaped-by: []\ncode-sources: ${JSON.stringify(entries)}\ncode-revision: '${revision}'\n---\n${body}`,
  );
}

// 源码变化不能靠旧摘要通过；只读计算不改说明，新摘要要求维护者先复核。
test('source revisions detect changed bytes, additions and renames', () => {
  const source = new Map([['src/a.ts', Buffer.from('export const value = 1;')]]);
  const original = doc(['src/']);
  const docs = new Map([[original.path, original]]);
  const initial = sourceRevisions(docs, source, false).get(original.path)!;
  assert.equal(original.meta['code-revision'], 'pending');
  assert.throws(() => sourceRevisions(docs, source), /尚未复核/);
  docs.set(original.path, doc(['src/'], initial));
  assert.doesNotThrow(() => sourceRevisions(docs, source));
  source.set('src/a.ts', Buffer.from('export const value = 2;'));
  assert.throws(() => sourceRevisions(docs, source), /源码已变化/);
  source.set('src/a.ts', Buffer.from('export const value = 1;'));
  source.set('src/b.ts', Buffer.from('export {};'));
  assert.throws(() => sourceRevisions(docs, source), /源码已变化/);
  source.delete('src/b.ts');
  source.set('src/renamed.ts', source.get('src/a.ts')!);
  source.delete('src/a.ts');
  assert.throws(() => sourceRevisions(docs, source), /源码已变化/);
  docs.set(original.path, doc(['src/a.ts'], initial));
  assert.throws(() => sourceRevisions(docs, source), /源码路径不存在/);
});

// 路径覆盖是独立要求；目录边界、缺映射和越界引用不能自动得到豁免。
test('source inventories reject missing mappings, unsafe paths and removed bindings', () => {
  const source = new Map([
    ['src/a.ts', Buffer.from('a')],
    ['scripts/build.ts', Buffer.from('b')],
  ]);
  for (const entries of [['src/a.ts'], ['src/a'], ['../src/'], ['/src/'], ['src\\a.ts'], []]) {
    const page = doc(entries);
    assert.throws(
      () => sourceRevisions(new Map([[page.path, page]]), source, false),
      /缺少对应|不存在|无效|不能为空/,
    );
  }
  const missing = parseDocument(
    'docs/features/flow.md',
    "---\ntense: 'living'\ndescribes: 'Flow'\nstatus: 'current'\nshaped-by: []\n---\n",
  );
  assert.throws(() => sourceRevisions(new Map([[missing.path, missing]]), source), /code-sources/);
  const page = doc(['src/', 'scripts/']);
  assert.equal(sourceRevisions(new Map([[page.path, page]]), source, false).size, 1);
});

// 数据内容日更不触发架构摘要，行为代码、测试和配置仍需要对应说明。
test('implementation scope separates content entries from behavior and configuration', () => {
  for (const path of [
    'src/pages/index.astro',
    'src/lib/a.ts',
    'tests/unit/a.test.ts',
    'db/migrations/a.sql',
    'package-lock.json',
    '.github/workflows/check.yml',
    'public/_headers',
    'third_party/paseo-webui/upstream.json',
    'third_party/paseo-webui/patches/0001-host.patch',
  ])
    assert.equal(isImplementation(path), true, path);
  for (const path of [
    'src/content/works/a/zh.md',
    'src/content/works/a/work.json',
    'docs/PROJECT_ANALYSIS.md',
    '.claude/settings.local.json',
  ])
    assert.equal(isImplementation(path), false, path);
});

// 现状文档不能保留已失效入口；远端链接不抓取，历史正文仍可保留当时路径。
test('living links reject deleted local documents without rewriting frozen references', () => {
  const page = doc(
    ['src/'],
    'pending',
    '[data](../system/data.md)\n[external](https://example.com)\n[section](#read)\n',
  );
  const docs = new Map([[page.path, page]]);
  assert.doesNotThrow(() => validateLivingLinks(docs, ['docs/system/data.md']));
  assert.throws(() => validateLivingLinks(docs, []), /本地链接不存在/);
  docs.set(page.path, { ...page, meta: { ...page.meta, tense: 'frozen' } });
  assert.doesNotThrow(() => validateLivingLinks(docs, []));
});
