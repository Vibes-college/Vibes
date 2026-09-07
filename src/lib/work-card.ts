import { escapeHtml, previewHtml, type PreviewData } from './preview.ts';
import { workPath, type Locale } from './i18n/routes.ts';
export interface CardWork extends PreviewData {
  slug: string;
  type: string;
  title: string;
  summary: string;
}
export function legacyCardHtml(work: CardWork, locale: Locale) {
  const label = `Explore ${work.title}`;
  return `<li class="work-card" data-type="${escapeHtml(work.type)}"><a class="card-link" href="${workPath(locale, work.slug)}" data-work="${escapeHtml(work.slug)}" aria-label="${escapeHtml(label)}">${previewHtml(work)}<p class="card-summary">${escapeHtml(work.summary)}</p></a></li>`;
}
