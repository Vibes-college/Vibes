import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { readCatalog } from './lib/content/catalog';
import { languageSchema, workSchema } from './lib/content/schema';

const workMetadata = defineCollection({
  loader: async () => readCatalog().works.map((work) => work.meta),
  schema: workSchema,
});
const workVersions = defineCollection({
  loader: glob({
    pattern: '**/{zh,en}.md',
    base: process.env.VIBES_CONTENT_DIR || './src/content/works',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: languageSchema,
});
export const collections = { workMetadata, workVersions };
