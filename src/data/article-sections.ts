export interface ArticleSection {
  heading: string;
  body: string;
}

// 按编译后的二级标题切分本地可信 Markdown，保留表格、来源及原有标题锚点。
export function articleSections(html: string): ArticleSection[] {
  const sections: ArticleSection[] = [];
  const headings = [...html.matchAll(/<h2(?:\s[^>]*)?>[\s\S]*?<\/h2>/g)];
  if (!headings.length) return [{ heading: '', body: html }];
  const intro = html.slice(0, headings[0].index);
  if (intro.trim()) sections.push({ heading: '', body: intro });
  headings.forEach((heading, index) => {
    sections.push({
      heading: heading[0],
      body: html.slice(
        heading.index! + heading[0].length,
        headings[index + 1]?.index ?? html.length,
      ),
    });
  });
  return sections;
}
