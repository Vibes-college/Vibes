import { realpathSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';

export function validateLearningFiles(
  media: { video?: string; image?: string; poster: string },
  publicRoot = 'public',
) {
  const root = realpathSync(publicRoot);
  for (const url of new Set(Object.values(media))) {
    const file = realpathSync(resolve(root, '.' + url));
    if (!file.startsWith(root + sep)) throw new Error(`Learning media escapes public/: ${url}`);
    const info = statSync(file);
    const limit = url.endsWith('.mp4') ? 550 * 1024 : 200 * 1024;
    if (!info.isFile() || info.size < 1 || info.size > limit)
      throw new Error(`Learning media must be a nonempty file below ${limit} bytes: ${url}`);
  }
}
