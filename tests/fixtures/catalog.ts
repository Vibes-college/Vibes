import { migrateEntries, type LegacyWork } from '../../scripts/migrate-content.ts';
import { sourceRevision } from '../../src/lib/content/revision.ts';

export function catalogFixture(count = 2) {
  const entries: LegacyWork[] = Array.from({ length: count }, (_, order) => ({
    slug: `work-${order}`,
    title: 'Same title',
    type: 'paper',
    creator: 'Example Author',
    url: 'https://example.org/',
    summary: '摘要',
    description: '说明',
    preview: 'paper',
    color: '#fff',
    eyebrow: 'Paper',
    display: 'Display',
    note: 'Topic',
  }));
  return migrateEntries(
    entries,
    Object.fromEntries(entries.map((entry) => [entry.slug, '## 原文\n原创正文。'])),
  );
}
export function bilingualFixture() {
  const catalog = catalogFixture();
  for (const work of catalog.works) {
    work.versions.en = {
      file: `${work.meta.id}/en.md`,
      body: '## Translation\nReviewed example.',
      data: {
        ...work.versions.zh!.data,
        locale: 'en',
        title: 'Same title',
        summary: 'Summary',
        description: 'Description',
        sourceRevision: sourceRevision(work),
      },
    };
  }
  return catalog;
}
