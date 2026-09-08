import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sha256 } from '../../scripts/paseo-webui-build.ts';
import {
  createPaseoManifest,
  summarizeSourceGraph,
  type SourceGraph,
} from '../../scripts/paseo-webui-manifest.ts';

const graph: SourceGraph = {
  schemaVersion: 1,
  platform: 'web',
  entries: ['index.ts'],
  modules: [
    {
      path: 'index.ts',
      sourceSha256: 'a'.repeat(64),
      dependencies: [
        { path: 'optional.ts', import: './optional', asyncType: 'async', optional: false },
      ],
    },
    { path: 'optional.ts', sourceSha256: 'b'.repeat(64), dependencies: [] },
  ],
};
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'paseo-manifest-'));
  const data = {
    'index.html': '<script src="/entry.js"></script>',
    'entry.js': 'console.log("entry");',
    'optional.js': 'console.log("optional");',
  };
  for (const [path, content] of Object.entries(data)) writeFileSync(join(directory, path), content);
  const receipt = {
    owner: 'vibes-paseo-webui',
    source: { commit: 'c'.repeat(40), lockfile: { sha256: 'd'.repeat(64) } },
    patches: [],
    files: Object.entries(data).map(([path, content]) => ({
      path,
      bytes: Buffer.byteLength(content),
      sha256: sha256(Buffer.from(content)),
    })),
  };
  return { directory, receipt, cleanup: () => rmSync(directory, { recursive: true, force: true }) };
}
test('manifest counts every script including deferred files and separates document entry', () => {
  const f = fixture();
  try {
    const manifest = createPaseoManifest(f.directory, f.receipt, graph);
    assert.equal(manifest.files.length, 3);
    assert.ok(manifest.scriptTotals.bytes > manifest.documentEntryScripts.bytes);
    assert.ok(manifest.scriptTotals.gzipBytes > manifest.documentEntryScripts.gzipBytes);
    assert.deepEqual(manifest.sourceGraph.synchronousModules, ['index.ts']);
    assert.equal(manifest.sourceGraph.deferredEdges.length, 1);
  } finally {
    f.cleanup();
  }
});
test('manifest rejects stale hashes, undeclared resources and unknown extensions', () => {
  const f = fixture();
  try {
    writeFileSync(join(f.directory, 'extra.js'), 'extra');
    assert.throws(() => createPaseoManifest(f.directory, f.receipt, graph), /Undeclared/);
    rmSync(join(f.directory, 'extra.js'));
    writeFileSync(join(f.directory, 'entry.js'), 'changed');
    assert.throws(() => createPaseoManifest(f.directory, f.receipt, graph), /hash\/size/);
    f.receipt.files.find((file) => file.path === 'entry.js')!.path = 'entry.bin';
    rmSync(join(f.directory, 'entry.js'));
    const content = Buffer.from('console.log("entry");');
    writeFileSync(join(f.directory, 'entry.bin'), content);
    assert.throws(() => createPaseoManifest(f.directory, f.receipt, graph), /Unclassified/);
  } finally {
    f.cleanup();
  }
});
test('manifest refuses symbolic links and incomplete source graphs', () => {
  const f = fixture();
  try {
    mkdirSync(join(f.directory, 'nested'));
    symlinkSync(join(f.directory, 'entry.js'), join(f.directory, 'nested/link.js'));
    assert.throws(() => createPaseoManifest(f.directory, f.receipt, graph), /symbolic links/);
    assert.throws(
      () => summarizeSourceGraph({ ...graph, modules: graph.modules.slice(0, 1) }),
      /Incomplete/,
    );
    assert.throws(() => summarizeSourceGraph({ ...graph, modules: [] }), /Missing/);
    assert.throws(
      () => summarizeSourceGraph({ ...graph, entries: ['unknown.ts'] }),
      /Unknown source entry/,
    );
  } finally {
    f.cleanup();
  }
});
