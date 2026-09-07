// Add exact reviewed origins here before publishing remote assets. No wildcard hosts.
export const mediaFileOrigins: readonly string[] = [
  'https://i.ytimg.com',
  'https://image-cdn-ak.spotifycdn.com',
  'https://gabrielecirulli.github.io',
  'https://yaoda.work',
  'https://attach.cgjoy.com',
  'https://repo-sam.inria.fr',
  'https://ciechanow.ski',
];
// Only these author-owned experiences can be framed. Content selects a key,
// never an arbitrary URL or code string.
export const mediaSites: Record<string, string> = {
  '2048': '/media/2048/game.txt',
  'mechanical-watch': 'https://ciechanow.ski/mechanical-watch/',
  'yaoda-ninja': 'https://yaoda.work/#banner',
  'yaoda-characters': 'https://yaoda.work/#workShow',
};
export const embedProviders = ['bilibili', 'youtube', 'spotify', 'site'] as const;
export type EmbedProvider = (typeof embedProviders)[number];
export const mediaFrameOrigins = [
  'https://player.bilibili.com',
  'https://www.youtube-nocookie.com',
  'https://open.spotify.com',
  ...new Set(
    Object.values(mediaSites)
      .filter((url) => url.startsWith('https:'))
      .map((url) => new URL(url).origin),
  ),
] as const;
export const mediaLimits = {
  cardVideoBytes: 1024 * 1024,
  cardVideoSeconds: 12,
  sampleBytes: 512 * 1024,
  sampleSeconds: 30,
  imageBytes: 200 * 1024,
  dataBytes: 128 * 1024,
  dataRows: 2000,
  localFileBytes: 25 * 1024 * 1024,
} as const;

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isMediaUrl(value: string): boolean {
  if (/[\\\s%]/.test(value)) return false;
  if (value.startsWith('/'))
    return (
      /^\/(media|images)\/[a-zA-Z0-9_./-]+$/.test(value) &&
      value
        .slice(1)
        .split('/')
        .every((part) => part && part !== '.' && part !== '..')
    );
  return isHttpsUrl(value) && mediaFileOrigins.includes(new URL(value).origin);
}

// Datasets are reviewed and shipped with the site; fetch stays within connect-src self.
export function isMediaDatasetUrl(value: string): boolean {
  return value.startsWith('/media/') && /\.(json|csv)$/.test(value) && isMediaUrl(value);
}

export function embedUrl(provider: string, id: string): string {
  if (provider === 'bilibili' && /^BV[a-zA-Z0-9]{10}$/.test(id))
    return `https://player.bilibili.com/player.html?bvid=${id}&autoplay=0`;
  if (provider === 'youtube' && /^[a-zA-Z0-9_-]{11}$/.test(id))
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=0`;
  if (provider === 'spotify' && /^(track|album|episode|playlist)\/[a-zA-Z0-9]{22}$/.test(id))
    return `https://open.spotify.com/embed/${id}`;
  if (provider === 'site' && Object.hasOwn(mediaSites, id)) return mediaSites[id];
  throw new Error('Invalid registered embed provider/resourceId');
}
