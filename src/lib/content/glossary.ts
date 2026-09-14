import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseFrontmatter } from 'astro/markdown';
import { z } from 'astro/zod';
import { contentEditUrl } from './github.ts';

const referenceRoot = contentEditUrl('src/content/glossary/terms').replace('/edit/', '/blob/');

const text = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const source = z
  .object({
    title: text,
    author: text,
    url: text.refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:' && !url.username && !url.password;
      } catch {
        return false;
      }
    }, 'Use an HTTPS source without credentials'),
    section: text,
  })
  .strict();
const metadata = z
  .object({
    id: slug,
    title: text,
    english: text,
    aliases: z.array(text),
    category: z.enum(['基础概念', '技术工具', '触发方式', '动效类型', 'UX规则']),
    provenance: z.enum(['原文摘录与补充', '原文概述整理', '案例整理']),
    sources: z.array(source).min(1),
  })
  .strict();
const headings = ['常见变体', '适合用在哪里', '什么时候不用', '提示词例子'];
export type GlossaryTerm = z.infer<typeof metadata> & {
  definition: string;
  sections: Record<string, string>;
};
export type Glossary = Record<string, GlossaryTerm>;
export type TermUsage = {
  term: string;
  context: string;
  parameter: string;
  judgment: string;
};

export function parseGlossaryTerm(source: string, file: string): GlossaryTerm {
  const parsed = parseFrontmatter(source);
  const result = metadata.safeParse(parsed.frontmatter);
  if (!result.success) throw new Error(`${file}: ${result.error.message}`);
  const body = parsed.content.trim();
  const title = `# ${result.data.title} / ${result.data.english}`;
  const parts = [...body.matchAll(/^## (.+)\s*$/gm)];
  if (
    !body.startsWith(title + '\n') ||
    parts.map((m) => m[1].trim()).join('|') !== headings.join('|')
  )
    throw new Error(`${file}: use the glossary title and four template sections in order`);
  const definition = body.slice(title.length, parts[0].index).trim();
  // This short paragraph is also rendered as plain text in the popover and task.
  if (!definition || /\n|[<>*`[\]]/.test(definition))
    throw new Error(`${file}: glossary definition must be one plain-text paragraph`);
  const sections = Object.fromEntries(
    parts.map((part, index) => [
      part[1].trim(),
      body.slice(part.index! + part[0].length, parts[index + 1]?.index).trim(),
    ]),
  );
  if (Object.values(sections).some((value) => !value))
    throw new Error(`${file}: empty glossary section`);
  return { ...result.data, definition, sections };
}

export function glossaryIndex(terms: GlossaryTerm[]): Glossary {
  const glossary: Glossary = {};
  const names = new Map<string, string>();
  for (const term of terms) {
    if (Object.hasOwn(glossary, term.id)) throw new Error(`glossary: duplicate id ${term.id}`);
    for (const name of [term.id, term.title, term.english, ...term.aliases]) {
      const key = name.normalize('NFKC').trim().toLowerCase();
      const previous = names.get(key);
      if (previous && previous !== term.id)
        throw new Error(`glossary: alias ${name} conflicts between ${previous}/${term.id}`);
      names.set(key, term.id);
    }
    glossary[term.id] = term;
  }
  return glossary;
}

export function readGlossary(root = 'src/content/glossary/terms'): Glossary {
  const terms = readdirSync(root)
    .sort()
    .map((name) => {
      if (!/^[a-z0-9-]+\.md$/.test(name))
        throw new Error(`${root}/${name}: unsupported glossary file`);
      const file = join(root, name);
      const term = parseGlossaryTerm(readFileSync(file, 'utf8'), file);
      if (name !== `${term.id}.md`) throw new Error(`${file}: id must match filename`);
      return term;
    });
  if (!terms.length) throw new Error(`${root}: empty glossary`);
  return glossaryIndex(terms);
}

export function resolveGlossary(usages: Record<string, TermUsage>, glossary: Glossary = {}) {
  return Object.fromEntries(
    Object.entries(usages).map(([localId, usage]) => {
      const term = Object.hasOwn(glossary, usage.term) ? glossary[usage.term] : undefined;
      if (!term) throw new Error(`glossary: unknown term ${usage.term} (reference ${localId})`);
      return [
        localId,
        {
          ...usage,
          title: term.title,
          english: term.english,
          kind: term.category,
          definition: term.definition,
          provenance: term.provenance,
          sources: term.sources,
          reference: `${referenceRoot}/${term.id}.md`,
        },
      ];
    }),
  );
}
