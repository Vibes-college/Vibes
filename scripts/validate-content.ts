import { readCatalog } from '../src/lib/content/catalog.ts';
import { sourceRevision, needsReview } from '../src/lib/content/revision.ts';
import { locales } from '../src/lib/i18n/routes.ts';

const [action = 'validate', id, ...extra] = process.argv.slice(2);
if (extra.length || !['validate', 'revision'].includes(action) || (action === 'validate' && id))
  throw new Error('Usage: content:validate | content:revision -- <work-id>');
const catalog = readCatalog();
if (action === 'revision') {
  const work = catalog.works.find((work) => work.meta.id === id);
  if (!work) throw new Error(`Unknown work id: ${id || '(missing)'}`);
  console.log(
    JSON.stringify(
      {
        id,
        sourceRevision: sourceRevision(work),
        versions: locales.map((locale) => ({
          locale,
          status: work.versions[locale]?.data.status || 'missing',
          needsReview: needsReview(work, locale),
        })),
      },
      null,
      2,
    ),
  );
} else {
  console.log(
    `Content valid: ${catalog.works.length} works; ${locales.map((locale) => `${locale}: ${catalog.works.filter((work) => work.versions[locale]?.data.status === 'published').length} published`).join(', ')}`,
  );
}
