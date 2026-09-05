import entries from './works.json';

export const formats = { all: 'All', code: 'Code', paper: 'Papers', website: 'Websites', video: 'Video', audio: 'Audio', article: 'Reading' } as const;
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
