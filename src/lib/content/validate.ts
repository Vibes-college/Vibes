import { locales, type Catalog } from './schema.ts';

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
  for (const { meta, versions } of catalog.works) {
    const file = `content/works/${meta.id}/work.json`;
    const original = versions[meta.originalLocale];
    if (!original) throw new Error(`${file}: missing original language ${meta.originalLocale}`);
    if (tags.get(meta.typeId)?.kind !== 'type')
      throw new Error(`${file}: unknown typeId ${meta.typeId}`);
    if (new Set(meta.tagIds).size !== meta.tagIds.length)
      throw new Error(`${file}: duplicate tagIds`);
    for (const id of meta.tagIds) if (!tags.has(id)) throw new Error(`${file}: missing tag ${id}`);
    for (const version of Object.values(versions)) {
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
