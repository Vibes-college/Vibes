export type Metadata = Record<string, string | string[]>;
export type Document = { path: string; source: string; body: string; meta: Metadata };

// 解析Prettier兼容的单行引号字符串或无歧义普通字符串。
function scalar(raw: string, path: string): string {
  if (raw.startsWith('"')) {
    try {
      const value: unknown = JSON.parse(raw);
      if (typeof value === 'string') return value;
    } catch {
      /* 统一报告格式错误。 */
    }
    throw new Error(`${path}: 无效双引号字符串`);
  }
  if (raw.startsWith("'")) {
    if (!/^'(?:[^']|'')*'$/.test(raw)) throw new Error(`${path}: 无效单引号字符串`);
    return raw.slice(1, -1).replaceAll("''", "'");
  }
  if (!raw || /[\n\r[\]{}#]/.test(raw)) throw new Error(`${path}: 只允许简单字符串或字符串数组`);
  return raw;
}

// 读取可跨行的flow字符串数组，拒绝嵌套、缺少逗号或未闭合项。
function valueOf(raw: string, path: string): string | string[] {
  if (!raw.startsWith('[')) return scalar(raw, path);
  if (!raw.endsWith(']')) throw new Error(`${path}: 数组未闭合`);
  let rest = raw.slice(1, -1).trim();
  const values: string[] = [];
  while (rest) {
    const item = rest.match(/^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[a-zA-Z0-9_-]+)\s*(,|$)/);
    if (!item) throw new Error(`${path}: 只允许简单字符串数组`);
    values.push(scalar(item[1], path));
    rest = rest.slice(item[0].length).trim();
  }
  return values;
}

// 解析简单YAML front matter，支持Prettier的引号/跨行flow数组并拒绝重复字段。
export function parseDocument(path: string, source: string): Document {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${path}: 缺少front matter`);
  const meta: Metadata = {};
  const lines = match[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim() || lines[i].startsWith('#')) continue;
    const field = lines[i].match(/^([a-z][a-z0-9-]*):\s*(.*)$/);
    if (!field || Object.hasOwn(meta, field[1]))
      throw new Error(`${path}: 无效或重复的front matter字段`);
    let raw = field[2].trim();
    while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) raw += ' ' + lines[++i].trim();
    meta[field[1]] = valueOf(raw.trim(), path);
  }
  return { path, source, body: source.slice(match[0].length), meta };
}

// 读取并验证数组字段，避免字符串被当作关系列表。
export function listField(doc: Document, key: string): string[] {
  const value = doc.meta[key];
  if (!Array.isArray(value) || new Set(value).size !== value.length) {
    throw new Error(`${doc.path}: ${key}须为无重复字符串数组`);
  }
  return value;
}

// 冻结文件只允许状态及后续修订关系变化，禁止回退成草稿逃避保护。
export function assertFrozen(previous: Document, current?: Document): void {
  if (!current) throw new Error(`${previous.path}: 冻结文件不得删除或改名`);
  const before = Object.fromEntries(
    Object.entries(previous.meta).filter(
      ([key]) =>
        !['status', 'amended-by'].includes(key) &&
        !(key === 'frozen-at' && previous.meta['frozen-at'] === undefined),
    ),
  );
  const after = Object.fromEntries(
    Object.entries(current.meta).filter(
      ([key]) =>
        !['status', 'amended-by'].includes(key) &&
        !(key === 'frozen-at' && previous.meta['frozen-at'] === undefined),
    ),
  );
  if (
    JSON.stringify(Object.entries(before).sort()) !== JSON.stringify(Object.entries(after).sort())
  ) {
    throw new Error(`${previous.path}: 冻结后仅可改status/amended-by或首次补记真实frozen-at`);
  }
  if (!['complete', 'merged', 'superseded'].includes(String(current.meta.status)))
    throw new Error(`${previous.path}: 冻结状态不可回退`);
  if (previous.meta.status === 'superseded' && current.meta.status !== 'superseded')
    throw new Error(`${previous.path}: superseded不可恢复`);
  const lessons = ['docs/LESSONS.md', 'docs/DECISIONS.md'].includes(previous.path);
  if (lessons ? !current.body.startsWith(previous.body) : previous.body !== current.body) {
    throw new Error(
      `${previous.path}: 冻结正文不可修改${lessons ? '，决策历史仅可末尾追加条目' : ''}`,
    );
  }
  const oldLinks = listField(previous, 'amended-by');
  const newLinks = listField(current, 'amended-by');
  if (oldLinks.some((id) => !newLinks.includes(id)))
    throw new Error(`${previous.path}: amended-by只许追加`);
}
