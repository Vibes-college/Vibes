import { unified, type RehypePlugin, type RemarkPlugin } from '@astrojs/markdown-remark';
import { safeUrl, walk, type Node } from '../../lib/markdown/tree.ts';
import type { learningEntry } from './markdown-content.ts';

export interface ProseNode {
  tag?: string;
  text?: string;
  href?: string;
  start?: number;
  children?: ProseNode[];
}
const tags = new Set([
  'p',
  'strong',
  'em',
  'del',
  'a',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'blockquote',
  'br',
  'hr',
  'h4',
  'h5',
  'h6',
]);
const rejectHtml: RemarkPlugin = () => (tree) => {
  walk(tree as Node, (node) => {
    if (node.type === 'html') throw new Error('Learning Markdown does not allow raw HTML');
  });
};
function project(node: Node): ProseNode {
  if (node.type === 'text') return { text: node.value || '' };
  if (!node.tagName || !tags.has(node.tagName))
    throw new Error(`Unsupported learning Markdown element: ${node.tagName || node.type}`);
  return {
    tag: node.tagName,
    ...(node.tagName === 'a' ? { href: safeUrl(String(node.properties?.href || '')) } : {}),
    ...(node.tagName === 'ol' && node.properties?.start
      ? { start: Number(node.properties.start) }
      : {}),
    children: (node.children || []).map(project),
  };
}
const collectTree: RehypePlugin = () => (tree, file) => {
  if (!file.data.astro?.frontmatter) throw new Error('Missing Markdown compilation context');
  file.data.astro.frontmatter.learningNodes = tree.children.map((node) => project(node as Node));
};
const renderer = unified({
  smartypants: false,
  remarkPlugins: [rejectHtml],
  rehypePlugins: [collectTree],
}).createRenderer({ syntaxHighlight: false });

// Compile only at build time. The browser renders this small, escaped tree with
// React, keeping term buttons interactive without shipping a Markdown parser.
export async function compileProse<T extends ReturnType<typeof learningEntry>>(entry: T) {
  const texts = [
    ...entry.sections.map((section) => section.text),
    entry.suitable,
    entry.avoid,
    entry.learning.practice,
    entry.learning.useIntro,
    entry.learning.combinationIntro,
  ];
  const processor = await renderer;
  const prose: Record<string, ProseNode[]> = {};
  for (const text of texts) {
    const result = await processor.render(text, { frontmatter: {} });
    prose[text] = result.metadata.frontmatter.learningNodes;
  }
  return { ...entry, prose };
}
