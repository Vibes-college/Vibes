import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  parsePaseoAssetConfig,
  paseoResourceKind,
  type PaseoAssetConfig,
} from './asset-contract.ts';

interface ArtifactFile {
  path: string;
  bytes: number;
  sha256: string;
}
export interface PaseoBuild {
  directory: string;
  config: PaseoAssetConfig;
  files: ArtifactFile[];
  sandboxScriptHashes: string[];
}
export function getPaseoBuild(): PaseoBuild | null {
  const mode = process.env.VIBES_PASEO;
  if (mode === 'disabled') {
    if (process.env.VIBES_DEPLOY === '1')
      throw new Error('Production builds must include the native assistant.');
    return null;
  }
  if (mode && mode !== 'enabled') throw new Error('VIBES_PASEO must be enabled or disabled.');
  if (process.env.VIBES_PASEO_PROFILE)
    throw new Error('Retired Paseo build profiles are not supported.');
  const directory = resolve('.scratch/paseo-webui/artifacts/product');
  if (!existsSync(join(directory, 'build-receipt.json')))
    throw new Error(
      'Native assistant artifact is missing. Run npm run paseo:build with the fixed independent source prepared.',
    );
  if (lstatSync(directory).isSymbolicLink())
    throw new Error('Native artifact cannot be a symlink.');
  const receipt = JSON.parse(readFileSync(join(directory, 'build-receipt.json'), 'utf8'));
  const identity = JSON.parse(
    readFileSync(resolve('third_party/paseo-webui/upstream.json'), 'utf8'),
  );
  const patches = JSON.parse(
    readFileSync(resolve('third_party/paseo-webui/patches/series.json'), 'utf8'),
  );
  for (const patch of [...patches.source, ...patches.dependencies]) {
    const path = resolve(patch.path);
    if (
      !path.startsWith(resolve('third_party/paseo-webui/patches') + '/') ||
      realpathSync(path) !== path ||
      createHash('sha256').update(readFileSync(path)).digest('hex') !== patch.sha256
    )
      throw new Error('Declared native patch changed.');
  }
  const expectedPrefix =
    '/vendor/paseo/' +
    createHash('sha256')
      .update(JSON.stringify({ source: identity.commit, patches }))
      .digest('hex')
      .slice(0, 16);
  if (
    receipt.publicPath !== expectedPrefix ||
    receipt.owner !== 'vibes-paseo-webui' ||
    receipt.schemaVersion !== 1 ||
    JSON.stringify(receipt.source) !== JSON.stringify(identity) ||
    JSON.stringify(receipt.patches) !==
      JSON.stringify(
        patches.source.map((patch: { sha256: string }) => ({ sha256: patch.sha256 })),
      ) ||
    JSON.stringify(receipt.dependencyPatches) !==
      JSON.stringify(
        patches.dependencies.map((patch: { sha256: string; files: unknown }) => ({
          sha256: patch.sha256,
          files: patch.files,
        })),
      )
  )
    throw new Error('Native artifact does not match the declared source and patches.');
  const sandboxScriptHashes: unknown = receipt.sandboxScriptHashes ?? [];
  if (
    !Array.isArray(sandboxScriptHashes) ||
    sandboxScriptHashes.some(
      (hash) => typeof hash !== 'string' || !/^'sha256-[A-Za-z0-9+/]{43}='$/.test(hash),
    ) ||
    sandboxScriptHashes.length !== 1
  )
    throw new Error('Invalid native sandbox script hashes.');
  if (
    !Array.isArray(receipt.files) ||
    receipt.files.some(
      (file: ArtifactFile) =>
        !file ||
        typeof file.path !== 'string' ||
        !Number.isSafeInteger(file.bytes) ||
        file.bytes < 0 ||
        typeof file.sha256 !== 'string' ||
        !/^[a-f0-9]{64}$/.test(file.sha256),
    )
  )
    throw new Error('Invalid native resource inventory.');
  const files: ArtifactFile[] = receipt.files;
  const byPath = new Map(files.map((file) => [file.path, file]));
  if (
    !files.length ||
    byPath.size !== files.length ||
    !['index.html', 'PASEO-LICENSE', 'THIRD_PARTY_NOTICES.json'].every((path) => byPath.has(path))
  )
    throw new Error('Invalid native resource inventory.');
  for (const file of files) {
    paseoResourceKind(file.path);
    if (
      !file.path ||
      file.path.startsWith('/') ||
      file.path.includes('\\') ||
      file.path.split('/').some((part) => !part || part === '.' || part === '..')
    )
      throw new Error('Unsafe native resource.');
    const path = join(directory, file.path);
    if (realpathSync(path) !== join(realpathSync(directory), file.path))
      throw new Error('Native resource cannot be a symlink.');
    const bytes = readFileSync(path);
    if (
      bytes.length !== file.bytes ||
      createHash('sha256').update(bytes).digest('hex') !== file.sha256
    )
      throw new Error('Native resource digest changed.');
  }
  const html = readFileSync(join(directory, 'index.html'), 'utf8');
  const resource = (url: string) => {
    const file = byPath.get(url.slice(receipt.publicPath.length + 1));
    if (!url.startsWith(receipt.publicPath + '/') || !file)
      throw new Error('Unknown native entry resource.');
    return { url, integrity: 'sha256-' + Buffer.from(file.sha256, 'hex').toString('base64') };
  };
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) =>
    resource(match[1]),
  );
  const styles = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"/g)].map(
    (match) => resource(match[1]),
  );
  if (scripts.length !== 1) throw new Error('Expected one native bootstrap entry.');
  const config = parsePaseoAssetConfig({
    version: 1,
    basePath: receipt.publicPath,
    script: scripts[0],
    styles,
  });
  if (!config) throw new Error('Invalid native public resource prefix.');
  return { directory, files, config, sandboxScriptHashes };
}
