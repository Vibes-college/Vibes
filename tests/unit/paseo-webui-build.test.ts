import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildWebUI,
  sha256,
  verifySource,
  type UpstreamSource,
} from '../../scripts/paseo-webui-build.ts';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'paseo-build-'));
  const source = join(root, 'source');
  mkdirSync(source);
  const git = (...args: string[]) =>
    execFileSync('git', args, {
      cwd: source,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  writeFileSync(join(source, '.gitignore'), 'packages/app/dist/\nnode_modules/\n');
  writeFileSync(join(source, 'package-lock.json'), '{"lockfileVersion":3,"packages":{}}\n');
  writeFileSync(join(source, 'LICENSE'), 'Fixture license\n');
  writeFileSync(join(source, 'entry.txt'), 'original\n');
  git('init', '-b', 'main');
  git('remote', 'add', 'origin', 'https://example.invalid/upstream.git');
  git('add', '.');
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'source');
  const identity: UpstreamSource = {
    repository: git('remote', 'get-url', 'origin'),
    commit: git('rev-parse', 'HEAD'),
    version: 'test',
    lockfile: {
      path: 'package-lock.json',
      sha256: sha256(readFileSync(join(source, 'package-lock.json'))),
    },
    license: { path: 'LICENSE', sha256: sha256(readFileSync(join(source, 'LICENSE'))) },
  };
  const output = join(root, 'artifact');
  const exportWeb = () => {
    mkdirSync(join(source, 'packages/app/dist'), { recursive: true });
    writeFileSync(join(source, 'packages/app/dist/index.html'), '<script src="entry.js"></script>');
    writeFileSync(join(source, 'packages/app/dist/entry.js'), 'console.log(1)');
  };
  return { root, source, git, identity, output, exportWeb };
}

test('source identity rejects wrong SHA, remote, lockfile and dirty checkout', () => {
  const f = fixture();
  try {
    verifySource(f.source, f.identity);
    assert.throws(
      () => verifySource(f.source, { ...f.identity, commit: '0'.repeat(40) }),
      /commit/,
    );
    assert.throws(
      () => verifySource(f.source, { ...f.identity, repository: 'other' }),
      /repository/,
    );
    writeFileSync(join(f.source, 'package-lock.json'), '{}');
    assert.throws(() => verifySource(f.source, f.identity), /lockfile/);
    writeFileSync(join(f.source, 'package-lock.json'), '{"lockfileVersion":3,"packages":{}}\n');
    writeFileSync(join(f.source, 'unexpected.txt'), 'preserve me');
    assert.throws(() => verifySource(f.source, f.identity), /clean/);
    assert.equal(readFileSync(join(f.source, 'unexpected.txt'), 'utf8'), 'preserve me');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('failed or incomplete export invalidates an earlier artifact and never issues a receipt', () => {
  const f = fixture();
  try {
    buildWebUI({ ...f, patches: [] });
    assert.ok(existsSync(join(f.output, 'build-receipt.json')));
    assert.throws(
      () =>
        buildWebUI({
          ...f,
          patches: [],
          exportWeb: () => {
            throw new Error('export failed');
          },
        }),
      /export failed/,
    );
    assert.equal(existsSync(f.output), false);
    assert.throws(() => buildWebUI({ ...f, patches: [], exportWeb: () => {} }), /index.html/);
    assert.equal(existsSync(f.output), false);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('unknown output is preserved and source validation failure invalidates a known output', () => {
  const f = fixture();
  try {
    mkdirSync(f.output);
    writeFileSync(join(f.output, 'user.txt'), 'keep');
    assert.throws(() => buildWebUI({ ...f, patches: [] }), /unowned/);
    assert.equal(readFileSync(join(f.output, 'user.txt'), 'utf8'), 'keep');
    rmSync(f.output, { recursive: true });
    buildWebUI({ ...f, patches: [] });
    assert.throws(
      () => buildWebUI({ ...f, identity: { ...f.identity, commit: '0'.repeat(40) }, patches: [] }),
      /commit/,
    );
    assert.equal(existsSync(f.output), false);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('unexpected source edits during export are preserved and cannot issue a receipt', () => {
  const f = fixture();
  try {
    assert.throws(
      () =>
        buildWebUI({
          ...f,
          patches: [],
          exportWeb: () => {
            f.exportWeb();
            writeFileSync(join(f.source, 'entry.txt'), 'unexpected change\n');
          },
        }),
      /restoration failed/,
    );
    assert.equal(existsSync(f.output), false);
    assert.equal(readFileSync(join(f.source, 'entry.txt'), 'utf8'), 'unexpected change\n');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('patch content and context are checked, ordered patches replay and source restores after export', () => {
  const f = fixture();
  try {
    writeFileSync(join(f.source, 'entry.txt'), 'patched\n');
    const patch = f.git('diff') + '\n';
    writeFileSync(join(f.source, 'entry.txt'), 'original\n');
    const patchFile = join(f.root, 'change.patch');
    writeFileSync(patchFile, patch);
    const patches = [{ path: patchFile, sha256: sha256(Buffer.from(patch)) }];
    buildWebUI({
      ...f,
      patches,
      exportWeb: () => {
        assert.equal(readFileSync(join(f.source, 'entry.txt'), 'utf8'), 'patched\n');
        f.exportWeb();
      },
    });
    assert.equal(readFileSync(join(f.source, 'entry.txt'), 'utf8'), 'original\n');
    assert.equal(f.git('status', '--porcelain'), '');
    assert.throws(
      () => buildWebUI({ ...f, patches: [{ path: patchFile, sha256: '0'.repeat(64) }] }),
      /patch hash/,
    );
    assert.equal(existsSync(f.output), false);
    writeFileSync(patchFile, patch.replace('-original', '-nonexistent'));
    assert.throws(() =>
      buildWebUI({ ...f, patches: [{ path: patchFile, sha256: sha256(readFileSync(patchFile)) }] }),
    );
    assert.equal(existsSync(f.output), false);
    assert.equal(readFileSync(join(f.source, 'entry.txt'), 'utf8'), 'original\n');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});
