import { validateMedia } from '../media/validate.ts';
import { validateMediaFiles } from '../media/files.ts';
import { locales, type Catalog } from './schema.ts';
import { parseLearningBody } from './learning.ts';
import { validateLearningFiles } from './learning-files.ts';
import { resolveGlossary } from './glossary.ts';

// 校验跨文件身份、引用和发布关系，拒绝重复或静默修复坏数据。
export function validateCatalog(catalog: Catalog): void {
  const tags = new Map(catalog.taxonomy.map((tag) => [tag.id, tag]));
  if (tags.size !== catalog.taxonomy.length) throw new Error('taxonomy.json: duplicate tag id');
  const aliases = new Map<string, string>();
  for (const tag of catalog.taxonomy) {
    for (const locale of locales) {
      for (const alias of [tag.id, tag.labels[locale], ...tag.aliases[locale]]) {
        const key = `${locale}:${alias.normalize('NFKC').trim().toLocaleLowerCase()}`;
        const existing = aliases.get(key);
        if (existing && existing !== tag.id)
          throw new Error(`taxonomy.json: alias ${alias} conflicts between ${existing}/${tag.id}`);
        aliases.set(key, tag.id);
      }
    }
  }
  const ids = new Set(catalog.works.map((work) => work.meta.id));
  const orders = new Set(catalog.works.map((work) => work.meta.order));
  if (ids.size !== catalog.works.length) throw new Error('content/works: duplicate work id');
  if (orders.size !== catalog.works.length) throw new Error('content/works: duplicate order');
  const pairs = new Set<string>();
  for (const { meta, versions, glossary } of catalog.works) {
    const file = `content/works/${meta.id}/work.json`;
    try {
      validateMedia(meta.media || [], meta.presentation);
      validateMediaFiles(meta.media || []);
      if (meta.learning) validateLearningFiles(meta.learning.media);
    } catch (error) {
      throw new Error(`${file}: ${error instanceof Error ? error.message : error}`, {
        cause: error,
      });
    }
    const original = versions[meta.originalLocale];
    if (!original) throw new Error(`${file}: missing original language ${meta.originalLocale}`);
    if (tags.get(meta.typeId)?.kind !== 'type')
      throw new Error(`${file}: unknown typeId ${meta.typeId}`);
    if (new Set(meta.tagIds).size !== meta.tagIds.length)
      throw new Error(`${file}: duplicate tagIds`);
    for (const id of meta.tagIds) if (!tags.has(id)) throw new Error(`${file}: missing tag ${id}`);
    for (const version of Object.values(versions)) {
      if (Boolean(meta.learning) !== Boolean(version.data.learning))
        throw new Error(`${version.file}: learning metadata and text must appear together`);
      if (meta.learning) {
        if (meta.id !== `great-ui-${meta.learning.slug}` || !ids.has(meta.learning.collectionId))
          throw new Error(`${file}: learning identity or collection is invalid`);
        if (version.file.endsWith('.mdx'))
          throw new Error(`${version.file}: learning uses Markdown`);
        const body = parseLearningBody(version.body, version.file);
        try {
          resolveGlossary(version.data.learning!.glossary, glossary);
        } catch (error) {
          throw new Error(`${version.file}: ${error instanceof Error ? error.message : error}`, {
            cause: error,
          });
        }
        for (const match of JSON.stringify(body).matchAll(/\[\[([^|]+)\|[^\]]+\]\]/g))
          if (!version.data.learning!.glossary[match[1]])
            throw new Error(`${version.file}: unknown learning term ${match[1]}`);
      }
      try {
        validateMedia(meta.media || [], meta.presentation, version.data.mediaText || {});
      } catch (error) {
        throw new Error(`${version.file}: ${error instanceof Error ? error.message : error}`, {
          cause: error,
        });
      }
      if (version.data.locale !== meta.originalLocale && version.data.status === 'published') {
        if (original.data.status !== 'published')
          throw new Error(`${version.file}: cannot publish translation before original`);
        if (!version.data.sourceRevision)
          throw new Error(
            `${version.file}: published translation requires reviewed sourceRevision`,
          );
      }
    }
    const keys = new Set<string>();
    for (const fact of meta.facts) {
      if (keys.has(fact.key)) throw new Error(`${file}: duplicate fact key ${fact.key}`);
      keys.add(fact.key);
      if (!fact.label[meta.originalLocale] || !fact.value[meta.originalLocale])
        throw new Error(`${file}: fact ${fact.key} needs original label/value`);
      if (fact.target?.kind === 'tag' && !tags.has(fact.target.tagId))
        throw new Error(`${file}: fact ${fact.key} references unknown tag`);
    }
    for (const relation of meta.related) {
      if (relation.targetId === meta.id || !ids.has(relation.targetId))
        throw new Error(`${file}: related target ${relation.targetId} is self or missing`);
      if (!relation.reason[meta.originalLocale])
        throw new Error(`${file}: relation needs original reason`);
      const pair = [meta.id, relation.targetId].sort().join(':');
      if (pairs.has(pair)) throw new Error(`${file}: duplicate undirected relation ${pair}`);
      pairs.add(pair);
    }
  }
}
