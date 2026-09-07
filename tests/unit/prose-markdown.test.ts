import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { proseProcessor, proseHighlight } from '../../src/lib/markdown/config.ts';
import { articleSections } from '../../src/data/article-sections.ts';

const processor = await createMarkdownProcessor({
  ...proseProcessor.options,
  shikiConfig: proseHighlight,
});
const render = async (source: string) => (await processor.render(source)).code;

test('prose renders nested Markdown, GFM, safe attributes and original heading IDs', async () => {
  const html = await render(
    '## 阅读\n\n:::callout{variant="info" title="A & B"}\n**重点** 与 [来源](https://example.com/)\n\n- 第一项\n- 第二项\n:::\n\n> 普通引用\n\n| A | B |\n| :- | -: |\n| 左 | 右 |',
  );
  assert.match(html, /<h2 id="阅读">/);
  assert.match(html, /class="callout" data-variant="info"/);
  assert.match(html, /A &#x26; B/);
  assert.match(html, /<strong>重点<\/strong>/);
  assert.match(html, /<blockquote class="blockquote">/);
  assert.match(html, /class="prose-table-scroll"/);
  assert.match(html, /align="right"/);
});

test('callout shorthand and all five semantic variants use the matching layout', async () => {
  for (const variant of ['note', 'info', 'tip', 'warning', 'danger']) {
    const html = await render(`> [!${variant.toUpperCase()}]\n> 一段说明。`);
    assert.match(html, new RegExp(`data-variant="${variant}"`));
    assert.doesNotMatch(html, /\[!/);
    assert.match(html, /callout-body-container/);
  }
});

test('code metadata survives highlighting and copy text remains separate from line numbers', async () => {
  const html = await render(
    '```typescript title="file.ts" showLineNumbers\nconst value: number = 1;\n\nconsole.log(value);\n```',
  );
  assert.match(html, /data-code-title="file.ts"/);
  assert.match(html, /class="line-number">3<\/div>/);
  assert.match(html, /class="copy-button"/);
  assert.match(html, /class="astro-code[^"]*shiki/);
  assert.match(html, /--astro-code-token/);
  assert.doesNotMatch(
    html.match(/<code>[\s\S]*?<\/code>/)?.[0] || '',
    /line-number|copy-button|file.ts/,
  );
});

test('groups keep all readable panels, unique accessible IDs and a complete language matrix', async () => {
  const html = await render(
    ':::codegroup{groupId="sample"}\n```typescript title="One"\nconst a: number = 1;\n```\n\n```javascript title="One"\nconst a = 1;\n```\n:::\n\n::::tabs{groupId="sample"}\n:::tab{value="One"}\n第一组\n:::\n:::tab{value="Two"}\n第二组\n:::\n::::',
  );
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 4);
  assert.match(html, /data-sync="sample"/);
  assert.match(html, /data-language-option="javascript"/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.doesNotMatch(html, /role="tabpanel"[^>]*hidden/);
});

test('nested headings do not break the top-level article sections', async () => {
  const html = await render(
    '## 第一章\n\n:::callout{title="补充"}\n## 内部标题\n\n提示内容。\n:::\n\n## 第二章\n\n正文。',
  );
  const sections = articleSections(html);
  assert.equal(sections.length, 2);
  assert.match(sections[0].body, /内部标题/);
  assert.match(sections[1].heading, /第二章/);
});

test('local image dimensions preserve aspect ratio; inline and linked images keep their intended behavior', async () => {
  const html = await render(
    '::image{src="/images/prose/jupiter.jpg" alt="木星" width="400"}\n\n句中 :image{src="/images/prose/inline.svg" alt="图形" width="60"} 图片。\n\n::image{src="/images/prose/jupiter.jpg" alt="链接" href="https://example.com/" height="100"}',
  );
  assert.match(html, /width="400" height="188"/);
  assert.match(html, /data-zoom="false"[^>]*width="60"/);
  assert.match(html, /<a href="https:\/\/example.com\/">/);
  assert.match(html, /height="100"[^>]*width="213"/);
});

test('math is rendered as static accessible markup', async () => {
  const html = await render('公式 $E=mc^2$。\n\n$$\n\\frac{1}{2}\n$$');
  assert.match(html, /class="katex"/);
  assert.match(html, /<math /);
  assert.match(html, /class="katex-display"/);
  assert.doesNotMatch(html, /<script/);
});

test('author errors fail the build instead of producing silently incomplete components', async () => {
  for (const source of [
    '$\\invalidcommand$',
    ':::callout{variant="unknown"}\n内容\n:::',
    '::card{title="Wrong" href="javascript:alert(1)"}',
    '::card{title="Wrong" colour="red"}',
    '::image{src="/../secret.png" alt="错误"}',
    '::::tabs\n:::tab{value="Same"}\n一\n:::\n:::tab{value="Same"}\n二\n:::\n::::',
    ':::codegroup\n```js\nconst a = 1;\n```\n:::',
  ])
    await assert.rejects(render(source));
});

test('showcase covers every documented component family and enumerated visual variant', async () => {
  const html = await render(
    readFileSync('src/content/works/prose-ui-showcase/zh.md', 'utf8').replace(
      /^---[\s\S]*?---\n/,
      '',
    ),
  );
  for (const variant of ['note', 'info', 'tip', 'warning', 'danger'])
    assert.ok((html.match(new RegExp(`data-variant="${variant}"`, 'g')) || []).length >= 2);
  for (const size of ['base', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    assert.match(html, new RegExp(`data-title-size="${size}"`));
  for (const align of ['left', 'right', 'center', 'stretch'])
    assert.match(html, new RegExp(`data-align="${align}"`));
  for (const cls of [
    'subtitle',
    'frame',
    'caption',
    'card',
    'cards',
    'steps',
    'code-block',
    'code-group',
    'tabs',
    'katex',
    'not-prose',
  ])
    assert.match(html, new RegExp(`class="[^"]*\\b${cls}\\b`));
  assert.doesNotMatch(html, />\s*:{3,}/);
  const sections = articleSections(html);
  assert.equal(sections.length, 13);
  assert.match(sections.at(-1)!.heading, /明暗主题/);
  assert.doesNotMatch(sections.at(-2)!.body, /明暗主题/);
});
