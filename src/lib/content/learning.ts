import { z } from 'astro/zod';

const text = z.string().trim().min(1);
const strings = z.array(text).min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const asset = text.refine((value) => /^\/great-ui\/media\/[a-z0-9._-]+$/.test(value));
const rendition = z
  .object({
    video: asset.refine((value) => value.endsWith('.mp4')),
    poster: asset.refine((value) => /\.(png|jpg|webp|avif)$/.test(value)),
    width: z.number().int().min(1).max(3840),
    height: z.number().int().min(1).max(3840),
    duration: z.number().positive().max(60),
  })
  .strict();
const sourcePath = text.refine((value) =>
  /^components\/(ui|site\/previews)\/[A-Za-z0-9_-]+\.tsx$/.test(value),
);

export const learningMetadataSchema = z
  .object({
    slug,
    collectionId: slug,
    sequence: z.number().int().positive().optional(),
    english: text,
    revision: z.string().regex(/^[a-f0-9]{40}$/),
    implementation: sourcePath,
    previewSource: sourcePath,
    media: z
      .object({
        video: asset.refine((value) => value.endsWith('.mp4')).optional(),
        image: asset.refine((value) => /\.(png|jpg|webp|avif)$/.test(value)).optional(),
        poster: asset.refine((value) => /\.(png|jpg|webp|avif)$/.test(value)),
        width: z.number().int().min(1).max(3840).optional(),
        height: z.number().int().min(1).max(3840).optional(),
        mobile: rendition.optional(),
        card: rendition.extend({ duration: z.number().positive().max(12) }).optional(),
      })
      .strict()
      .refine((value) => Boolean(value.video) !== Boolean(value.image), 'Use one video or image')
      .refine((value) => Boolean(value.width) === Boolean(value.height), 'Use both dimensions')
      .refine(
        (value) =>
          !(value.mobile || value.card) || Boolean(value.video && value.width && value.height),
        'Renditions require a sized video',
      ),
    capability: z
      .object({
        family: slug,
        roles: strings,
        provides: strings,
        requires: z.array(
          z.object({ key: text, value: text, reason: text, adaptation: text.optional() }).strict(),
        ),
        resources: z.array(
          z
            .object({
              name: text,
              scope: z.enum(['global', 'instance']),
              mode: z.enum(['exclusive', 'read']),
              phase: text,
            })
            .strict(),
        ),
        adaptations: strings,
        reducedMotion: z.enum(['native', 'adaptation', 'unknown']),
        decorativeTransition: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const learningLanguageSchema = z
  .object({
    category: text,
    classification: z.object({ type: text, purpose: strings, behavior: strings }).strict(),
    placementHint: text,
    changesHint: text,
    preserve: strings,
    checks: strings,
    goals: z.array(z.object({ id: slug, title: text, action: text, judge: text }).strict()).min(1),
    adjustments: z.array(z.tuple([text, text, text])).min(1),
    glossary: z.record(
      slug,
      z
        .object({
          term: slug,
          context: text,
          parameter: text,
          judgment: text,
        })
        .strict(),
    ),
  })
  .strict()
  .refine((value) => Object.keys(value.glossary).length > 0, 'Learning glossary is empty')
  .refine(
    (value) => new Set(value.goals.map((goal) => goal.id)).size === value.goals.length,
    'Duplicate goal id',
  );

// Fixed section names are the authoring contract. Reject missing/duplicate sections
// so a harmless-looking Markdown edit cannot silently remove task instructions.
export function parseLearningBody(body: string, file: string) {
  const headings = [...body.matchAll(/^## (.+)\s*$/gm)];
  const names = ['拆解设计', '改造设计', '串联设计'];
  if (headings.map((match) => match[1].trim()).join('|') !== names.join('|'))
    throw new Error(`${file}: learning requires 拆解设计、改造设计、串联设计 in order`);
  const parts = headings.map((match, index) =>
    body.slice(match.index! + match[0].length, headings[index + 1]?.index).trim(),
  );
  if (parts.some((part) => !part)) throw new Error(`${file}: empty learning section`);
  const sections = [...parts[0].matchAll(/^### (.+)\s*$/gm)].map((match, index, all) => ({
    title: match[1].trim(),
    text: parts[0].slice(match.index! + match[0].length, all[index + 1]?.index).trim(),
  }));
  const required = ['适合用在哪里', '什么时候不用', '试一次，就会更懂'];
  if (
    sections.length < 4 ||
    sections.some((section) => !section.text) ||
    new Set(sections.map((section) => section.title)).size !== sections.length ||
    required.some((title) => !sections.some((section) => section.title === title))
  )
    throw new Error(`${file}: incomplete or duplicate learning subsection`);
  const pick = (title: string) => sections.find((section) => section.title === title)!.text;
  return {
    sections: sections.filter((section) => !required.includes(section.title)),
    suitable: pick(required[0]),
    avoid: pick(required[1]),
    practice: pick(required[2]),
    useIntro: parts[1],
    combinationIntro: parts[2],
  };
}
