import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { executeMedia, fingerprint, localInput, probe, waveform } from './media-tools.ts';
import { mediaLimits } from '../src/config/media.ts';

export function preparationArgs(args: string[]) {
  const [kind, input, id, ...options] = args;
  if (
    !['image', 'video', 'audio'].includes(kind) ||
    !input ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || '') ||
    options.length % 2
  )
    throw new Error(
      'Usage: media:prepare -- image|video|audio <local-file> <new-id> [--start seconds] [--seconds seconds]',
    );
  let start = 0;
  let seconds = kind === 'audio' ? 30 : 8;
  const seen = new Set<string>();
  for (let index = 0; index < options.length; index += 2) {
    const key = options[index];
    const number = Number(options[index + 1]);
    if (
      !['--start', '--seconds'].includes(key) ||
      seen.has(key) ||
      !Number.isFinite(number) ||
      number < 0 ||
      (key === '--seconds' && number === 0)
    )
      throw new Error('Invalid or duplicate media option');
    seen.add(key);
    if (key === '--start') start = number;
    else seconds = number;
  }
  if (kind === 'image' && options.length)
    throw new Error('Image preparation does not accept time ranges');
  if (seconds > (kind === 'audio' ? mediaLimits.sampleSeconds : mediaLimits.cardVideoSeconds))
    throw new Error('Preview duration exceeds card budget');
  return { kind: kind as 'image' | 'video' | 'audio', input, id, start, seconds };
}

export async function prepareMedia(options: ReturnType<typeof preparationArgs>) {
  const input = localInput(options.input);
  const output = resolve('public/media', options.id);
  if (existsSync(output)) throw new Error(`Output already exists; choose a new id: ${output}`);
  mkdirSync('.scratch', { recursive: true });
  const temp = mkdtempSync(resolve('.scratch', 'prepare-media-'));
  const assets: Record<string, unknown>[] = [];
  const src = (name: string) => `/media/${options.id}/${name}`;
  function bytes(name: string, limit: number = mediaLimits.localFileBytes) {
    const size = statSync(join(temp, name)).size;
    if (size > limit)
      throw new Error(`${name} exceeds ${limit} bytes; use a shorter/lower-resolution source`);
    return size;
  }
  async function imageAsset(name: string, source: string, width = 480) {
    await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(join(temp, name));
    const meta = await sharp(join(temp, name)).metadata();
    return {
      id: `${options.id}-${name.replace('.webp', '')}`,
      kind: 'image',
      src: src(name),
      width: meta.width!,
      height: meta.height!,
      bytes: bytes(name, mediaLimits.imageBytes),
    };
  }
  function transcode(args: string[]) {
    executeMedia('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args]);
  }
  try {
    if (options.kind === 'image') {
      const metadata = await sharp(input, { animated: true }).metadata();
      const poster = await imageAsset('poster.webp', input);
      if ((metadata.pages || 1) > 1) {
        await sharp(input, { animated: true })
          .resize({ width: 480, withoutEnlargement: true })
          .webp({ quality: 65 })
          .toFile(join(temp, 'motion.webp'));
        const animated = await sharp(join(temp, 'motion.webp'), { animated: true }).metadata();
        assets.push(poster, {
          id: `${options.id}-motion`,
          kind: 'image',
          src: src('motion.webp'),
          width: animated.width,
          height: animated.pageHeight || animated.height,
          bytes: bytes('motion.webp', mediaLimits.imageBytes),
          animated: true,
          posterId: poster.id,
        });
      } else {
        const detail = await imageAsset('detail.webp', input, 960);
        const zoom = await imageAsset('zoom.webp', input, 1440);
        assets.push(
          {
            ...zoom,
            variants: [poster, detail].map(({ src, width, height, bytes }) => ({
              src,
              width,
              height,
              bytes,
            })),
          },
          poster,
        );
      }
    } else {
      const original = probe(input);
      if (options.start >= original.duration)
        throw new Error('Preview start is outside source duration');
      const seconds = Math.min(options.seconds, original.duration - options.start);
      if (options.kind === 'video') {
        if (!original.width) throw new Error('Input has no video stream');
        transcode([
          '-ss',
          String(options.start),
          '-i',
          input,
          '-frames:v',
          '1',
          join(temp, 'poster.png'),
        ]);
        const poster = await imageAsset('poster.webp', join(temp, 'poster.png'));
        rmSync(join(temp, 'poster.png'));
        const encode = [
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          '-crf',
          '26',
          '-preset',
          'fast',
          '-movflags',
          '+faststart',
        ];
        transcode([
          '-ss',
          String(options.start),
          '-i',
          input,
          '-t',
          String(seconds),
          '-vf',
          "scale='min(640,iw)':-2",
          '-r',
          '24',
          '-an',
          ...encode,
          join(temp, 'preview.mp4'),
        ]);
        transcode([
          '-i',
          input,
          '-vf',
          "scale='min(1280,iw)':-2",
          ...encode,
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          join(temp, 'full.mp4'),
        ]);
        assets.push(poster);
        for (const name of ['preview', 'full']) {
          const info = probe(join(temp, `${name}.mp4`));
          assets.push({
            id: `${options.id}-${name}`,
            kind: 'video',
            sources: [
              {
                src: src(`${name}.mp4`),
                type: 'video/mp4',
                bytes: bytes(
                  `${name}.mp4`,
                  name === 'preview' ? mediaLimits.cardVideoBytes : mediaLimits.localFileBytes,
                ),
              },
            ],
            width: info.width,
            height: info.height,
            duration: info.duration,
            hasAudio: info.hasAudio,
            posterId: poster.id,
            loop: name === 'preview',
          });
        }
      } else {
        if (!original.hasAudio) throw new Error('Input has no audio stream');
        transcode([
          '-ss',
          String(options.start),
          '-i',
          input,
          '-t',
          String(Math.max(0.01, seconds - 0.1)),
          '-vn',
          '-c:a',
          'libmp3lame',
          '-b:a',
          '96k',
          join(temp, 'sample.mp3'),
        ]);
        transcode([
          '-i',
          input,
          '-vn',
          '-c:a',
          'libmp3lame',
          '-b:a',
          '128k',
          join(temp, 'full.mp3'),
        ]);
        for (const name of ['sample', 'full']) {
          const path = join(temp, `${name}.mp3`);
          assets.push({
            id: `${options.id}-${name}`,
            kind: 'audio',
            sources: [
              {
                src: src(`${name}.mp3`),
                type: 'audio/mpeg',
                bytes: bytes(
                  `${name}.mp3`,
                  name === 'sample' ? mediaLimits.sampleBytes : mediaLimits.localFileBytes,
                ),
              },
            ],
            duration: probe(path).duration,
            waveform: waveform(path),
          });
        }
      }
    }
    const manifest = {
      version: 1,
      preparation: { kind: options.kind, start: options.start, seconds: options.seconds },
      input: { filename: basename(input), sha256: fingerprint(input) },
      assets,
    };
    writeFileSync(join(temp, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    // Parse back before publishing the directory; never overwrite a prior preparation.
    JSON.parse(readFileSync(join(temp, 'manifest.json'), 'utf8'));
    mkdirSync(resolve('public/media'), { recursive: true });
    if (existsSync(output)) throw new Error('Output was created by another process');
    renameSync(temp, output);
    return {
      output,
      manifest,
      next: 'Add provenance, localized mediaText and presentation; audio also needs artworkId. Then run content:validate.',
    };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareMedia(preparationArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
}
