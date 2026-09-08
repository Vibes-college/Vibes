import { paseoResourceKind } from '../src/features/paseo-webui/asset-contract.ts';
import { readFileSync, readdirSync, realpathSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { root } from './local-tools.ts';
import { sha256 } from './paseo-webui-build.ts';

interface FileReceipt {
  path: string;
  bytes: number;
  sha256: string;
}
interface BuildReceipt {
  owner: string;
  source: { commit: string; lockfile: { sha256: string } };
  files: FileReceipt[];
  patches: { sha256: string }[];
  dependencyPatches?: unknown[];
  sourceGraph?: { sha256: string; path: string };
}
export interface SourceGraph {
  schemaVersion: 1;
  platform: 'web';
  entries: string[];
  modules: {
    path: string;
    sourceSha256: string;
    dependencies: {
      path: string;
      import: string;
      asyncType: null | 'async' | 'prefetch' | 'maybeSync' | 'weak';
      optional: boolean;
    }[];
  }[];
}
const hashes = /^[0-9a-f]{64}$/;
function safePath(value: string) {
  if (
    !value ||
    value.startsWith('/') ||
    value.includes('\\') ||
    value.split('/').some((part) => !part || part === '.' || part === '..')
  )
    throw new Error(`Invalid artifact path: ${value}`);
}

function paths(directory: string, prefix = ''): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      if (entry.isSymbolicLink()) throw new Error('Artifact tree cannot contain symbolic links.');
      return entry.isDirectory()
        ? paths(join(directory, entry.name), prefix + entry.name + '/')
        : [prefix + entry.name];
    })
    .sort();
}
const ancillary = new Set([
  'build-receipt.json',
  'PASEO-LICENSE',
  'upstream-package-lock.json',
  'THIRD_PARTY_NOTICES.json',
]);

export function summarizeSourceGraph(graph: SourceGraph) {
  if (
    graph.schemaVersion !== 1 ||
    graph.platform !== 'web' ||
    !graph.modules.length ||
    !graph.entries.length
  )
    throw new Error('Missing or invalid web source graph.');
  const modules = new Map(graph.modules.map((module) => [module.path, module]));
  if (modules.size !== graph.modules.length) throw new Error('Duplicate source module.');
  let edges = 0;
  const deferred: { from: string; to: string; type: string }[] = [];
  for (const module of graph.modules) {
    safePath(module.path);
    if (!hashes.test(module.sourceSha256)) throw new Error('Invalid source hash.');
    for (const dependency of module.dependencies) {
      edges++;
      if (!modules.has(dependency.path))
        throw new Error(`Incomplete source graph: ${dependency.path}`);
      if (![null, 'async', 'prefetch', 'maybeSync', 'weak'].includes(dependency.asyncType))
        throw new Error('Unknown Metro dependency type.');
      if (dependency.asyncType !== null)
        deferred.push({ from: module.path, to: dependency.path, type: dependency.asyncType });
    }
  }
  const sync = new Set<string>();
  const visit = (path: string) => {
    const module = modules.get(path);
    if (!module) throw new Error('Unknown source entry.');
    if (sync.has(path)) return;
    sync.add(path);
    for (const dependency of module.dependencies)
      if (dependency.asyncType === null || dependency.asyncType === 'maybeSync')
        visit(dependency.path);
  };
  for (const entry of graph.entries) visit(entry);
  return {
    moduleCount: modules.size,
    dependencyCount: edges,
    synchronousModules: [...sync].sort(),
    deferredEdges: deferred,
  };
}

