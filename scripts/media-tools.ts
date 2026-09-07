import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

export interface Probe {
  width?: number;
  height?: number;
  duration: number;
  hasAudio: boolean;
  streams: { codec_type: string; codec_name: string; width?: number; height?: number }[];
}
export function localInput(input: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(input))
    throw new Error('Media preparation accepts local files only');
  const path = realpathSync(resolve(input));
  if (!statSync(path).isFile()) throw new Error('Media input must be a regular file');
  return path;
}
export function executeMedia(command: 'ffmpeg' | 'ffprobe', args: string[]): Buffer {
  const result = spawnSync(command, args, { maxBuffer: 64 * 1024 * 1024, timeout: 180000 });
  if (result.error)
    throw new Error(
      `${command} failed: ${result.error.message}. Install the tool separately; no packages were installed.`,
    );
  if (result.status !== 0)
    throw new Error(`${command} failed: ${result.stderr.toString().slice(-1500)}`);
  return result.stdout;
}
export function probe(input: string): Probe {
  const value = JSON.parse(
    executeMedia('ffprobe', [
      '-v',
      'error',
      '-show_streams',
      '-show_format',
      '-of',
      'json',
      localInput(input),
    ]).toString(),
  ) as {
    streams: Probe['streams'];
    format: { duration?: string };
  };
  const video = value.streams.find((stream) => stream.codec_type === 'video');
  const duration = Number(value.format.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Media has no valid duration');
  return {
    ...value,
    duration,
    width: video?.width,
    height: video?.height,
    hasAudio: value.streams.some((stream) => stream.codec_type === 'audio'),
  };
}
export function pcmPeaks(pcm: Buffer, count = 120): number[] {
  if (!Number.isInteger(count) || count < 1 || count > 200)
    throw new Error('Waveform needs 1–200 buckets');
  const samples = Math.floor(pcm.length / 2);
  if (!samples) throw new Error('Audio decoded no samples');
  const buckets = Math.min(count, samples);
  return Array.from({ length: buckets }, (_, bucket) => {
    const from = Math.floor((bucket * samples) / buckets);
    const to = Math.floor(((bucket + 1) * samples) / buckets);
    let peak = 0;
    for (let sample = from; sample < to; sample++)
      peak = Math.max(peak, Math.abs(pcm.readInt16LE(sample * 2)) / 32768);
    return Math.round(peak * 1000) / 1000;
  });
}
export function waveform(input: string): number[] {
  return pcmPeaks(
    executeMedia('ffmpeg', [
      '-nostdin',
      '-v',
      'error',
      '-i',
      localInput(input),
      '-vn',
      '-ac',
      '1',
      '-ar',
      '1000',
      '-f',
      's16le',
      'pipe:1',
    ]),
  );
}
export function fingerprint(input: string) {
  return createHash('sha256').update(readFileSync(input)).digest('hex');
}
