import { realpathSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';

export function validateLearningFiles(
  media: {
    video?: string;
    image?: string;
    poster: string;
    mobile?: { video: string; poster: string };
    card?: { video: string; poster: string };
  },
  publicRoot = 'public',
) {
  const root = realpathSync(publicRoot);
  for (const url of new Set(
    [
      media.video,
      media.image,
      media.poster,
      media.mobile?.video,
      media.mobile?.poster,
      media.card?.video,
      media.card?.poster,
    ].filter((url): url is string => Boolean(url)),
  )) {
    const file = realpathSync(resolve(root, '.' + url));
    if (!file.startsWith(root + sep)) throw new Error(`Learning media escapes public/: ${url}`);
    const info = statSync(file);
    const limit =
      url === media.card?.video ? 150 * 1024 : url.endsWith('.mp4') ? 2 * 1024 * 1024 : 200 * 1024;
    if (!info.isFile() || info.size < 1 || info.size > limit)
      throw new Error(`Learning media must be a nonempty file below ${limit} bytes: ${url}`);
  }
}
