import assert from 'node:assert/strict';
import { test } from 'node:test';
import { articleSections } from '../../src/data/article-sections.ts';

// 验证章节切分保留导言、子标题、表格、来源和最后一节。
test('sections preserve complete compiled content and heading anchors', () => {
  const intro = '<p>导言</p>';
  const first = '<h2 id="one">总览 <em>AI</em></h2>';
  const body = '<h3>子标题</h3><table><tr><td>数据</td></tr></table>';
  const last = '<h2 id="sources">来源</h2>';
  const source = '<p><a href="https://example.com">引用</a></p>';
  assert.deepEqual(articleSections(intro + first + body + last + source), [
    { heading: '', body: intro },
    { heading: first, body },
    { heading: last, body: source },
  ]);
});
// 没有章节的文章与转义代码不能被当作标题丢失。
test('unsectioned content and escaped code remain intact', () => {
  const html = '<pre><code>&lt;h2&gt;Example&lt;/h2&gt;</code></pre>';
  assert.deepEqual(articleSections(html), [{ heading: '', body: html }]);
});
