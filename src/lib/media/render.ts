import { escapeHtml } from '../escape.ts';
import type { CardWork as BaseCardWork } from '../work-card.ts';
import { workPath, type Locale } from '../i18n/routes.ts';
import { parseCard, type CardImage, type CardMedia } from './card.ts';

import { mediaMessages, timeLabel } from './messages.ts';
export { mediaMessages, timeLabel } from './messages.ts';
export function imageHtml(
  image: CardImage,
  options: { lazy?: boolean; deferred?: boolean; fit?: string } = {},
) {
  const attr = options.deferred ? 'data-src' : 'src';
  const srcset = image.variants.map((v) => `${v.src} ${v.width}w`).join(', ');
  return `<img ${attr}="${escapeHtml(image.src)}" ${srcset ? `${options.deferred ? 'data-srcset' : 'srcset'}="${escapeHtml(srcset)}" sizes="(max-width: 560px) 45vw, 360px"` : ''} width="${image.width}" height="${image.height}" alt="${escapeHtml(image.alt)}" ${options.lazy === false ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" style="object-fit:${options.fit === 'contain' ? 'contain' : 'cover'};object-position:${image.focalPoint[0] * 100}% ${image.focalPoint[1] * 100}%" data-media-image>`;
}
export function waveformHtml(values: number[]) {
  if (!values.length) return '';
  return `<svg class="media-waveform" viewBox="0 0 ${values.length * 3} 50" aria-hidden="true">${values.map((height, index) => `<path d="M${index * 3 + 1} ${25 - height * 23}v${Math.max(1, height * 46)}"/>`).join('')}</svg>`;
}
interface CardWork extends Pick<BaseCardWork, 'slug' | 'type' | 'title' | 'summary'> {
  mediaCard?: CardMedia;
}
export function workCardHtml(work: CardWork, locale: Locale, tag: 'li' | 'div' = 'li'): string {
  const path = workPath(locale, work.slug);
  const label = `Explore ${work.title}`;
  const attributes = `class="card-link" href="${path}" data-work="${escapeHtml(work.slug)}" aria-label="${escapeHtml(label)}"`;
  const summary = `<p class="card-summary">${escapeHtml(work.summary)}</p>`;
  if (!work.mediaCard) throw new Error('Expected media card');
  if (work.mediaCard.collection) return collectionHtml(work, locale);
  const card = parseCard(JSON.stringify(work.mediaCard));
  const t = mediaMessages[locale];
  const dynamic = ['video', 'audio', 'animation'].includes(card.kind);
  const experience =
    card.kind === 'embed'
      ? JSON.stringify({ item: { kind: 'embed', ...card.embed }, text: { title: work.title } })
      : '';
  const embedControls = experience
    ? `<button type="button" class="media-toggle" data-media-launch aria-label="${card.embed?.provider === 'spotify' ? t.listen : t.play}">${card.embed?.provider === 'spotify' ? t.listen : t.play}</button><div class="media-experience" data-media-mount hidden></div><button type="button" class="media-exit" data-media-exit hidden>${t.exit}</button>`
    : '';
  const element =
    card.kind === 'video'
      ? `<video muted playsinline loop preload="none" tabindex="-1" aria-hidden="true" style="object-fit:${card.fit};object-position:${card.poster.focalPoint[0] * 100}% ${card.poster.focalPoint[1] * 100}%"></video>`
      : card.kind === 'audio'
        ? '<audio preload="none"></audio>'
        : '';
  return `<${tag} class="${tag === 'li' ? 'work-card work-card--media' : 'collection-frame'}" data-type="${escapeHtml(work.type)}" data-media-root data-context="card" data-kind="${card.kind}" ${experience ? `data-experience="${escapeHtml(experience)}" data-provider="${card.embed?.provider}"` : ''} data-locale="${locale}" data-sources="${escapeHtml(JSON.stringify(card.sources))}" data-fallback="${escapeHtml(card.fallback.src)}" data-poster="${escapeHtml(card.poster.src)}" ${dynamic && card.kind !== 'audio' && tag === 'li' ? 'data-auto' : ''}><div class="preview media-stage"><a ${attributes}>${imageHtml(card.poster, { fit: card.fit })}</a>${element}${embedControls}${card.kind === 'audio' ? waveformHtml(card.waveform) : ''}${dynamic ? `<button type="button" class="media-toggle" data-media-toggle aria-label="${card.kind === 'audio' ? t.listen : t.play}" aria-pressed="false">${card.kind === 'audio' ? t.listen : t.play}</button>` : ''}${card.duration ? `<span class="media-duration">${card.totalDuration ? `${t.total} ${timeLabel(card.totalDuration)} · ` : ''}${timeLabel(card.duration)}</span>` : ''}<span class="media-status" data-media-status role="status"></span></div>${tag === 'li' ? `<a href="${path}" class="media-summary-link">${summary}</a>` : ''}</${tag}>`;
}

export function collectionHtml(work: CardWork, locale: Locale, detail = false) {
  const { collection: c, ...card } = parseCard(JSON.stringify(work.mediaCard));
  if (!c) throw new Error('Missing collection');
  const first = c.items[0];
  const tag = detail ? 'div' : 'li';
  const button = (direction: number) =>
    `<button type="button" data-collection-step="${direction}" aria-label="${direction < 0 ? '上一个预览' : '下一个预览'}" disabled><img src="/icons/chevron-down.svg" width="16" height="16" alt=""></button>`;
  return `<${tag} class="${detail ? 'detail-preview collection-cover' : 'work-card work-card--collection'}" data-type="${escapeHtml(work.type)}" data-collection="${escapeHtml(JSON.stringify(c))}" data-locale="${locale}"><span class="collection-badge">合集 · ${c.count} 件</span>${workCardHtml({ ...work, slug: first.id, title: first.title, mediaCard: card }, locale, 'div')}<nav class="collection-controls" aria-label="合集预览">${button(-1)}<a data-collection-current href="${workPath(locale, first.id)}">${escapeHtml(first.title)}</a><span data-collection-position>1/${c.items.length}</span>${button(1)}</nav>${detail ? '' : `<a class="media-summary-link" href="${workPath(locale, work.slug)}" data-work="${escapeHtml(work.slug)}" aria-label="Explore ${escapeHtml(work.title)}"><p class="card-summary">${escapeHtml(work.title)}</p></a>`}</${tag}>`;
}
