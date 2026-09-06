import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { checkMode, requireProduction } from '../../scripts/ci-policy.ts';
import { prepareArtifact, verifyArtifact } from '../../scripts/release-artifact.ts';
import { requireCleanup, type CleanupState } from '../../scripts/cleanup-policy.ts';
import { validateLessons } from '../../scripts/docs-lessons.ts';
import { parseDocument, assertFrozen } from '../../scripts/docs-frontmatter.ts';

const sha = 'a'.repeat(40);

test('draft and ready events are distinct, branch push cannot trigger required checks', () => {
  assert.equal(checkMode({ name: 'pull_request', ref: 'refs/pull/3/merge', draft: true }), 'draft');
  assert.equal(
    checkMode({ name: 'pull_request', ref: 'refs/pull/3/merge', draft: false }),
    'required',
  );
  assert.equal(checkMode({ name: 'push', ref: 'refs/heads/codex/feature' }), 'none');
  assert.equal(checkMode({ name: 'push', ref: 'refs/heads/main' }), 'required');
});

test('production rejects non-main, obsolete SHA and failed or skipped checks', () => {
  const event = { name: 'push', ref: 'refs/heads/main' };
  assert.doesNotThrow(() => requireProduction(event, sha, sha, ['success', 'success']));
  for (const name of ['pull_request', 'workflow_dispatch', 'workflow_run'])
    assert.throws(() => requireProduction({ ...event, name }, sha, sha, ['success', 'success']));
  assert.throws(() =>
    requireProduction({ ...event, ref: 'refs/heads/codex/f' }, sha, sha, ['success', 'success']),
  );
  assert.throws(() => requireProduction(event, sha, 'b'.repeat(40), ['success', 'success']));
  for (const result of ['failure', 'skipped', 'cancelled', ''])
    assert.throws(() => requireProduction(event, sha, sha, ['success', result]));
});

test('release artifact detects wrong SHA, missing pages and modified assets', () => {
  const dir = mkdtempSync(join(tmpdir(), 'vibes-release-'));
  try {
    for (const locale of ['zh', 'en']) mkdirSync(join(dir, locale));
    for (const page of ['index.html', 'zh/index.html', 'en/index.html'])
      writeFileSync(join(dir, page), '<html>' + 'x'.repeat(120));
    prepareArtifact(sha, dir);
    assert.doesNotThrow(() => verifyArtifact(sha, dir));
    assert.throws(() => verifyArtifact('b'.repeat(40), dir));
    writeFileSync(join(dir, 'new.txt'), 'changed');
    assert.throws(() => verifyArtifact(sha, dir));
    rmSync(join(dir, 'new.txt'));
    rmSync(join(dir, 'zh/index.html'));
    assert.throws(() => verifyArtifact(sha, dir));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('cleanup refuses unmerged, failed deployment, extra commits, dirt and occupancy', () => {
  const state: CleanupState = {
    merged: true,
    branch: 'codex/feature',
    prHead: sha,
    branchHead: sha,
    deployed: true,
    mergeInDeployment: true,
    dirty: false,
    idle: true,
    dependentPrs: 0,
  };
  assert.doesNotThrow(() => requireCleanup(state));
  for (const change of [
    { merged: false },
    { deployed: false },
    { mergeInDeployment: false },
    { dirty: true },
    { idle: false },
    { dependentPrs: 1 },
    { branch: 'main' },
    { branchHead: 'b'.repeat(40) },
  ])
    assert.throws(() => requireCleanup({ ...state, ...change }));
});

// 只构造测试文档，不操作真实经验记录。
function lessons(body: string) {
  return parseDocument(
    'docs/LESSONS.md',
    `---\ntense: 'living'\ndescribes: '经验'\nstatus: 'current'\nshaped-by: []\n---\n${body}`,
  );
}

test('lessons enforces three lines, 30 entries and conversion evidence', () => {
  const item =
    '- [2026-09-06] 现象：失败｜证据：PR#3\n  原因：缺少验证\n  转化：增加测试｜状态：待转化\n';
  assert.doesNotThrow(() => validateLessons(lessons('## 待转化\n' + item.repeat(30))));
  assert.throws(() => validateLessons(lessons('## 待转化\n' + item.repeat(31))));
  assert.throws(() =>
    validateLessons(lessons('## 待转化\n' + item.replace('  原因：缺少验证\n', ''))),
  );
  assert.throws(() =>
    validateLessons(lessons('## 已转化\n' + item.replace('状态：待转化', '状态：已转化'))),
  );
  assert.doesNotThrow(() =>
    validateLessons(
      lessons(
        '## 已转化\n' +
          item.replace('｜状态：待转化', '｜验证：test通过｜转化日期：2026-09-06｜状态：已转化'),
      ),
    ),
  );
});

test('decision migration preserves historical body and later decisions remain append-only', () => {
  const source =
    "---\ntense: 'frozen'\ndescribes: '原则决策'\nstatus: 'complete'\namended-by: []\n---\n## L-001\nOriginal\n";
  const old = parseDocument('docs/LESSONS.md', source);
  const migrated = parseDocument('docs/DECISIONS.md', source + '\n## L-002\nNext\n');
  assert.doesNotThrow(() => assertFrozen(old, migrated));
  assert.throws(() =>
    assertFrozen(old, parseDocument('docs/DECISIONS.md', source.replace('Original', 'Rewrite'))),
  );
  assert.doesNotThrow(() =>
    assertFrozen(
      migrated,
      parseDocument('docs/DECISIONS.md', migrated.source + '\n## L-003\nNext\n'),
    ),
  );
  assert.throws(() => assertFrozen(migrated, old));
});
