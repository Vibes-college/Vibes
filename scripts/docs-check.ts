import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { assertFrozen, parseDocument, type Document } from './docs-frontmatter.ts';
import {
  countLines,
  documentReviewGuides,
  isExempt,
  reviewDocumentSize,
  validateDocument,
} from './docs-policy.ts';
import { validateIndexes } from './docs-index.ts';

// 使用参数数组调用Git，不将路径或环境值拼接成shell代码。
function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

// 解析可信检查基线；不可解析时失败，不静默跳过冻结检查。
function baseline(): string {
  const requested = process.env.DOCS_BASE_REF;
  const ref = requested && !/^0+$/.test(requested) ? requested : 'origin/main';
  try {
    return git(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim();
  } catch {
    throw new Error('冻结基线不可读取；fetch origin main或设置DOCS_BASE_REF为有效提交');
  }
}

// 逐份检查现状、目录索引与基线冻结文件，并输出可复核的文档/代码计量。
function main(): void {
  const files = [
    ...new Set(git(['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0')),
  ].filter((path) => path && existsSync(path));
  if (files.some((path) => path.startsWith('.scratch/')))
    throw new Error('.scratch临时文件不得提交');
  const documents = new Map<string, Document>();
  for (const path of files.filter(
    (file) => file.toLowerCase().endsWith('.md') && !isExempt(file),
  )) {
    documents.set(path, parseDocument(path, readFileSync(path, 'utf8')));
  }
  for (const doc of documents.values()) validateDocument(doc, documents);
  validateIndexes(documents);
  const base = baseline();
  for (const path of git(['ls-tree', '-r', '--name-only', '-z', base]).split('\0')) {
    if (!path.toLowerCase().endsWith('.md') || isExempt(path)) continue;
    const source = git(['show', `${base}:${path}`]);
    // 允许一次性迁移没有时态标签的既有文档，不把它们伪装为冻结记录。
    if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) continue;
    const old = parseDocument(path, source);
    if (old.meta.tense === 'frozen' && ['merged', 'superseded'].includes(String(old.meta.status))) {
      assertFrozen(old, documents.get(path));
    }
  }
  const lines = [...documents.values()].reduce((sum, doc) => sum + countLines(doc.source), 0);
  const code = files.filter(
    (path) => /^(src|scripts|tests)\//.test(path) && /\.(ts|tsx|js|mjs|astro|css|sh)$/.test(path),
  );
  const codeLines = code.reduce((sum, path) => sum + countLines(readFileSync(path, 'utf8')), 0);
  const ratio = codeLines ? (lines / codeLines).toFixed(2) : 'N/A（无自有代码）';
  const reviews = [...documents.values()].map(reviewDocumentSize).filter(Boolean);
  for (const path of code) {
    if (countLines(readFileSync(path, 'utf8')) > documentReviewGuides.code)
      reviews.push(`${path}: 超过300行，审阅职责和可测试性，不机械拆文件`);
  }
  for (const review of reviews) console.log(`篇幅审阅提示（不阻断CI）：${review}`);

  console.log(
    `docs:check通过：${documents.size}份文档，${lines}行；自有代码${codeLines}行；比例${ratio}（仅观察）；冻结基线${base.slice(0, 12)}`,
  );
}

// 以非零退出状态向npm和CI报告检查失败。
try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
