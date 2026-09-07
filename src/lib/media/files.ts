import { readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { mediaLimits } from '../../config/media.ts';
import { parseChartData } from './data.ts';
import type { Media } from './schema.ts';

export function validateMediaFiles(media: Media[], publicRoot = 'public'): void {
  const root = realpathSync(publicRoot);
  function file(src: string, expectedBytes?: number, limit: number = mediaLimits.localFileBytes) {
    if (expectedBytes !== undefined && expectedBytes > limit)
      throw new Error(`media ${src}: declared bytes exceed ${limit}`);
    if (!src.startsWith('/')) return undefined;
    const path = realpathSync(resolve(root, '.' + src));
    if (!path.startsWith(root + sep))
      throw new Error(`media ${src}: file escapes public directory`);
    const info = statSync(path);
    if (!info.isFile() || info.size > limit)
      throw new Error(`media ${src}: invalid file or over ${limit} bytes`);
    if (expectedBytes !== undefined && info.size !== expectedBytes)
      throw new Error(`media ${src}: bytes ${expectedBytes} differ from actual ${info.size}`);
    return path;
  }
  for (const item of media) {
    if (item.kind === 'image') {
      file(item.src, item.bytes, mediaLimits.imageBytes);
      for (const variant of item.variants) file(variant.src, variant.bytes, mediaLimits.imageBytes);
    }
    if (item.kind === 'audio' || item.kind === 'video') {
      for (const source of item.sources) file(source.src, source.bytes);
      for (const caption of item.captions) {
        if (!caption.src.endsWith('.vtt'))
          throw new Error(`media ${item.id}: captions must be WebVTT`);
        const path = file(caption.src, undefined, mediaLimits.dataBytes);
        if (path && !readFileSync(path, 'utf8').startsWith('WEBVTT'))
          throw new Error(`media ${item.id}: invalid WebVTT`);
      }
    }
    if (item.kind === 'chart') {
      const path = file(item.dataset, undefined, mediaLimits.dataBytes);
      if (path)
        parseChartData(
          readFileSync(path, 'utf8'),
          item.columns.map((column) => column.key),
        );
    }
  }
}
