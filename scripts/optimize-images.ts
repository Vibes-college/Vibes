import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, extname, basename, dirname } from 'node:path';
import sharp, { type Sharp } from 'sharp';

export const imageThresholdBytes = 200 * 1024;
export const imageWidths = [480, 960, 1440] as const;
export const imageOutputLimitBytes = 200 * 1024;

type ImageVariant = {
  width: number;
  path: string;
  bytes: number;
};

export type ImageManifestEntry = {
  source: string;
  width: number;
  height: number;
  fallbackBytes: number;
  variants: ImageVariant[];
  srcset: string;
};

export type ImageManifest = {
  thresholdBytes: number;
  generatedAt: 'build';
  largestOutputBytes: number;
  images: Record<string, ImageManifestEntry>;
};

const rasterExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function imageUrl(path: string) {
  return `/${path.split(/\\|\\/g).join('/')}`;
}

function fallbackPipeline(source: Sharp, format: string) {
  const resized = source.clone().resize({ width: 1440, withoutEnlargement: true });
  if (format === '.png') return resized.png({ compressionLevel: 9, palette: true });
  if (format === '.webp') return resized.webp({ quality: 82, effort: 6 });
  if (format === '.avif') return resized.avif({ quality: 55, effort: 6 });
  return resized.jpeg({ quality: 82, mozjpeg: true });
}

async function writeVariant(source: Sharp, width: number, output: string) {
  await source
    .clone()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(output);
  return statSync(output).size;
}

function addAttribute(tag: string, name: string, value: string) {
  const closing = tag.endsWith('/>') ? '/>' : '>';
  return `${tag.slice(0, -closing.length)} ${name}="${value}"${closing}`;
}

export function applyImageSrcsets(html: string, manifest: ImageManifest) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\bsrcset=["']/i.test(tag)) return tag;
    const match = tag.match(/\bsrc=["'](\/images\/[^"'#?]+)(?:[?#][^"']*)?["']/i);
    if (!match) return tag;
    const entry = manifest.images[match[1]];
    if (!entry) return tag;
    const width = tag.match(/\bwidth=["'](\d+)["']/i)?.[1];
    const sizes = width && Number(width) <= 830 ? `${width}px` : '(max-width: 830px) 100vw, 830px';
    return addAttribute(addAttribute(tag, 'srcset', entry.srcset), 'sizes', sizes);
  });
}

export async function optimizeImages(out = 'dist'): Promise<ImageManifest> {
  const publicDirectory = 'public/images';
  const outputDirectory = join(out, 'images');
  mkdirSync(out, { recursive: true });
  const manifest: ImageManifest = {
    thresholdBytes: imageThresholdBytes,
    generatedAt: 'build',
    largestOutputBytes: 0,
    images: {},
  };

  for (const sourcePath of files(publicDirectory)) {
    const extension = extname(sourcePath).toLowerCase();
    const sourceBytes = statSync(sourcePath).size;
    if (!rasterExtensions.has(extension) || sourceBytes <= imageThresholdBytes) continue;

    const metadata = await sharp(sourcePath).metadata();
    if (!metadata.width || !metadata.height)
      throw new Error(`Missing image dimensions: ${sourcePath}`);
    // Animated images must never silently become their first frame. Media tooling
    // produces a bounded animation or an explicit video preview before build.
    if ((metadata.pages || 1) > 1)
      throw new Error(
        `Animated image exceeds budget; prepare a smaller animation/video: ${sourcePath}`,
      );
    const source = sharp(sourcePath);
    const relativePath = relative('public', sourcePath);
    const outputPath = join(out, relativePath);
    mkdirSync(dirname(outputPath), { recursive: true });
    await fallbackPipeline(source, extension).toFile(outputPath);
    const fallbackBytes = statSync(outputPath).size;
    manifest.largestOutputBytes = Math.max(manifest.largestOutputBytes, fallbackBytes);

    const stem = basename(sourcePath, extension);
    const relativeDirectory = relative(publicDirectory, dirname(sourcePath));
    const variants: ImageVariant[] = [];
    for (const width of imageWidths.filter((candidate) => candidate < metadata.width!)) {
      const variantPath = join(outputDirectory, relativeDirectory, `${stem}-${width}w.webp`);
      mkdirSync(dirname(variantPath), { recursive: true });
      const bytes = await writeVariant(source, width, variantPath);
      const publicPath = imageUrl(join('images', relativeDirectory, `${stem}-${width}w.webp`));
      variants.push({ width, path: publicPath, bytes });
      manifest.largestOutputBytes = Math.max(manifest.largestOutputBytes, bytes);
    }
    if (!variants.length) {
      const width = Math.min(metadata.width, imageWidths[0]);
      const variantPath = join(outputDirectory, relativeDirectory, `${stem}-${width}w.webp`);
      mkdirSync(dirname(variantPath), { recursive: true });
      const bytes = await writeVariant(source, width, variantPath);
      const publicPath = imageUrl(join('images', relativeDirectory, `${stem}-${width}w.webp`));
      variants.push({ width, path: publicPath, bytes });
      manifest.largestOutputBytes = Math.max(manifest.largestOutputBytes, bytes);
    }
    const sourceUrl = imageUrl(join('images', relativePath.slice('images/'.length)));
    manifest.images[sourceUrl] = {
      source: sourceUrl,
      width: metadata.width,
      height: metadata.height,
      fallbackBytes,
      variants,
      srcset: variants.map(({ path, width }) => `${path} ${width}w`).join(', '),
    };
  }

  if (manifest.largestOutputBytes >= imageOutputLimitBytes)
    throw new Error(
      `Optimized image exceeds ${imageOutputLimitBytes} bytes: ${manifest.largestOutputBytes}`,
    );

  for (const htmlPath of files(out).filter((path) => path.endsWith('.html'))) {
    const original = readFileSync(htmlPath, 'utf8');
    const updated = applyImageSrcsets(original, manifest);
    if (updated !== original) writeFileSync(htmlPath, updated);
  }
  writeFileSync(join(out, 'image-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}
