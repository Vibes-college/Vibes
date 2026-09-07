import { unified, type ShikiConfig } from '@astrojs/markdown-remark';
import rehypeArticleSections from './rehype-article-sections.ts';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkProse from './remark-prose.ts';
import rehypeProse from './rehype-prose.ts';
import rehypeImageSize from './rehype-image-size.ts';

export const proseProcessor = unified({
  remarkPlugins: [remarkDirective, remarkMath, remarkProse],
  rehypePlugins: [
    [rehypeKatex, { throwOnError: true, strict: 'error' }],
    rehypeProse,
    rehypeImageSize,
    rehypeArticleSections,
  ],
});
export const proseHighlight: ShikiConfig = {
  theme: 'css-variables',
  transformers: [
    {
      pre(node) {
        const meta = this.options.meta?.__raw ?? '';
        const title = meta.match(/title=(?:"([^"]*)"|'([^']*)')/);
        node.properties['data-code-title'] = title?.[1] ?? title?.[2] ?? '';
        node.properties['data-code-language'] = this.options.lang;
        node.properties['data-code-lines'] = /\bshowLineNumbers\b/.test(meta) ? 'true' : 'false';
        node.properties.class = `${node.properties.class ?? ''} shiki`;
      },
    },
  ],
};
