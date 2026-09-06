import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { productionScope, changedScope } from '../../scripts/check-scope.ts';
import { isInside, protectedIgnored } from '../../scripts/cleanup-policy.ts';

// 临时仓库覆盖真实提交与忽略规则；所有Git操作限定cwd，不访问远端。
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'vibes-delivery-'));
  const git = (args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  git(['init', '-b', 'main']);
  git(['config', 'user.email', 'test@example.invalid']);
  git(['config', 'user.name', 'Delivery Test']);
  mkdirSync(join(root, 'src'));
  writeFileSync(join(root, 'src/page.ts'), 'old');
  git(['add', '.']);
  git(['commit', '-m', 'deployed']);
  return { root, git, deployed: git(['rev-parse', 'HEAD']) };
}

test('main cumulative scope retains an unpublished website change before a later docs commit', async (t) => {
  const { root, git, deployed } = fixture();
  try {
    writeFileSync(join(root, 'src/page.ts'), 'new');
    git(['commit', '-am', 'website A']);
    const a = git(['rev-parse', 'HEAD']);
    mkdirSync(join(root, 'docs'));
    writeFileSync(join(root, 'docs/note.md'), 'B');
    git(['add', '.']);
    git(['commit', '-m', 'docs B']);
    assert.equal(changedScope(a, root), 'docs');
    t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ sha: deployed })));
    assert.equal(await productionScope(root), 'full');
    t.mock.restoreAll();
    t.mock.method(globalThis, 'fetch', async () => new Response('not available', { status: 404 }));
    assert.equal(await productionScope(root), 'full');
  } finally {
    t.mock.restoreAll();
    rmSync(root, { recursive: true, force: true });
  }
});

test('ignored credentials in a real clean worktree are protected, including cwd symlink and child', () => {
  const { root, git } = fixture();
  const tree = root + '-worktree';
  try {
    git(['worktree', 'add', '-b', 'codex/test', tree]);
    writeFileSync(join(tree, '.gitignore'), '.dev.vars\nnode_modules/\n');
    execFileSync('git', ['add', '.gitignore'], { cwd: tree });
    execFileSync('git', ['commit', '-m', 'ignore local config'], { cwd: tree });
    writeFileSync(join(tree, '.dev.vars'), 'TEST_SECRET=fixture-only');
    assert.equal(
      execFileSync('git', ['status', '--porcelain'], { cwd: tree, encoding: 'utf8' }).trim(),
      '',
    );
    const ignored = execFileSync(
      'git',
      ['ls-files', '--others', '--ignored', '--exclude-standard', '-z'],
      { cwd: tree, encoding: 'utf8' },
    )
      .split('\0')
      .filter(Boolean);
    assert.deepEqual(protectedIgnored(ignored), ['.dev.vars']);
    assert.deepEqual(protectedIgnored(['node_modules/a.js', 'dist/index.html']), []);
    mkdirSync(join(tree, 'child'));
    assert.equal(isInside(tree, join(tree, 'child')), true);
    symlinkSync(tree, join(root, 'linked'));
    assert.equal(isInside(tree, join(root, 'linked')), true);
    assert.equal(isInside(tree, root), false);
  } finally {
    rmSync(tree, { recursive: true, force: true });
    rmSync(root, { recursive: true, force: true });
  }
});
