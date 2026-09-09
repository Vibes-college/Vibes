import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const moduleUrl = pathToFileURL(resolve('src/features/paseo-webui/build-config.ts')).href;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'paseo-config-'));
  const source = { commit: 'a'.repeat(40), lockfile: { sha256: 'b'.repeat(64) } };
  const patch = { path: 'third_party/paseo-webui/patches/test.patch', sha256: hash('fixed patch') };
  const profile = { source: [patch], dependencies: [] };
  const prefix =
    '/vendor/paseo/' +
    hash(JSON.stringify({ source: source.commit, patches: profile })).slice(0, 16);
  const dir = join(cwd, '.scratch/paseo-webui/artifacts/product');
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(cwd, 'third_party/paseo-webui/patches'), { recursive: true });
  writeFileSync(join(cwd, patch.path), 'fixed patch');
  writeFileSync(join(cwd, 'third_party/paseo-webui/upstream.json'), JSON.stringify(source));
  writeFileSync(join(cwd, 'third_party/paseo-webui/patches/series.json'), JSON.stringify(profile));
  const files = [
    [
      'index.html',
      `<script src="${prefix}/entry.js"></script><link rel="stylesheet" href="${prefix}/style.css">`,
    ],
    ['entry.js', 'native();'],
    ['style.css', 'body{}'],
    ['PASEO-LICENSE', 'Apache-2.0'],
    ['THIRD_PARTY_NOTICES.json', '{}'],
  ].map(([path, body]) => {
    writeFileSync(join(dir, path), body);
    return { path, bytes: Buffer.byteLength(body), sha256: hash(body) };
  });
  const receipt = {
    owner: 'vibes-paseo-webui',
    schemaVersion: 1,
    sandboxScriptHashes: ["'sha256-" + Buffer.alloc(32).toString('base64') + "'"],
    source,
    publicPath: prefix,
    patches: [{ sha256: patch.sha256 }],
    dependencyPatches: [],
    files,
  };
  const save = () => writeFileSync(join(dir, 'build-receipt.json'), JSON.stringify(receipt));
  save();
  return { cwd, dir, receipt, save, cleanup: () => rmSync(cwd, { recursive: true, force: true }) };
}
function run(cwd: string, overrides: Record<string, string | undefined> = {}) {
  const env = {
    ...process.env,
    VIBES_PASEO_PROFILE: undefined,
    VIBES_PASEO: undefined,
    VIBES_OUT_DIR: '.scratch/site',
    VIBES_DEPLOY: '0',
    ...overrides,
  };
  return spawnSync(
    process.execPath,
    [
      '--experimental-strip-types',
      '--input-type=module',
      '-e',
      `const {getPaseoBuild}=await import(${JSON.stringify(moduleUrl)});console.log(JSON.stringify(getPaseoBuild()?.config ?? null));`,
    ],
    { cwd, env, encoding: 'utf8' },
  );
}
test('product is enabled by default; disabled baseline cannot deploy; stale identity fails', () => {
  const f = fixture();
  try {
    assert.equal(run(f.cwd).status, 0);
    assert.equal(run(f.cwd, { VIBES_DEPLOY: '1' }).status, 0);
    assert.equal(run(f.cwd, { VIBES_PASEO: 'disabled' }).stdout.trim(), 'null');
    for (const env of [
      { VIBES_PASEO: 'unknown' },
      { VIBES_PASEO_PROFILE: 'H' },
      { VIBES_PASEO: 'disabled', VIBES_DEPLOY: '1' },
    ])
      assert.notEqual(run(f.cwd, env).status, 0);
    f.receipt.publicPath = '/vendor/paseo/0000000000000000';
    f.save();
    assert.match(run(f.cwd).stderr, /does not match/);
    rmSync(join(f.dir, 'build-receipt.json'));
    assert.match(run(f.cwd).stderr, /artifact is missing/);
  } finally {
    f.cleanup();
  }
});
test('product receipt rejects changed bytes, unknown resources and symlinks', () => {
  for (const mode of [
    'changed',
    'unknown',
    'symlink',
    'patch',
    'license',
    'duplicate',
    'sandbox',
  ]) {
    const f = fixture();
    try {
      if (mode === 'patch')
        writeFileSync(join(f.cwd, 'third_party/paseo-webui/patches/test.patch'), 'changed patch');
      if (mode === 'license') writeFileSync(join(f.dir, 'PASEO-LICENSE'), 'changed license');
      if (mode === 'duplicate') {
        f.receipt.files.push(f.receipt.files[0]);
        f.save();
      }
      if (mode === 'sandbox') {
        f.receipt.sandboxScriptHashes.push("'unsafe-inline'");
        f.save();
      }
      if (mode === 'changed') writeFileSync(join(f.dir, 'entry.js'), 'different();');
      if (mode === 'unknown') {
        writeFileSync(join(f.dir, 'unknown.bin'), 'x');
        f.receipt.files.push({ path: 'unknown.bin', bytes: 1, sha256: hash('x') });
        f.save();
      }
      if (mode === 'symlink') {
        const bytes = readFileSync(join(f.dir, 'entry.js'));
        writeFileSync(join(f.cwd, 'external.js'), bytes);
        rmSync(join(f.dir, 'entry.js'));
        symlinkSync(join(f.cwd, 'external.js'), join(f.dir, 'entry.js'));
      }
      assert.notEqual(run(f.cwd).status, 0, mode);
    } finally {
      f.cleanup();
    }
  }
});
