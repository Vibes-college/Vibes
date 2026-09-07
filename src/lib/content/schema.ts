import { z } from 'astro/zod';
import { mediaSchema, presentationSchema, mediaTextSchema } from '../media/schema.ts';

import { locales, type Locale } from '../i18n/routes.ts';
export { locales };
export type { Locale };
export const localeSchema = z.enum(locales);
export const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
const localized = z.object({ zh: text.optional(), en: text.optional() }).strict();
const https = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'Expected an HTTPS URL without credentials');
import { previewKinds, colorPattern } from '../preview.ts';
export { previewKinds };
export const previewSchema = z
  .object({
    kind: z.enum(previewKinds),
    color: z.string().regex(colorPattern),
  })
  .strict();
export const targetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('link'), url: https }).strict(),
  z.object({ kind: z.literal('tag'), tagId: idSchema }).strict(),
  z
    .object({
      kind: z.literal('anchor'),
      anchor: text.refine((value) => !/[\s#<>"']/.test(value), 'Invalid anchor'),
    })
    .strict(),
]);
export const factSchema = z
  .object({
    key: idSchema,
    kind: z.enum(['text', 'author', 'type', 'topic', 'date', 'source', 'prompt', 'skill']),
    label: localized,
    value: localized,
    target: targetSchema.optional(),
  })
  .strict();
export const workSchema = z
  .object({
    id: idSchema,
    originalLocale: localeSchema,
    order: z.number().int().nonnegative(),
    sourceUrl: https,
    typeId: idSchema,
    tagIds: z.array(idSchema),
    preview: previewSchema,
    media: z.array(mediaSchema).max(40).optional(),
    presentation: presentationSchema.optional(),
    facts: z.array(factSchema).default([]),
    related: z.array(z.object({ targetId: idSchema, reason: localized }).strict()).default([]),
  })
  .strict();
export const languageSchema = z
  .object({
    locale: localeSchema,
    status: z.enum(['draft', 'published']),
    title: text,
    summary: text,
    description: text,
    previewText: z.object({ eyebrow: z.string(), display: text, note: z.string() }).strict(),
    mediaText: mediaTextSchema.optional(),
    sourceRevision: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
  })
  .strict();
export const taxonomySchema = z.array(
  z
    .object({
      id: idSchema,
      kind: z.enum(['type', 'topic', 'creator', 'person', 'company', 'paper']),
      labels: z.object({ zh: text, en: text }).strict(),
      aliases: z.object({ zh: z.array(text), en: z.array(text) }).strict(),
    })
    .strict(),
);
export type WorkMetadata = z.infer<typeof workSchema>;
export type LanguageMetadata = z.infer<typeof languageSchema>;
export type Taxon = z.infer<typeof taxonomySchema>[number];
export type Fact = z.infer<typeof factSchema>;
export interface Version {
  data: LanguageMetadata;
  body: string;
  file: string;
}
export interface CatalogWork {
  meta: WorkMetadata;
  versions: Partial<Record<Locale, Version>>;
}
export interface Catalog {
  works: CatalogWork[];
  taxonomy: Taxon[];
}

// 在错误中保留实际文件及字段路径，便于维护者定位内容问题。
export function parseContent<T>(schema: z.ZodType<T>, value: unknown, file: string): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new Error(
      `${file}: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
    );
  return result.data;
}
