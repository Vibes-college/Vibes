export interface PaseoAssetConfig {
  version: 1;
  basePath: string;
  script: { url: string; integrity: string };
  styles: { url: string; integrity: string }[];
}
export function parsePaseoAssetConfig(value: unknown): PaseoAssetConfig | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (
    Object.keys(data).some((key) => !['version', 'basePath', 'script', 'styles'].includes(key)) ||
    data.version !== 1 ||
    typeof data.basePath !== 'string' ||
    !/^\/vendor\/paseo\/[a-f0-9]{16}$/.test(data.basePath)
  )
    return null;
  const basePath = data.basePath;
  const resource = (item: unknown, extension: string) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const file = item as Record<string, unknown>;
    // Exported paths are plain ASCII. Reject URL normalization and encoded traversal.
    if (
      Object.keys(file).some((key) => !['url', 'integrity'].includes(key)) ||
      typeof file.url !== 'string' ||
      !file.url.startsWith(basePath + '/') ||
      !/^\/[A-Za-z0-9_./-]+$/.test(file.url) ||
      file.url
        .slice(1)
        .split('/')
        .some((part) => !part || part === '.' || part === '..') ||
      !file.url.endsWith(extension) ||
      typeof file.integrity !== 'string' ||
      !/^sha256-[A-Za-z0-9+/]{43}=$/.test(file.integrity)
    )
      return null;
    return { url: file.url, integrity: file.integrity };
  };
  const script = resource(data.script, '.js');
  if (!script || !Array.isArray(data.styles) || data.styles.length > 20) return null;
  const styles = data.styles.map((style) => resource(style, '.css'));
  if (styles.some((style) => !style)) return null;
  return { version: 1, basePath, script, styles: styles as PaseoAssetConfig['styles'] };
}

export function paseoResourceKind(path: string) {
  if (path === 'PASEO-LICENSE') return 'metadata';
  const extension = path.slice(path.lastIndexOf('.'));
  if (extension === '.js') return 'script';
  if (extension === '.css') return 'style';
  if (extension === '.html') return 'document';
  if (extension === '.wasm') return 'wasm';
  if (['.woff', '.woff2', '.ttf', '.otf'].includes(extension)) return 'font';
  if (['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.gif', '.ico'].includes(extension))
    return 'image';
  if (['.mp3', '.mp4', '.webm', '.wav', '.ogg'].includes(extension)) return 'media';
  if (extension === '.json' || extension === '.txt') return 'metadata';
  if (extension === '.map') return 'source-map';
  throw new Error(`Unclassified resource: ${path}`);
}
