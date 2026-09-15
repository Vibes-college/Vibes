import type { Catalog, Locale } from './schema.ts';
import type { WorkView } from './views.ts';
import type { CardMedia } from '../media/card.ts';

export interface CollectionItem {
  id: string;
  title: string;
  card: CardMedia;
}

/** A collection references members; it never copies their source or learning material. */
export function attachCollections(catalog: Catalog, works: WorkView[], locale: Locale) {
  for (const work of works) {
    const members = catalog.works.filter(
      (entry) =>
        entry.meta.learning?.collectionId === work.slug &&
        entry.versions[locale]?.data.status === 'published',
    );
    const items: CollectionItem[] = members.flatMap((entry) => {
      const media = entry.meta.learning!.media.card;
      if (!media) return [];
      const title = entry.versions[locale]!.data.title;
      const image = {
        src: media.poster,
        width: media.width,
        height: media.height,
        alt: title,
        variants: [],
        focalPoint: [0.5, 0.5] as [number, number],
      };
      return [
        {
          id: entry.meta.id,
          title,
          card: {
            kind: 'video',
            poster: image,
            fallback: image,
            sources: [{ src: media.video, type: 'video/mp4' }],
            duration: media.duration,
            waveform: [],
            fit: 'contain',
          },
        },
      ];
    });
    if (!items.length) continue;
    work.mediaCard = {
      ...items[0].card,
      collection: {
        id: work.slug,
        count: members.length,
        items,
      },
    };
  }
  return works;
}
