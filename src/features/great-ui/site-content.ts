import { createHash } from 'node:crypto';
import { readCatalog } from '../../lib/content/catalog.ts';
import type { Catalog, Locale } from '../../lib/content/schema.ts';
import { learningEntry } from './markdown-content.ts';
import { connectWorks } from './relations.mjs';
import { validateCatalog, validateDetail } from './catalog.ts';
import { validateCapabilities } from './composition/validate.ts';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export type LearningMaterial = ReturnType<typeof learningEntry> & {
  family: string;
  principles: string[];
  related: {
    alternatives: { slug: string; title: string }[];
    principles: { slug: string; title: string; shared: string[] }[];
  };
};
export function learningMaterials(
  catalog: Catalog = readCatalog(),
  locale: Locale = 'zh',
  origin?: string,
) {
  const works = catalog.works
    .filter((item) => item.meta.learning && item.versions[locale]?.data.status === 'published')
    // Learning order is independent from Explore order and the collection's cover.
    .sort(
      (a, b) =>
        (a.meta.learning!.sequence ?? a.meta.order) - (b.meta.learning!.sequence ?? b.meta.order),
    );
  const entries: LearningMaterial[] = connectWorks(
    works.map((item) => learningEntry(item, locale, origin)),
    (entry: ReturnType<typeof learningEntry>) =>
      works.find((item) => item.meta.id === entry.id)!.meta.learning!.capability,
  );
  const index = entries.map(
    ({ id, slug, title, english, category, summary, poster, classification }) => ({
      id,
      slug,
      title,
      english,
      category,
      summary,
      poster,
      classification,
    }),
  );
  if (!entries.length) return { entries, index, capabilities: [] };
  validateCatalog(index);
  for (const entry of entries) validateDetail(entry, entry);
  const capabilities = validateCapabilities(
    entries.map((entry) => {
      const capability = works.find((item) => item.meta.id === entry.id)!.meta.learning!.capability;
      return {
        ...capability,
        id: entry.id,
        slug: entry.slug,
        title: entry.title,
        source: entry.source,
        reference: entry.reference,
        sourceReviewed: true,
        browserObserved:
          ['observed', 'observed-with-limit'].includes(
            (entry.verification.browser as { status?: string } | null)?.status || '',
          ) || Boolean(entry.verification.recording),
        sourceRevision: entry.revision,
        contentRevision: digest({
          sections: entry.sections,
          learning: entry.learning,
          glossary: works.find((item) => item.meta.id === entry.id)!.glossary,
          verification: entry.verification,
        }),
        capabilityRevision: digest(capability),
      };
    }),
  );
  return { entries, index, capabilities };
}
