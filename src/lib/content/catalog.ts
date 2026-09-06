import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parseFrontmatter } from 'astro/markdown';
import {
  languageSchema,
  workSchema,
  taxonomySchema,
  parseContent,
  type Catalog,
  type CatalogWork,
} from './schema.ts';
import { validateCatalog } from './validate.ts';

// CLI与Astro共用同一读取及校验入口，隔离测试可显式传入内容目录。
export function readCatalog(
  root = process.env.VIBES_CONTENT_DIR || 'src/content/works',
  taxonomyFile = process.env.VIBES_TAXONOMY_FILE || 'src/data/taxonomy.json',
): Catalog {
  const taxonomy = parseContent(
    taxonomySchema,
    JSON.parse(readFileSync(taxonomyFile, 'utf8')),
    taxonomyFile,
  );
  const works: CatalogWork[] = [];
  for (const folder of readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const directory = join(root, folder.name);
    const file = join(directory, 'work.json');
    const meta = parseContent(workSchema, JSON.parse(readFileSync(file, 'utf8')), file);
    if (meta.id !== folder.name) throw new Error(`${file}: id must match directory ${folder.name}`);
    const versions: CatalogWork['versions'] = {};
    for (const name of readdirSync(directory)) {
      if (name === 'work.json') continue;
      if (!['zh.md', 'en.md'].includes(name))
        throw new Error(`${directory}/${name}: unsupported language or content file`);
      const path = join(directory, name);
      const parsed = parseFrontmatter(readFileSync(path, 'utf8'));
      const data = parseContent(languageSchema, parsed.frontmatter, path);
      if (data.locale !== basename(name, '.md'))
        throw new Error(`${path}: locale must match filename`);
      if (!parsed.content.trim()) throw new Error(`${path}: empty article body`);
      versions[data.locale] = { data, body: parsed.content, file: path };
    }
    works.push({ meta, versions });
  }
  const catalog = { taxonomy, works: works.sort((a, b) => a.meta.order - b.meta.order) };
  validateCatalog(catalog);
  return catalog;
}
