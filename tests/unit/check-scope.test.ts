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
    'src/pages/index.astro',
    'db/seed.sql',
    'package-lock.json',
    '.github/workflows/check.yml',
    'scripts/check-scope.ts',
    'scripts/test-e2e.ts',
    '.agents/skills/example/scripts/check.ts',
    '.agents/skills/example/check.sh',
    '.specify/presets/vibes/scripts/build.sh',
    '.specify/workflows/steps/check.py',
    '.specify/scripts/bash/setup-plan.sh',
    '.specify/init-options.json',
    'unknown.md',
  ]) {
    assert.equal(classifyChanges(['docs/README.md', path]), 'full', path);
  }
  assert.equal(classifyChanges(['src/content/works/a/zh.md']), 'content');
  assert.equal(classifyChanges(['src/content/works/a/zh.md', 'scripts/docs-check.ts']), 'full');
  assert.equal(classifyChanges([]), 'full');
});

test('agent guidance stays lightweight, including mixed rule documents and generated files', () => {
  const guidance = [
    'AGENTS.md',
    '.github/pull_request_template.md',
    '.agents/skills/speckit-plan/SKILL.md',
    '.agents/skills/example/references/guide.md',
    '.specify/templates/overrides/plan-template.md',
    '.specify/presets/vibes/preset.yml',
    '.specify/presets/vibes/commands/speckit.plan.md',
    '.specify/presets/vibes/references/hooks.md',
    '.specify/presets/.registry',
    '.specify/workflows/speckit/workflow.yml',
    '.specify/workflows/overlays/speckit/scoped-execution.yml',
    '.specify/workflows/workflow-registry.json',
    '.specify/integrations/codex.manifest.json',
  ];
  for (const path of guidance) assert.equal(classifyChanges([path]), 'docs', path);
  assert.equal(classifyChanges(guidance), 'docs');
  assert.equal(classifyChanges([...guidance, 'scripts/docs-policy.ts']), 'tools');
  for (const path of [
    'src/pages/index.astro',
    'package-lock.json',
    '.github/workflows/check.yml',
  ]) {
    assert.equal(classifyChanges([...guidance, path]), 'full', path);
  }
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

test('content classification inspects both sides, rejects mixed code and follows cumulative base', () => {
  const root = mkdtempSync(join(tmpdir(), 'vibes-content-scope-'));
  const git = (args: string[]) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  const article = join(root, 'src/content/works/example/zh.mdx');
  try {
    mkdirSync(join(root, 'src/content/works/example'), { recursive: true });
    writeFileSync(article, '# Before');
    git(['init', '-b', 'main']);
    git(['add', '.']);
    git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'base']);
    const base = git(['rev-parse', 'HEAD']);
    writeFileSync(article, '# After\n\n<details>\n<summary>More</summary>\n\nText\n\n</details>');
    assert.equal(changedScope(base, root), 'content');
    writeFileSync(article, 'export const execution = 1;\n\n# Text');
    assert.equal(changedScope(base, root), 'full');
    assert.equal(
      changedScope(base, root, false),
      'content',
      'path candidate is not syntax approval',
    );
    git(['add', '.']);
    git([
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.invalid',
      'commit',
      '-m',
      'executable',
    ]);
    const executable = git(['rev-parse', 'HEAD']);
    rmSync(article);
    assert.equal(
      changedScope(executable, root),
      'full',
      'removing executable MDX needs full regression',
    );
    writeFileSync(article, '# Safe');
    assert.equal(changedScope(executable, root), 'full', 'previous execution is part of the diff');
    assert.equal(changedScope(base, root), 'content');
    writeFileSync(join(root, 'src/code.ts'), 'export const x=1');
    assert.equal(changedScope(base, root), 'full');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
