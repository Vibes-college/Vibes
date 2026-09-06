import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { parseDocument } from '../../scripts/docs-frontmatter.ts';

const checker = resolve('scripts/docs-check.ts');

// 为临时仓库生成可解析、可冻结的文档。
function markdown(meta: Record<string, unknown>, body: string): string {
  return `---\n${Object.entries(meta)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n')}\n---\n\n${body}`;
}

// 临时仓库只包含最小规格和两个索引，不访问真实仓库内容或网络。
function fixture(status = 'merged'): { root: string; base: string } {
  const root = mkdtempSync(join(tmpdir(), 'vibes-docs-'));
  const living = { tense: 'living', describes: 'Current', status: 'current', 'shaped-by': ['001'] };
  const frozen = {
    tense: 'frozen',
    describes: 'Decision',
    status,
    'frozen-at': '2026-09-05',
    'amended-by': [],
  };
  const files = {
    'docs/features/example.md': markdown(living, '# Current\n'),
    'docs/features/README.md': markdown(living, '| [Example](example.md) | current | / | 001 |\n'),
    'specs/README.md': markdown(living, `| [001](001-example/spec.md) | ${status} | example |\n`),
    'specs/001-example/spec.md': markdown(
      { ...frozen, 'feature-ids': ['example'], amends: [], 'approved-artifacts': [] },
      '# Original intent\n',
    ),
    'specs/001-example/plan.md': markdown(frozen, '# Original plan\n'),
    'specs/001-example/tasks.md': markdown(
      frozen,
      '- [x] T001 更新docs/features/example.md最终行为，shaped-by；docs/features/README.md与specs/README.md\n',
    ),
  };
  for (const [path, source] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), source);
  }
  for (const args of [
    ['init', '-b', 'main'],
    ['add', '.'],
    [
      '-c',
      'user.name=Docs Test',
      '-c',
      'user.email=docs@example.invalid',
      'commit',
      '-m',
      'fixture',
    ],
  ]) {
    execFileSync('git', args, { cwd: root, stdio: 'ignore' });
  }
  const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  return { root, base };
}

// 真正启动CLI并检查退出码，验证保护没有停留在纯函数测试。
function run(
  root: string,
  base: string,
  args: string[] = [],
): { status: number | null; output: string } {
  const result = spawnSync(process.execPath, ['--experimental-strip-types', checker, ...args], {
    cwd: root,
    env: { ...process.env, DOCS_BASE_REF: base },
    encoding: 'utf8',
    timeout: 10000,
  });
  return { status: result.status, output: result.stdout + result.stderr };
}

// 基线已合并内容被篡改或删除时CLI必须失败，当前文档原地修订仍可通过。
test('docs CLI protects a real Git baseline, including deleted frozen files', () => {
  const { root, base } = fixture();
  try {
    const valid = run(root, base);
    assert.equal(valid.status, 0);
    assert.match(valid.output, /仅观察/);
    assert.doesNotMatch(valid.output, /触发裁剪|比例告警/);
    const path = join(root, 'specs/001-example/plan.md');
    const original = readFileSync(path, 'utf8');
    writeFileSync(path, original.replace('Original plan', 'Tampered plan'));
    const changed = run(root, base);
    assert.notEqual(changed.status, 0);
    assert.match(changed.output, /冻结正文/);
    writeFileSync(path, original);
    const livingPath = join(root, 'docs/features/example.md');
    writeFileSync(
      livingPath,
      readFileSync(livingPath, 'utf8') + '\nCurrent documented constraint.\n',
    );
    assert.equal(run(root, base).status, 0);
    rmSync(path);
    assert.notEqual(run(root, base).status, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// 未跟踪草稿也不能漏标签，基线错误不能变成跳过检查的后门。
test('docs CLI rejects missing metadata in untracked files and an unavailable baseline', () => {
  const { root, base } = fixture();
  try {
    const path = join(root, 'docs/extra.md');
    writeFileSync(path, '# Missing metadata\n');
    const missing = run(root, base);
    assert.notEqual(missing.status, 0);
    assert.match(missing.output, /front matter/);
    rmSync(path);
    const invalid = run(root, 'does-not-exist');
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.output, /基线不可读取/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// complete进入可信基线后与历史merged一样冻结，无需合并后再补状态提交。
test('docs CLI freezes complete specs in the real main baseline', () => {
  const { root, base } = fixture('complete');
  try {
    assert.equal(run(root, base).status, 0);
    const path = join(root, 'specs/001-example/plan.md');
    writeFileSync(path, readFileSync(path, 'utf8') + '\nChanged frozen intent.\n');
    assert.match(run(root, base).output, /冻结正文/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// 实际CLI必须抓住源码更新而文档未复核，不能只在纯函数样例中成立。
test('docs CLI catches source drift and uncovered additions in a real checkout', () => {
  const { root, base } = fixture();
  try {
    mkdirSync(join(root, 'src'));
    const source = join(root, 'src/a.ts');
    writeFileSync(source, 'export const answer = 1;\n');
    const path = join(root, 'docs/features/example.md');
    const page = parseDocument('docs/features/example.md', readFileSync(path, 'utf8'));
    const meta = { ...page.meta, 'code-sources': ['src/a.ts'], 'code-revision': 'pending' };
    writeFileSync(path, markdown(meta, page.body));
    assert.notEqual(run(root, base).status, 0);
    const printed = run(root, base, ['--revisions']);
    assert.equal(printed.status, 0);
    assert.match(readFileSync(path, 'utf8'), /pending/);
    const revision = JSON.parse(printed.output)['docs/features/example.md'];
    writeFileSync(path, markdown({ ...meta, 'code-revision': revision }, page.body));
    assert.equal(run(root, base).status, 0);
    writeFileSync(source, 'export const answer = 2;\n');
    const drift = run(root, base);
    assert.notEqual(drift.status, 0);
    assert.match(drift.output, /源码已变化/);
    writeFileSync(join(root, 'src/new.ts'), 'export {};\n');
    assert.match(run(root, base).output, /缺少对应说明/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// 分支上的complete仅表示实现就绪，进入main后才冻结，允许审阅时继续修订。
test('a complete branch remains editable until its commit reaches main', () => {
  const { root } = fixture('draft');
  const git = (args: string[]) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    git(['checkout', '-b', 'work']);
    for (const name of ['spec', 'plan', 'tasks']) {
      const path = join(root, `specs/001-example/${name}.md`);
      const parsed = parseDocument(path, readFileSync(path, 'utf8'));
      writeFileSync(path, markdown({ ...parsed.meta, status: 'complete' }, parsed.body));
    }
    const index = join(root, 'specs/README.md');
    writeFileSync(index, readFileSync(index, 'utf8').replace('| draft |', '| complete |'));
    git(['add', '.']);
    git([
      '-c',
      'user.name=Docs Test',
      '-c',
      'user.email=docs@example.invalid',
      'commit',
      '-m',
      'ready',
    ]);
    const ready = git(['rev-parse', 'HEAD']).trim();
    const plan = join(root, 'specs/001-example/plan.md');
    const original = readFileSync(plan, 'utf8');
    writeFileSync(plan, original + '\nReview adjustment.\n');
    assert.equal(run(root, ready).status, 0);
    writeFileSync(plan, original);
    git(['checkout', 'main']);
    git(['merge', '--ff-only', 'work']);
    writeFileSync(plan, original + '\nFrozen change.\n');
    assert.match(run(root, ready).output, /冻结正文/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
