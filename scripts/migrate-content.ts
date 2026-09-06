import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { parseFrontmatter } from 'astro/markdown';
import { validateCatalog } from '../src/lib/content/validate.ts';
import type { Catalog, Taxon } from '../src/lib/content/schema.ts';
export interface LegacyWork {
  slug: string;
  title: string;
  type: keyof typeof formats;
  creator: string;
  url: string;
  summary: string;
  description: string;
  preview: string;
  eyebrow: string;
  display: string;
  note: string;
  color: string;
}

const formats = {
  code: ['代码', 'Code'],
  paper: ['论文', 'Papers'],
  website: ['网站', 'Websites'],
  video: ['视频', 'Video'],
  audio: ['音频', 'Audio'],
  article: ['文章', 'Articles'],
};

// 稳定作者标签不随顺序改变，同名作者共享身份，不据名字推断账号或人物实体。
function creatorId(name: string): string {
  return `creator-${createHash('sha256').update(name).digest('hex').slice(0, 16)}`;
}
export function migrateEntries(entries: LegacyWork[], articles: Record<string, string>): Catalog {
  const taxonomy: Taxon[] = Object.entries(formats).map(([id, labels]) => ({
    id,
    kind: 'type',
    labels: { zh: labels[0], en: labels[1] },
    aliases: { zh: [], en: [] },
  }));
  for (const creator of new Set(entries.map((entry) => entry.creator))) {
    taxonomy.push({
      id: creatorId(creator),
      kind: 'creator',
      labels: { zh: creator, en: creator },
      aliases: { zh: [], en: [] },
    });
  }
  const works: Catalog['works'] = entries.map((entry, order) => {
    if (!articles[entry.slug]) throw new Error(`${entry.slug}: missing legacy article`);
    const { content } = parseFrontmatter(articles[entry.slug]);
    return {
      meta: {
        id: entry.slug,
        originalLocale: 'zh',
        order,
        sourceUrl: entry.url,
        typeId: entry.type,
        tagIds: [creatorId(entry.creator)],
        preview: {
          kind: entry.preview as Catalog['works'][number]['meta']['preview']['kind'],
          color: entry.color,
        },
        facts: [
          {
            key: 'author',
            kind: 'author',
            label: { zh: '作者', en: 'Creator' },
            value: { zh: entry.creator, en: entry.creator },
            target: { kind: 'tag', tagId: creatorId(entry.creator) },
          },
          {
            key: 'type',
            kind: 'type',
            label: { zh: '类型', en: 'Format' },
            value: { zh: formats[entry.type][0], en: formats[entry.type][1] },
            target: { kind: 'tag', tagId: entry.type },
          },
          {
            key: 'topic',
            kind: 'topic',
            label: { zh: '主题', en: 'Topic' },
            value: { zh: entry.note },
            target: { kind: 'anchor', anchor: 'reading' },
          },
        ],
        related: [],
      },
      versions: {
        zh: {
          file: `src/content/works/${entry.slug}/zh.md`,
          body: content,
          data: {
            locale: 'zh',
            status: 'published',
            title: entry.title,
            summary: entry.summary,
            description: entry.description,
            previewText: { eyebrow: entry.eyebrow, display: entry.display, note: entry.note },
          },
        },
      },
    };
  });
  const catalog = { works, taxonomy };
  validateCatalog(catalog);
  return catalog;
}

// 一次性迁移仅写入不存在的目标目录，避免重跑覆盖日常维护内容。
function migrate(): void {
  const target = 'src/content/works';
  if (existsSync(target) || existsSync('src/data/taxonomy.json'))
    throw new Error('迁移目标已存在；拒绝覆盖，请使用日常内容维护命令');
  const entries: LegacyWork[] = JSON.parse(readFileSync('src/data/works.json', 'utf8'));
  const articles = Object.fromEntries(
    entries.map((entry) => [
      entry.slug,
      readFileSync(`src/content/articles/${entry.slug}.md`, 'utf8'),
    ]),
  );
  const result = migrateEntries(entries, articles);
  for (const work of result.works) {
    const directory = join(target, work.meta.id);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'work.json'), JSON.stringify(work.meta, null, 2) + '\n');
    const version = work.versions.zh!;
    writeFileSync(
      join(directory, 'zh.md'),
      `---\n${Object.entries(version.data)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n')}\n---${version.body}`,
    );
  }
  writeFileSync('src/data/taxonomy.json', JSON.stringify(result.taxonomy, null, 2) + '\n');
  console.log(`迁移 ${result.works.length} 件中文原文；没有生成或发布英文译文。`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) migrate();
