import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import { element, plain, walk, type Node } from './tree.ts';

interface ArticleFile {
  history: string[];
  data: { astro?: { frontmatter?: Record<string, unknown> } };
}

// Keep JSX intact so Astro can still discover renderer imports and client directives.
export default function rehypeArticleSections() {
  return (input: unknown, file: ArticleFile) => {
    if (!file.history[0]?.endsWith('.mdx')) return;
    const tree = input as Node;
    // Public Astro slugging runs before we move headings away from the root.
    const assignIds = rehypeHeadingIds() as (tree: unknown, file: ArticleFile) => void;
    assignIds(tree, file);
    const headings: { id: string; title: string }[] = [];
    const anchors: string[] = [];
    walk(tree, (node) => {
      if (typeof node.properties?.id === 'string') anchors.push(node.properties.id);
    });
    const children: Node[] = [];
    let body: Node[] = children;
    for (const node of tree.children ?? []) {
      // Astro's metadata analyzer only scans root ESM for imported components.
      if (node.type === 'mdxjsEsm') {
        children.push(node);
      } else if (node.type === 'element' && node.tagName === 'h2') {
        walk(node, (child) => {
          if (child.type === 'mdxTextExpression' || child.type === 'mdxJsxTextElement')
            throw new Error('Article ## headings must use static Markdown text and formatting.');
        });
        headings.push({ id: String(node.properties?.id), title: plain(node) });
        body = [];
        children.push(
          element('section', 'reading-section', [node, element('div', 'section-content', body)]),
        );
      } else {
        body.push(node);
      }
    }
    tree.children = children;
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.articleHeadings = headings;
    file.data.astro.frontmatter.articleAnchors = anchors;
  };
}
