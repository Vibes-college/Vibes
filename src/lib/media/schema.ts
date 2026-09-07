import { z } from 'astro/zod';
import { isMediaUrl, isHttpsUrl, embedUrl, embedProviders } from '../../config/media.ts';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
const dimension = z.number().int().positive().max(20000);
const url = z
  .string()
  .refine(isMediaUrl, 'Expected a local /media or /images path or a reviewed HTTPS media origin');
const source = z
  .object({
    src: url,
    type: z.enum(['video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav']),
    bytes: z.number().int().positive(),
  })
  .strict();
const chapters = z
  .array(z.object({ id, start: z.number().nonnegative() }).strict())
  .max(100)
  .default([]);
const captions = z
  .array(z.object({ src: url, locale: z.enum(['zh', 'en']) }).strict())
  .max(4)
  .default([]);
const base = {
  id,
  provenance: z
    .object({ url: z.string().refine(isHttpsUrl), credit: text, license: text })
    .strict(),
};
const image = z
  .object({
    ...base,
    kind: z.literal('image'),
    src: url,
    width: dimension,
    height: dimension,
    bytes: z.number().int().positive().optional(),
    variants: z
      .array(
        z
          .object({
            src: url,
            width: dimension,
            height: dimension,
            bytes: z.number().int().positive(),
          })
          .strict(),
      )
      .max(8)
      .default([]),
    focalPoint: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).default([0.5, 0.5]),
    animated: z.boolean().default(false),
    posterId: id.optional(),
  })
  .strict();
const video = z
  .object({
    ...base,
    kind: z.literal('video'),
    sources: z.array(source).min(1).max(4),
    width: dimension,
    height: dimension,
    duration: z.number().positive(),
    hasAudio: z.boolean(),
    posterId: id,
    loop: z.boolean().default(false),
    captions,
    chapters,
  })
  .strict();
const audio = z
  .object({
    ...base,
    kind: z.literal('audio'),
    sources: z.array(source).min(1).max(4),
    duration: z.number().positive(),
    artworkId: id,
    waveform: z.array(z.number().min(0).max(1)).max(200).default([]),
    captions,
    chapters,
  })
  .strict();
const embed = z
  .object({
    ...base,
    kind: z.literal('embed'),
    provider: z.enum(embedProviders),
    resourceId: text,
    posterId: id,
  })
  .strict()
  .refine((value) => {
    try {
      embedUrl(value.provider, value.resourceId);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid provider resourceId');
const demo = z
  .object({
    ...base,
    kind: z.literal('demo'),
    componentId: z.literal('orbit'),
    posterId: id,
    config: z
      .object({
        count: z.number().int().min(1).max(16).default(6),
        speed: z.number().min(0.1).max(3).default(1),
      })
      .strict()
      .default({ count: 6, speed: 1 }),
  })
  .strict();
const chart = z
  .object({
    ...base,
    kind: z.literal('chart'),
    posterId: id,
    dataset: url,
    columns: z
      .array(z.object({ key: id, unit: z.string().max(40).default('') }).strict())
      .min(2)
      .max(12),
    chart: z
      .object({
        kind: z.enum(['line', 'scatter', 'bar']),
        x: id,
        series: z.array(id).min(1).max(8),
      })
      .strict(),
    controls: z
      .object({ series: z.boolean().default(true), range: z.boolean().default(true) })
      .strict()
      .default({ series: true, range: true }),
    dataAsOf: z.iso.date(),
    sourceLocator: text,
  })
  .strict();
export const mediaSchema = z.discriminatedUnion('kind', [image, video, audio, embed, demo, chart]);
export const presentationSchema = z
  .object({
    card: z
      .object({
        mediaId: id,
        mode: z.enum(['image', 'motion', 'audio', 'embed']),
        fit: z.enum(['cover', 'contain']).default('cover'),
      })
      .strict(),
    detail: z.object({ items: z.array(id).min(1).max(20) }).strict(),
    fallbackId: id,
  })
  .strict();
export const mediaTextSchema = z
  .record(
    id,
    z
      .object({
        title: text,
        alt: text.optional(),
        caption: z.string().optional(),
        hint: z.string().optional(),
        context: z.string().optional(),
        chapters: z.record(id, text).default({}),
        columns: z.record(id, text).default({}),
        transcript: z
          .array(z.object({ start: z.number().nonnegative().optional(), text }).strict())
          .max(3000)
          .default([]),
        keyResults: z
          .array(z.object({ label: text, value: text, context: text }).strict())
          .max(4)
          .default([]),
      })
      .strict(),
  )
  .default({});
export type Media = z.infer<typeof mediaSchema>;
export type MediaText = z.infer<typeof mediaTextSchema>;
export type Presentation = z.infer<typeof presentationSchema>;
export type ImageMedia = Extract<Media, { kind: 'image' }>;
export type TimeMedia = Extract<Media, { kind: 'audio' | 'video' }>;
