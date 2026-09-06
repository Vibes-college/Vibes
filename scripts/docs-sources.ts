import { createHash } from 'node:crypto';
import { posix } from 'node:path';
import { listField, type Document } from './docs-frontmatter.ts';
import { featurePattern } from './docs-policy.ts';

// 结构和行为代码需要说明；作品正文与素材是内容，不要求每次日更改架构文档。
export function isImplementation(path: string): boolean {
  return (
    /^(src|scripts|tests)\/.*\.(ts|tsx|js|mjs|astro|css)$/.test(path) ||
    path === 'src/data/taxonomy.json' ||
    /^db\/.*\.sql$/.test(path) ||
    /^public\/(?:.*\.svg|_headers|_redirects)$/.test(path) ||
    /^[^/]+\.(json|jsonc|mjs|ts)$/.test(path) ||
    [
      '.gitignore',
      '.prettierignore',
      '.prettierrc.json',
      '.dev.vars.example',
      '.openai/hosting.json',
    ].includes(path) ||
    /^\.github\/workflows\/.*\.ya?ml$/.test(path)
  );
}

// 按路径和字节计算摘要；增加、删除、改名或内容变化都要求重新复核说明。
function revision(paths: string[], sources: Map<string, Buffer>): string {
  const hash = createHash('sha256');
  for (const path of [...paths].sort()) {
    const bytes = sources.get(path)!;
    hash.update(`${path}\0${bytes.length}\0`);
    hash.update(bytes);
  }
  return hash.digest('hex');
}

// 计算并校验说明对应的代码，打印摘要模式也保留路径与覆盖检查。
export function sourceRevisions(
  documents: Map<string, Document>,
  sources: Map<string, Buffer>,
  requireReviewed = true,
): Map<string, string> {
  const covered = new Set<string>();
  const revisions = new Map<string, string>();
  const outdated: string[] = [];
  for (const doc of documents.values()) {
    if (doc.meta.tense !== 'living') continue;
    const required =
      sources.size > 0 &&
      (featurePattern.test(doc.path) ||
        doc.path.startsWith('docs/system/') ||
        doc.path === 'docs/PROJECT_ANALYSIS.md');
    if (!required && doc.meta['code-sources'] === undefined) continue;
    const entries = listField(doc, 'code-sources');
    if (!entries.length) throw new Error(`${doc.path}: code-sources不能为空`);
    const paths = new Set<string>();
    for (const entry of entries) {
      if (
        !entry ||
        entry.startsWith('/') ||
        entry.includes('\\') ||
        entry.split('/').some((part) => part === '.' || part === '..')
      )
        throw new Error(`${doc.path}: 无效源码路径${entry}`);
      const matched = [...sources.keys()].filter((path) =>
        entry.endsWith('/') ? path.startsWith(entry) : path === entry,
      );
      if (!matched.length) throw new Error(`${doc.path}: 源码路径不存在或不属于实现代码${entry}`);
      for (const path of matched) {
        paths.add(path);
        covered.add(path);
      }
    }
    const expected = revision([...paths], sources);
    revisions.set(doc.path, expected);
    if (requireReviewed && doc.meta['code-revision'] !== expected)
      outdated.push(
        `${doc.path}: 对应源码已变化或尚未复核；核对说明后记录code-revision: '${expected}'`,
      );
  }
  const missing = [...sources.keys()].filter((path) => !covered.has(path));
  if (missing.length) throw new Error(`源码缺少对应说明：${missing.join(', ')}`);
  if (outdated.length) throw new Error(outdated.join('\n'));
  return revisions;
}

// 只检查现状文档的本地链接；历史规格可保留当时路径，外部网页不发网络请求。
export function validateLivingLinks(documents: Map<string, Document>, files: string[]): void {
  const known = new Set(files);
  for (const doc of documents.values()) {
    if (doc.meta.tense !== 'living') continue;
    for (const match of doc.body.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
      const clean = decodeURIComponent(target.split('#')[0]);
      const resolved = posix.normalize(posix.join(posix.dirname(doc.path), clean));
      const prefix = resolved.replace(/\/$/, '') + '/';
      if (!known.has(resolved) && !files.some((path) => path.startsWith(prefix)))
        throw new Error(`${doc.path}: 本地链接不存在${target}`);
    }
  }
}
