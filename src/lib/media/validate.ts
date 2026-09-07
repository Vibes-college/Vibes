import { mediaLimits } from '../../config/media.ts';
import type { Media, Presentation, MediaText } from './schema.ts';

export function validateMedia(media: Media[], presentation?: Presentation, text?: MediaText): void {
  const assets = new Map<string, Media>();
  const fail = (path: string, message: string): never => {
    throw new Error(`media.${path}: ${message}`);
  };
  for (const item of media) {
    if (assets.has(item.id)) fail(item.id, `duplicate id ${item.id}`);
    assets.set(item.id, item);
  }
  function get(id: string, path: string) {
    return assets.get(id) || fail(path, `missing media ${id}`);
  }
  function staticImage(id: string, path: string) {
    const image = get(id, path);
    if (image.kind !== 'image' || image.animated) fail(path, 'expected a static image');
  }
  for (const item of media) {
    if ('posterId' in item && item.posterId) staticImage(item.posterId, `${item.id}.posterId`);
    if (item.kind === 'image' && item.animated && !item.posterId)
      fail(`${item.id}.posterId`, 'animated image needs a static poster');
    if (item.kind === 'audio') staticImage(item.artworkId, `${item.id}.artworkId`);
    if (item.kind === 'video' || item.kind === 'audio') {
      if (item.sources.some((source) => !source.type.startsWith(`${item.kind}/`)))
        fail(`${item.id}.sources`, 'MIME type does not match media kind');
      const ids = new Set<string>();
      let previous = -1;
      for (const chapter of item.chapters) {
        if (chapter.start >= item.duration || chapter.start <= previous || ids.has(chapter.id))
          fail(
            `${item.id}.chapters`,
            'chapters must have unique ids and increasing times within duration',
          );
        previous = chapter.start;
        ids.add(chapter.id);
      }
    }
    if (item.kind === 'chart') {
      const keys = item.columns.map((column) => column.key);
      if (
        new Set(keys).size !== keys.length ||
        !keys.includes(item.chart.x) ||
        item.chart.series.some((key) => !keys.includes(key) || key === item.chart.x) ||
        new Set(item.chart.series).size !== item.chart.series.length
      )
        fail(`${item.id}.chart`, 'invalid column mapping');
    }
  }
  if (presentation) {
    staticImage(presentation.fallbackId, 'presentation.fallbackId');
    const card = get(presentation.card.mediaId, 'presentation.card.mediaId');
    const mode = presentation.card.mode;
    if (
      (mode === 'image' && (card.kind !== 'image' || card.animated)) ||
      (mode === 'audio' && card.kind !== 'audio') ||
      (mode === 'embed' && card.kind !== 'embed') ||
      (mode === 'motion' && card.kind !== 'video' && !(card.kind === 'image' && card.animated))
    )
      fail('presentation.card.mode', 'mode does not match the referenced media');
    if (card.kind === 'audio' || card.kind === 'video') {
      if (
        card.duration >
        (card.kind === 'audio' ? mediaLimits.sampleSeconds : mediaLimits.cardVideoSeconds)
      )
        fail('presentation.card.duration', 'use an independent short preview');
      if (
        card.sources.some(
          (source) =>
            source.bytes >
            (card.kind === 'audio' ? mediaLimits.sampleBytes : mediaLimits.cardVideoBytes),
        )
      )
        fail('presentation.card.bytes', 'preview is over budget');
      if (card.kind === 'video' && card.hasAudio)
        fail('presentation.card.audio', 'remove the audio track from the preview');
    }
    if (new Set(presentation.detail.items).size !== presentation.detail.items.length)
      fail('presentation.detail.items', 'duplicate item');
    for (const id of presentation.detail.items) get(id, 'presentation.detail.items');
  } else if (media.length) fail('presentation', 'media requires a presentation');
  if (text) {
    for (const id of Object.keys(text)) get(id, `text.${id}`);
    for (const item of media) {
      const description = text[item.id];
      if (!description) fail(`text.${item.id}`, 'missing localized title');
      if (item.kind === 'image' && !description.alt)
        fail(`text.${item.id}.alt`, 'missing image description');
      if (item.kind === 'video' || item.kind === 'audio') {
        for (const chapter of item.chapters)
          if (!description.chapters[chapter.id])
            fail(`text.${item.id}.chapters`, `missing label ${chapter.id}`);
        let previous = -1;
        for (const cue of description.transcript) {
          if (cue.start !== undefined) {
            if (cue.start < previous || cue.start >= item.duration)
              fail(`text.${item.id}.transcript`, 'cue is outside duration or out of order');
            previous = cue.start;
          }
        }
      }
      if (item.kind === 'chart') {
        if (!description.context) fail(`text.${item.id}.context`, 'chart needs context');
        for (const column of item.columns)
          if (!description.columns[column.key])
            fail(`text.${item.id}.columns`, `missing label ${column.key}`);
      }
    }
  }
}
