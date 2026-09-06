import { getWorks, getBrowsePages } from '../data/works';
import { locales, workPath } from '../lib/i18n/routes.ts';
import { buildSite } from '../config/site.ts';
import { escapeHtml } from '../lib/preview.ts';

export function GET() {
  const { origin } = buildSite();
  const paths = locales.flatMap((locale) => [
    ...getBrowsePages(locale).map((page) => page.path),
    ...getWorks(locale).map((work) => workPath(locale, work.slug)),
  ]);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escapeHtml(origin + path)}</loc></url>`).join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