export function createPaseoManifest(directory: string, receipt: BuildReceipt, graph: SourceGraph) {
  if (
    receipt.owner !== 'vibes-paseo-webui' ||
    !receipt.files.length ||
    !hashes.test(receipt.source.lockfile.sha256)
  )
    throw new Error('Invalid build receipt.');
  const declared = receipt.files.map((file) => file.path).sort();
  if (new Set(declared).size !== declared.length) throw new Error('Duplicate resource.');
  const actual = paths(directory).filter((path) => !ancillary.has(path));
  if (JSON.stringify(actual) !== JSON.stringify(declared))
    throw new Error('Undeclared or missing artifact resource.');
  const contents = new Map<string, Buffer>();
  const files = receipt.files.map((file) => {
    safePath(file.path);
    const path = join(directory, file.path);
    if (realpathSync(path) !== join(realpathSync(directory), file.path))
      throw new Error('Symbolic link resource.');
    const data = readFileSync(path);
    if (data.length !== file.bytes || sha256(data) !== file.sha256)
      throw new Error(`Resource hash/size mismatch: ${file.path}`);
    contents.set(file.path, data);
    return {
      ...file,
      kind: paseoResourceKind(file.path),
      gzipBytes: gzipSync(data).length,
      brotliBytes: brotliCompressSync(data).length,
    };
  });
  const html = contents.get('index.html')?.toString('utf8');
  if (!html) throw new Error('Missing entry document.');
  const entryScripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((match) => {
    const url = new URL(match[1], 'https://artifact.invalid/');
    if (url.origin !== 'https://artifact.invalid' || url.search || url.hash)
      throw new Error('External or parameterized entry script.');
    // B0 is rooted at /. Candidates keep their prefix in a separate manifest.
    const path = decodeURIComponent(url.pathname.slice(1));
    if (contents.get(path) === undefined || paseoResourceKind(path) !== 'script')
      throw new Error('Unknown entry script.');
    return path;
  });
  if (!entryScripts.length) throw new Error('No executable entry.');
  const scripts = files.filter((file) => file.kind === 'script');
  const entry = scripts.filter((file) => entryScripts.includes(file.path));
  return {
    schemaVersion: 1,
    source: receipt.source,
    patches: receipt.patches,
    dependencyPatches: receipt.dependencyPatches ?? [],
    files,
    entryScripts,
    compression: 'Independent files; Node zlib defaults. Not observed network transfer.',
    scriptTotals: {
      bytes: scripts.reduce((sum, file) => sum + file.bytes, 0),
      gzipBytes: scripts.reduce((sum, file) => sum + file.gzipBytes, 0),
    },
    documentEntryScripts: {
      bytes: entry.reduce((sum, file) => sum + file.bytes, 0),
      gzipBytes: entry.reduce((sum, file) => sum + file.gzipBytes, 0),
    },
    sourceGraph: summarizeSourceGraph(graph),
  };
}
function main() {
  if (process.argv.length !== 2)
    throw new Error('Usage: paseo-webui-manifest.ts (B0 only until profiles are frozen)');
  const baseline = join(root, '.scratch/paseo-webui/artifacts/B0');
  const readReceipt = (directory: string): BuildReceipt =>
    JSON.parse(readFileSync(join(directory, 'build-receipt.json'), 'utf8'));
  const original = readReceipt(baseline);
  const observed = readReceipt(join(root, '.scratch/paseo-webui/artifacts/B0-graph'));
  if (
    original.source.commit !== observed.source.commit ||
    original.source.lockfile.sha256 !== observed.source.lockfile.sha256 ||
    JSON.stringify(original.files) !== JSON.stringify(observed.files)
  )
    throw new Error('Graph export differs from the preserved baseline; do not mix evidence.');
  const graphBytes = readFileSync(
    join(root, '.scratch/paseo-webui/artifacts/B0-graph/source-graph.json'),
  );
  if (
    observed.sourceGraph?.path !== 'source-graph.json' ||
    sha256(graphBytes) !== observed.sourceGraph.sha256
  )
    throw new Error('Graph receipt hash mismatch.');
  const graphs: SourceGraph[] = JSON.parse(graphBytes.toString());
  if (graphs.length !== 1) throw new Error('Expected one complete B0 web graph.');
  const manifest = createPaseoManifest(baseline, original, graphs[0]);
  const target = join(root, 'resources/evidence/012-paseo-webui-loading/baseline/b0-manifest.json');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    JSON.stringify({ ...manifest, graphSha256: sha256(graphBytes) }, null, 2) + '\n',
  );
  writeFileSync(join(dirname(target), 'b0-source-graph.json'), graphBytes);
  console.log(
    `Verified B0: ${manifest.files.length} files, ${manifest.sourceGraph.moduleCount} source modules.`,
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
