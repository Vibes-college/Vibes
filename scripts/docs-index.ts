import { listField, type Document } from './docs-frontmatter.ts';
import { featurePattern, specPattern } from './docs-policy.ts';

// 要求索引中有且只有真实目录的条目，并校验每一行的状态与功能映射。
function assertIndex(
  documents: Map<string, Document>,
  path: string,
  entries: Map<string, string>,
  spec = false,
): void {
  const index = documents.get(path);
  if (!index) throw new Error(`${path}: 缺少索引`);
  const rows = index.body.split('\n').filter((line) => line.startsWith('|'));
  const links = [...index.body.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
  const indexed = links.filter((link) =>
    spec ? /^[^/]+\/spec\.md$/.test(link) : /^[^/]+\.md$/.test(link),
  );
  const expected = [...entries.keys()].map((id) => (spec ? `${id}/spec.md` : `${id}.md`));
  if (JSON.stringify([...indexed].sort()) !== JSON.stringify(expected.sort()))
    throw new Error(`${path}: 索引与目录不一致或存在重复`);
  for (const [id, status] of entries) {
    const link = spec ? `${id}/spec.md` : `${id}.md`;
    const row = rows.find((line) => line.includes(`](${link})`));
    if (!row || !row.split('|').some((cell) => cell.trim() === status))
      throw new Error(`${path}: ${id}状态与文件不一致`);
    if (!spec) {
      const feature = documents.get(`docs/features/${id}.md`)!;
      const shaped = listField(feature, 'shaped-by').join(', ') || '—';
      if (!row.split('|').some((cell) => cell.trim() === shaped))
        throw new Error(`${path}: ${id}的shaped-by不一致`);
    }
    if (spec) {
      const source = documents.get(`specs/${id}/spec.md`)!;
      const names = listField(source, 'feature-ids').sort().join(', ');
      if (!row.split('|').some((cell) => cell.trim() === names))
        throw new Error(`${path}: ${id}影响功能不一致`);
    }
  }
}

// 当前说明可归并旧功能；每个编号只能归属一份真实文档，避免历史指向歧义。
function featureDocuments(documents: Map<string, Document>): Map<string, Document> {
  const result = new Map<string, Document>();
  for (const doc of documents.values()) {
    const id = doc.path.match(featurePattern)?.[1];
    if (!id) continue;
    const legacy =
      doc.meta['legacy-feature-ids'] === undefined ? [] : listField(doc, 'legacy-feature-ids');
    for (const key of [id, ...legacy]) {
      if (!/^[a-z][a-z0-9-]*$/.test(key)) throw new Error(`${doc.path}: 无效旧功能编号${key}`);
      if (result.has(key)) throw new Error(`${doc.path}: 功能编号${key}重复归属或与当前编号冲突`);
      result.set(key, doc);
    }
  }
  return result;
}

// 验证规格编号、互相修订关系、功能来源、合并清单及目录完整性。
export function validateIndexes(documents: Map<string, Document>): void {
  const resolvedFeatures = featureDocuments(documents);
  const features = new Map<string, string>();
  const specs = new Map<string, string>();
  const ids = new Map<string, Document>();
  const folders = new Set<string>();
  for (const doc of documents.values()) {
    const feature = doc.path.match(featurePattern)?.[1];
    if (feature) features.set(feature, String(doc.meta.status));
    const folder = doc.path.match(specPattern)?.[1];
    if (folder) folders.add(folder);
    if (folder && doc.path.endsWith('/spec.md')) {
      const id = folder.slice(0, 3);
      if (ids.has(id)) throw new Error(`specs: 重复编号${id}`);
      ids.set(id, doc);
      specs.set(folder, String(doc.meta.status));
    }
  }
  assertIndex(documents, 'docs/features/README.md', features);
  assertIndex(documents, 'specs/README.md', specs, true);
  for (const folder of folders) {
    if (!specs.has(folder)) throw new Error(`specs/${folder}: 缺少spec.md`);
  }
  for (const [id, spec] of ids) {
    for (const field of ['amends', 'amended-by']) {
      for (const other of listField(spec, field)) {
        const target = ids.get(other);
        if (
          other === id ||
          !target ||
          !listField(target, field === 'amends' ? 'amended-by' : 'amends').includes(id)
        ) {
          throw new Error(`${spec.path}: ${field}与${other}缺少双向关系或自引用`);
        }
      }
    }
    const folder = spec.path.slice(0, -'spec.md'.length);
    if (
      documents.has(`${folder}research.md`) &&
      (typeof spec.meta['research-trigger'] !== 'string' || !spec.meta['research-trigger'].trim())
    ) {
      throw new Error(`${spec.path}: research须记录技术未知或重要取舍的原因`);
    }

    const tasks = documents.get(`${folder}tasks.md`);
    const closed = ['complete', 'merged', 'superseded'].includes(String(spec.meta.status));
    if (closed && (!tasks || !documents.has(`${folder}plan.md`)))
      throw new Error(`${folder}: 合并规格缺少plan/tasks`);
    if (
      spec.meta.status === 'in-progress' &&
      tasks?.body.match(/^- \[x\]/m) &&
      !tasks.body.match(/^- \[ \]/m)
    )
      throw new Error(`${spec.path}: 全部任务已完成，须将实现状态更新为complete`);
    if (closed && tasks?.body.match(/^- \[ \]/m))
      throw new Error(`${tasks.path}: 合并清单仍有未完成项`);
    for (const doc of documents.values()) {
      if (doc.path.startsWith(folder) && doc.meta.status !== spec.meta.status)
        throw new Error(`${doc.path}: 状态与spec不一致`);
    }
    for (const feature of listField(spec, 'feature-ids')) {
      const doc = resolvedFeatures.get(feature);
      if (closed && !doc) throw new Error(`${spec.path}: 合并时影响功能${feature}不存在`);
      if (closed && doc && !listField(doc, 'shaped-by').includes(id))
        throw new Error(`${doc.path}: 缺少合并规格${id}的shaped-by`);
    }
  }
  for (const doc of documents.values()) {
    if (doc.meta.tense !== 'living') continue;
    for (const id of listField(doc, 'shaped-by'))
      if (!ids.has(id)) throw new Error(`${doc.path}: shaped-by引用未知规格${id}`);
  }
}
