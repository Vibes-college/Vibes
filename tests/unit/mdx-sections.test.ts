import assert from 'node:assert/strict';
import { test } from 'node:test';
import sections from '../../src/lib/markdown/rehype-article-sections.ts';
import { element, text, type Node } from '../../src/lib/markdown/tree.ts';

function file() {
  return {
    history: ['article.mdx'],
    data: { astro: { frontmatter: {} as Record<string, unknown> } },
  };
}

test('MDX sections retain imports, JSX identity, introduction and nested headings', () => {
  const esm: Node = {
    type: 'mdxjsEsm',
    value: "import Demo from './Demo'",
    data: { estree: { body: [] } },
  };
  const jsx: Node = { type: 'mdxJsxFlowElement', name: 'Demo', data: { opaque: true } };
  const nested = element('div', '', [
    element('h2', '', [text('Nested')], { 'data-prose-nested': 'true' }),
  ]);
  const tree: Node = {
    type: 'root',
    children: [
      element('p', '', [text('Intro')]),
      element('h2', '', [text('A title')]),
      jsx,
      esm,
      nested,
      element('h2', '', [text('A title')]),
      element('p', '', [text('End')]),
    ],
  };
  const info = file();
  sections()(tree, info);
  assert.equal(tree.children![2], esm, 'imports stay at root even after a heading');
  const first = tree.children![1];
  assert.equal(first.tagName, 'section');
  assert.equal(first.children![1].children![0], jsx, 'JSX metadata is not copied or serialized');
  assert.equal(first.children![1].children![1], nested);
  assert.deepEqual(info.data.astro.frontmatter.articleHeadings, [
    { id: 'a-title', title: 'A title' },
    { id: 'a-title-1', title: 'A title' },
  ]);
  assert.deepEqual(info.data.astro.frontmatter.articleAnchors, ['a-title', 'nested', 'a-title-1']);
});

test('ordinary Markdown is unchanged; MDX without headings stays readable', () => {
  const tree: Node = { type: 'root', children: [element('h2', '', [text('Title')])] };
  const before = structuredClone(tree);
  sections()(tree, { history: ['article.md'], data: {} });
  assert.deepEqual(tree, before);
  const introduction: Node = { type: 'root', children: [element('p', '', [text('Only text')])] };
  const info = file();
  sections()(introduction, info);
  assert.equal(introduction.children![0].tagName, 'p');
  assert.deepEqual(info.data.astro.frontmatter.articleHeadings, []);
});

test('dynamic chapter headings fail instead of producing unstable navigation', () => {
  const tree: Node = {
    type: 'root',
    children: [element('h2', '', [{ type: 'mdxTextExpression', value: 'title' }])],
  };
  assert.throws(() => sections()(tree, file()), /must use static Markdown/);
});
