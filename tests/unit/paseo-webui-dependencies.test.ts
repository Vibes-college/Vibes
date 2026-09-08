import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  applyDependencyPatches,
  type DependencyPatch,
} from '../../scripts/paseo-webui-dependencies.ts';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function fixture() {
  const source = mkdtempSync(join(tmpdir(), 'paseo-deps-'));
  execFileSync('git', ['init', '-q'], { cwd: source });
  const name = 'node_modules/expo-router/example.js';
  mkdirSync(join(source, 'node_modules/expo-router'), { recursive: true });
  writeFileSync(join(source, name), 'original\n');
  const content = `diff --git a/${name} b/${name}\n--- a/${name}\n+++ b/${name}\n@@ -1 +1 @@\n-original\n+adapted\n`;
  const patch: DependencyPatch = {
    path: join(source, 'fixture.patch'),
    sha256: hash(content),
    files: [{ path: name, before: hash('original\n'), after: hash('adapted\n') }],
  };
  writeFileSync(patch.path, content);
  return { source, name, patch, content };
}

test('dependency edits restore original bytes before the next baseline build', () => {
  const f = fixture();
  try {
    const restore = applyDependencyPatches(f.source, [f.patch]);
    assert.equal(readFileSync(join(f.source, f.name), 'utf8'), 'adapted\n');
    restore();
    restore();
    assert.equal(readFileSync(join(f.source, f.name), 'utf8'), 'original\n');
  } finally {
    rmSync(f.source, { recursive: true, force: true });
  }
});

test('unknown input bytes, undeclared edits and patch corruption fail before mutation', () => {
  const f = fixture();
  try {
    assert.throws(
      () => applyDependencyPatches(f.source, [{ ...f.patch, sha256: hash('wrong') }]),
      /patch hash/,
    );
    assert.throws(() => applyDependencyPatches(f.source, [{ ...f.patch, files: [] }]), /file list/);
    writeFileSync(join(f.source, f.name), 'user change\n');
    assert.throws(() => applyDependencyPatches(f.source, [f.patch]), /before hash/);
    assert.equal(readFileSync(join(f.source, f.name), 'utf8'), 'user change\n');
  } finally {
    rmSync(f.source, { recursive: true, force: true });
  }
});

test('a later patch failure restores earlier patches; unexpected subsequent edits are preserved', () => {
  const f = fixture();
  try {
    assert.throws(
      () => applyDependencyPatches(f.source, [f.patch, { ...f.patch, sha256: hash('wrong') }]),
      /patch hash/,
    );
    assert.equal(readFileSync(join(f.source, f.name), 'utf8'), 'original\n');
    const restore = applyDependencyPatches(f.source, [f.patch]);
    writeFileSync(join(f.source, f.name), 'concurrent change\n');
    assert.throws(restore, /after hash/);
    assert.equal(readFileSync(join(f.source, f.name), 'utf8'), 'concurrent change\n');
  } finally {
    rmSync(f.source, { recursive: true, force: true });
  }
});
