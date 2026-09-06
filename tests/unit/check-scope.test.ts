import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { changedScope, classifyChanges } from '../../scripts/check-scope.ts';

test('check scope limits only known documentation and document tools', () => {
  assert.equal(
    classifyChanges(['AGENTS.md', 'docs/features/example.md', 'specs/001-a/plan.md']),
    'docs',
  );
  assert.equal(
    classifyChanges(['docs/README.md', 'scripts/docs-policy.ts', 'tests/unit/docs-policy.test.ts']),
    'tools',
  );
  for (const path of [
    'src/content/works/a/zh.md',
    'src/pages/index.astro',
    'db/seed.sql',
    'package-lock.json',
    '.github/workflows/check.yml',
    'scripts/check-scope.ts',
    'scripts/test-e2e.ts',
    'unknown.md',
  ]) {
    assert.equal(classifyChanges(['docs/README.md', path]), 'full', path);
  }
  assert.equal(classifyChanges([]), 'full');
});

test('real Git changes include deletions, rename sources and untracked website files', () => {
  const root = mkdtempSync(join(tmpdir(), 'vibes-scope-'));
  const git = (args: string[]) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  try {
    mkdirSync(join(root, 'docs'));
    mkdirSync(join(root, 'src'));
    writeFileSync(join(root, 'docs/README.md'), 'docs');
    writeFileSync(join(root, 'src/page.ts'), 'code');
    git(['init', '-b', 'main']);
    git(['add', '.']);
    git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'base']);
    const base = git(['rev-parse', 'HEAD']);
    writeFileSync(join(root, 'docs/README.md'), 'updated');
    assert.equal(changedScope(base, root), 'docs');
    git(['mv', 'src/page.ts', 'docs/page.md']);
    assert.equal(changedScope(base, root), 'full');
    git(['reset', '--hard', base]);
    writeFileSync(join(root, 'src/new.ts'), 'new');
    assert.equal(changedScope(base, root), 'full');
    rmSync(join(root, 'src/new.ts'));
    rmSync(join(root, 'src/page.ts'));
    assert.equal(changedScope(base, root), 'full');
    assert.equal(changedScope('missing-ref', root), 'full');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
