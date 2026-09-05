import entries from './works.json';

export const formats = { all: '全部', code: '代码', paper: '论文', website: '网站', video: '视频', audio: '音频', article: '文章' } as const;
export type Format = Exclude<keyof typeof formats, 'all'>;
export interface Work {
  slug: string; title: string; type: Format; creator: string; url: string;
  summary: string; description: string; preview: string; eyebrow: string;
  display: string; note: string; color: string;
}
const slugs = new Set<string>();
for (const item of entries) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) || slugs.has(item.slug)) throw new Error(`Invalid or duplicate slug: ${item.slug}`);
  if (!(item.type in formats) || item.type === 'all' || !item.description || !item.summary || !item.title) throw new Error(`Incomplete content: ${item.slug}`);
  if (new URL(item.url).protocol !== 'https:') throw new Error(`Expected HTTPS source: ${item.slug}`);
  slugs.add(item.slug);
}
export const works = entries as Work[];
export const workPath = (slug: string) => `/works/${slug}/`;
