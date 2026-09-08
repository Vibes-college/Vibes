import { readFileSync, realpathSync } from 'node:fs';
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
let cached: PaseoBuild | null | undefined;
export function getPaseoBuild(): PaseoBuild | null {
  if (cached !== undefined) return cached;
  const profile = process.env.VIBES_PASEO_PROFILE;
  if (!profile) return (cached = null);
  // Until the final candidate is selected, integration is only an isolated H/A1 build.
  if (
    process.env.VIBES_DEPLOY === '1' ||
    !['H', 'A1'].includes(profile) ||
    !process.env.VIBES_OUT_DIR ||
    !resolve(process.env.VIBES_OUT_DIR).startsWith(resolve('.scratch') + '/')
  )
    throw new Error(
      'H/A1 requires an explicit isolated .scratch output; no production candidate is selected.',
    );
  const directory = resolve('.scratch/paseo-webui/artifacts', profile);
  const receipt = JSON.parse(readFileSync(join(directory, 'build-receipt.json'), 'utf8'));
  const identity = JSON.parse(
    readFileSync(resolve('third_party/paseo-webui/upstream.json'), 'utf8'),
  );
  const patches = JSON.parse(
    readFileSync(resolve('third_party/paseo-webui/patches/series.json'), 'utf8'),
  )[profile];
  const expectedPrefix =
    '/vendor/paseo/' +
    createHash('sha256')
      .update(JSON.stringify({ source: identity.commit, profile, patches }))
      .digest('hex')
      .slice(0, 16);
  if (
    receipt.publicPath !== expectedPrefix ||
    receipt.owner !== 'vibes-paseo-webui' ||
    receipt.source.commit !== identity.commit ||
    receipt.source.lockfile.sha256 !== identity.lockfile.sha256 ||
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
    (profile === 'A1' && sandboxScriptHashes.length !== 1)
  )
    throw new Error('Invalid native sandbox script hashes.');
  const files: ArtifactFile[] = receipt.files;
  const byPath = new Map(files.map((file) => [file.path, file]));
  if (!files.length || byPath.size !== files.length)
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
  return (cached = { directory, files, config, sandboxScriptHashes });
}
