import { isMediaUrl, mediaLimits, embedUrl, type EmbedProvider } from '../../config/media.ts';
import type { Media, MediaText, Presentation, ImageMedia } from './schema.ts';

export interface CardImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  variants: { src: string; width: number }[];
  focalPoint: [number, number];
}
export interface CardMedia {
  kind: 'image' | 'video' | 'audio' | 'animation' | 'embed';
  embed?: { provider: EmbedProvider; resourceId: string };
  poster: CardImage;
  fallback: CardImage;
  sources: { src: string; type: string }[];
  duration: number;
  totalDuration?: number;
  waveform: number[];
  fit: 'cover' | 'contain';
}
export function imageView(image: ImageMedia, text: MediaText): CardImage {
  return {
    src: image.src,
    width: image.width,
    height: image.height,
    alt: text[image.id]?.alt || text[image.id]?.title || '',
    variants: image.variants.map(({ src, width }) => ({ src, width })),
    focalPoint: image.focalPoint,
  };
}
export function projectCard(
  media: Media[],
  presentation: Presentation | undefined,
  text: MediaText,
): CardMedia | undefined {
  if (!presentation) return undefined;
  const item = media.find((item) => item.id === presentation.card.mediaId)!;
  const posterId =
    item.kind === 'audio'
      ? item.artworkId
      : item.kind === 'image' && !item.animated
        ? item.id
        : 'posterId' in item
          ? item.posterId
          : presentation.fallbackId;
  const poster = media.find((item) => item.id === posterId) as ImageMedia;
  const fallback = media.find((item) => item.id === presentation.fallbackId) as ImageMedia;
  const timed = item.kind === 'video' || item.kind === 'audio';
  const fullAudio =
    item.kind === 'audio'
      ? media.find(
          (asset) => asset.kind === 'audio' && presentation.detail.items.includes(asset.id),
        )
      : undefined;
  return {
    kind:
      item.kind === 'image'
        ? item.animated
          ? 'animation'
          : 'image'
        : (item.kind as 'video' | 'audio' | 'embed'),
    ...(item.kind === 'embed'
      ? { embed: { provider: item.provider, resourceId: item.resourceId } }
      : {}),
    poster: imageView(poster, text),
    fallback: imageView(fallback, text),
    sources: timed
      ? item.sources.map(({ src, type }) => ({ src, type }))
      : item.kind === 'image' && item.animated
        ? [{ src: item.src, type: 'image/webp' }]
        : [],
    duration: timed ? item.duration : 0,
    ...(fullAudio?.kind === 'audio' ? { totalDuration: fullAudio.duration } : {}),
    waveform: item.kind === 'audio' ? item.waveform : [],
    fit: presentation.card.fit,
  };
}

// Search metadata is untrusted at the DOM boundary. Validate its small projection,
// never ship the full content/Zod schemas or complete media sources to a card.
export function parseCard(value: string): CardMedia {
  const card = JSON.parse(value) as CardMedia;
  const finite = (n: unknown, min: number, max: number) =>
    typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
  function image(image: CardImage) {
    if (
      !image ||
      typeof image.src !== 'string' ||
      !isMediaUrl(image.src) ||
      typeof image.alt !== 'string' ||
      !finite(image.width, 1, 20000) ||
      !finite(image.height, 1, 20000) ||
      !Array.isArray(image.variants) ||
      image.variants.length > 8 ||
      image.variants.some(
        (v) => !v || typeof v.src !== 'string' || !isMediaUrl(v.src) || !finite(v.width, 1, 20000),
      ) ||
      !Array.isArray(image.focalPoint) ||
      image.focalPoint.length !== 2 ||
      image.focalPoint.some((n) => !finite(n, 0, 1))
    )
      throw new Error('Invalid card image');
  }
  if (
    !card ||
    !['image', 'video', 'audio', 'animation', 'embed'].includes(card.kind) ||
    !['cover', 'contain'].includes(card.fit) ||
    !finite(
      card.duration,
      0,
      card.kind === 'audio' ? mediaLimits.sampleSeconds : mediaLimits.cardVideoSeconds,
    ) ||
    (card.totalDuration !== undefined && !finite(card.totalDuration, 0, 86400)) ||
    !Array.isArray(card.sources) ||
    card.sources.length > 4 ||
    card.sources.some(
      (s) =>
        !s ||
        typeof s.src !== 'string' ||
        !isMediaUrl(s.src) ||
        ![
          'video/mp4',
          'video/webm',
          'audio/mpeg',
          'audio/mp4',
          'audio/ogg',
          'audio/wav',
          'image/webp',
        ].includes(s.type),
    ) ||
    !Array.isArray(card.waveform) ||
    card.waveform.length > 200 ||
    card.waveform.some((n) => !finite(n, 0, 1))
  )
    throw new Error('Invalid card media');
  if (card.kind === 'embed') {
    if (!card.embed) throw new Error('Missing embed');
    embedUrl(card.embed.provider, card.embed.resourceId);
  }
  image(card.poster);
  image(card.fallback);
  return card;
}
