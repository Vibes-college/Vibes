import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './local-tools.ts';
import { readMermaidSandboxHashes } from './paseo-webui-sandbox.ts';
import { collectPaseoLicenses } from './paseo-webui-licenses.ts';
import { applyDependencyPatches, type DependencyPatch } from './paseo-webui-dependencies.ts';

export interface UpstreamSource {
  repository: string;
  commit: string;
  version: string;
  lockfile: { path: string; sha256: string };
  license: { path: string; sha256: string };
}
export interface SourcePatch {
  path: string;
  sha256: string;
}
export const sha256 = (data: Buffer) => createHash('sha256').update(data).digest('hex');
const git = (source: string, args: string[]) =>
  execFileSync('git', args, {
    cwd: source,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

export function verifySource(source: string, identity: UpstreamSource) {
  if (lstatSync(source).isSymbolicLink()) throw new Error('Source cannot be a symbolic link.');
  if (realpathSync(git(source, ['rev-parse', '--show-toplevel'])) !== realpathSync(source))
    throw new Error('Source must own its Git repository.');
  if (git(source, ['rev-parse', 'HEAD']) !== identity.commit)
    throw new Error('Upstream commit mismatch.');
  if (git(source, ['remote', 'get-url', 'origin']) !== identity.repository)
    throw new Error('Upstream repository mismatch.');
  for (const name of ['lockfile', 'license'] as const) {
    const item = identity[name];
    if (sha256(readFileSync(join(source, item.path))) !== item.sha256)
      throw new Error(`Upstream ${name} mismatch.`);
  }
  if (git(source, ['status', '--porcelain', '--untracked-files=all']))
    throw new Error('Upstream checkout must be clean; preserve and inspect unexpected changes.');
}

// A failed build cannot leave a previous success at the consumer's known output path.
// Refuse unknown directories and symlinks instead of deleting user-owned material.
function invalidateOutput(output: string) {
  if (!existsSync(output)) return;
  if (lstatSync(output).isSymbolicLink() || !existsSync(join(output, 'build-receipt.json')))
    throw new Error('Refusing to replace an unowned build output.');
  const receipt = JSON.parse(readFileSync(join(output, 'build-receipt.json'), 'utf8'));
  if (receipt.owner !== 'vibes-paseo-webui') throw new Error('Unknown build output owner.');
  rmSync(output, { recursive: true });
}

function exportFiles(
  directory: string,
  prefix = '',
): { path: string; bytes: number; sha256: string }[] {
  return readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const file = join(directory, entry.name);
      const name = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Export contains a symlink: ${name}`);
      if (entry.isDirectory()) return exportFiles(file, `${name}/`);
      const data = readFileSync(file);
      return [{ path: name, bytes: data.length, sha256: sha256(data) }];
    });
}

export function buildWebUI(options: {
  source: string;
  identity: UpstreamSource;
  output: string;
  patches: SourcePatch[];
  dependencyPatches?: DependencyPatch[];
  exportDirectory?: string;
  graphFile?: string;
  publicPath?: string;
  mermaidSandboxSource?: string;
  exportWeb: () => void;
}) {
  const { source, identity, output, patches, exportWeb } = options;
  const absoluteOutput = resolve(output);
  if (absoluteOutput === resolve(source) || absoluteOutput.startsWith(resolve(source) + sep))
    throw new Error('Output must be outside the upstream checkout.');
  invalidateOutput(output);
  verifySource(source, identity);
  for (const patch of patches)
    if (sha256(readFileSync(patch.path)) !== patch.sha256)
      throw new Error('Source patch hash mismatch.');
  const applied: SourcePatch[] = [];
  const staging = `${output}.staging-${process.pid}`;
  if (existsSync(staging)) throw new Error('Staging already exists; inspect before retrying.');
  const dist = options.exportDirectory ?? join(source, 'packages/app/dist');
  let failure: unknown;
  let restoreDependencies: (() => void) | undefined;
  try {
    for (const patch of patches) {
      git(source, ['apply', '--check', '--index', '--whitespace=error-all', patch.path]);
      git(source, ['apply', '--index', '--whitespace=error-all', patch.path]);
      applied.push(patch);
    }
    restoreDependencies = applyDependencyPatches(source, options.dependencyPatches ?? []);
    const sandboxScriptHashes = options.mermaidSandboxSource
      ? readMermaidSandboxHashes(join(source, options.mermaidSandboxSource))
      : [];
    const stagedDiff = git(source, ['diff', '--cached', '--binary']);
    if (existsSync(dist) && lstatSync(dist).isSymbolicLink())
      throw new Error('Export directory is a symlink.');
    rmSync(dist, { recursive: true, force: true });
    exportWeb();
    if (!existsSync(join(dist, 'index.html'))) throw new Error('Export is missing index.html.');
    const files = exportFiles(dist);
    if (!files.some((file) => file.path.endsWith('.js')))
      throw new Error('Export is missing JavaScript.');
    if (
      git(source, ['diff', '--binary']) ||
      git(source, ['diff', '--cached', '--binary']) !== stagedDiff
    )
      throw new Error('Build changed tracked source; refusing to publish or overwrite changes.');
    mkdirSync(dirname(output), { recursive: true });
    cpSync(dist, staging, { recursive: true });
    cpSync(join(source, identity.license.path), join(staging, 'PASEO-LICENSE'));
    // The full fixed lock preserves package license identifiers and integrity; text notices
    // are collected separately from installed packages, never guessed from package names.
    cpSync(join(source, identity.lockfile.path), join(staging, 'upstream-package-lock.json'));
    writeFileSync(
      join(staging, 'THIRD_PARTY_NOTICES.json'),
      JSON.stringify(collectPaseoLicenses(source), null, 2) + '\n',
    );
    const sourceGraph = options.graphFile
      ? { sha256: sha256(readFileSync(options.graphFile)), path: 'source-graph.json' }
      : undefined;
    if (options.graphFile) cpSync(options.graphFile, join(staging, 'source-graph.json'));
    writeFileSync(
      join(staging, 'build-receipt.json'),
      JSON.stringify(
        {
          owner: 'vibes-paseo-webui',
          schemaVersion: 1,
          source: identity,
          patches: patches.map((patch) => ({ sha256: patch.sha256 })),
          dependencyPatches: (options.dependencyPatches ?? []).map((patch) => ({
            sha256: patch.sha256,
            files: patch.files,
          })),
          sourceGraph,
          sandboxScriptHashes,
          publicPath: options.publicPath ?? '/',
          node: process.version,
          files,
        },
        null,
        2,
      ) + '\n',
    );
  } catch (error) {
    failure = error;
  }
  try {
    restoreDependencies?.();
  } catch (error) {
    failure = failure
      ? new AggregateError([failure, error], 'Export and dependency restoration failed.')
      : error;
  }
  // Reverse only our staged patches while the worktree still matches the index.
  // Never reset an unexpected edit made by another process or a failing build.
  try {
    if (applied.length) {
      if (git(source, ['diff', '--binary']))
        throw new Error('Source changed during build; patches preserved for inspection.');
      for (const patch of applied.reverse())
        git(source, ['apply', '--reverse', '--index', patch.path]);
    }
    verifySource(source, identity);
  } catch (error) {
    failure = failure
      ? new AggregateError([failure, error], 'Export and source restoration failed.')
      : error;
  }
  if (failure) {
    rmSync(staging, { recursive: true, force: true });
    throw failure;
  }
  renameSync(staging, output);
  return JSON.parse(readFileSync(join(output, 'build-receipt.json'), 'utf8'));
}

function main() {
  const [action, ...extra] = process.argv.slice(2);
  if (!['fetch', 'B0', 'G1', 'H', 'A1', 'A2', 'A3', 'B0-graph'].includes(action) || extra.length)
    throw new Error('Usage: paseo-webui-build.ts fetch | B0 | G1 | H | A1 | A2 | A3 | B0-graph');
  const identity: UpstreamSource = JSON.parse(
    readFileSync(join(root, 'third_party/paseo-webui/upstream.json'), 'utf8'),
  );
  const source = join(root, '.scratch/paseo-webui/upstream');
  if (action === 'fetch') {
    if (!existsSync(source)) {
      mkdirSync(dirname(source), { recursive: true });
      execFileSync('git', ['clone', '--no-checkout', identity.repository, source], {
        stdio: 'inherit',
      });
      git(source, ['checkout', '--detach', identity.commit]);
    }
    verifySource(source, identity);
    console.log('Fixed source verified. Install only under the approved dependency procedure.');
    return;
  }
  const series: {
    B0: SourcePatch[];
    measurement?: SourcePatch[];
    G1?: { source: SourcePatch[]; dependencies: DependencyPatch[] };
    H?: { source: SourcePatch[]; dependencies: DependencyPatch[] };
    A1?: { source: SourcePatch[]; dependencies: DependencyPatch[] };
    A2?: { source: SourcePatch[]; dependencies: DependencyPatch[] };
    A3?: { source: SourcePatch[]; dependencies: DependencyPatch[] };
  } = JSON.parse(readFileSync(join(root, 'third_party/paseo-webui/patches/series.json'), 'utf8'));
  const mountedProfile =
    action === 'G1'
      ? series.G1
      : action === 'H'
        ? series.H
        : action === 'A1'
          ? series.A1
          : action === 'A2'
            ? series.A2
            : action === 'A3'
              ? series.A3
              : undefined;
  if (
    (action === 'G1' || action === 'H' || action === 'A1' || action === 'A2' || action === 'A3') &&
    !mountedProfile
  )
    throw new Error('Mount profile is not configured.');
  const publicPath =
    action === 'G1'
      ? '/vendor/paseo/g1-direct'
      : action === 'H' || action === 'A1' || action === 'A2' || action === 'A3'
        ? '/vendor/paseo/' +
          sha256(
            Buffer.from(
              JSON.stringify({ source: identity.commit, profile: action, patches: mountedProfile }),
            ),
          ).slice(0, 16)
        : '/';
  if (action === 'B0-graph' && !series.measurement?.length)
    throw new Error('Graph observer is not configured.');
  const graphFile = join(root, '.scratch/paseo-webui/probes/b0-source-graph.json');
  if (action === 'B0-graph') {
    mkdirSync(dirname(graphFile), { recursive: true });
    rmSync(graphFile, { force: true });
  }
  const probeExport =
    action !== 'B0'
      ? join(root, `.scratch/paseo-webui/probes/${action.toLowerCase()}-export`)
      : undefined;
  const receipt = buildWebUI({
    source,
    identity,
    patches: (mountedProfile
      ? mountedProfile.source
      : action === 'B0-graph'
        ? [...series.B0, ...series.measurement!]
        : series.B0
    ).map((patch) => ({
      ...patch,
      path: resolve(root, patch.path),
    })),
    dependencyPatches: mountedProfile
      ? mountedProfile.dependencies.map((patch) => ({ ...patch, path: resolve(root, patch.path) }))
      : [],
    output: join(root, '.scratch/paseo-webui/artifacts', action),
    exportDirectory: probeExport,
    graphFile: action === 'B0-graph' ? graphFile : undefined,
    publicPath,
    mermaidSandboxSource:
      action === 'A1' || action === 'A2' || action === 'A3'
        ? 'packages/app/src/components/markdown/fence/mermaid/runtime/html.gen.ts'
        : undefined,
    exportWeb: () => {
      const env = { ...process.env };
      for (const key of Object.keys(env))
        if (
          key.startsWith('EXPO_PUBLIC_') ||
          key.startsWith('PASEO_') ||
          key.startsWith('VIBES_PASEO_')
        )
          delete env[key];
      if (action === 'B0-graph') env.VIBES_PASEO_GRAPH_FILE = graphFile;
      if (action === 'H' || action === 'A1' || action === 'A2' || action === 'A3')
        env.VIBES_PASEO_BASE_URL = publicPath;
      const args = ['run', 'build:web', '--workspace=@getpaseo/app'];
      if (probeExport) args.push('--', '--output-dir', probeExport);
      execFileSync('npm', args, {
        cwd: source,
        env,
        stdio: 'inherit',
      });
      if (action === 'A2' || action === 'A3') {
        // Check while the exact declared source patches and workspace exports are applied.
        execFileSync(join(source, 'node_modules/.bin/tsgo'), ['--noEmit'], {
          cwd: join(source, 'packages/app'),
          env,
          stdio: 'inherit',
        });
      }
      if (action === 'A3') {
        execFileSync(
          process.execPath,
          [join(root, 'tests/fixtures/paseo-webui/verify-native-async-loader.mjs'), source],
          { env, stdio: 'inherit' },
        );
        execFileSync(
          process.execPath,
          [
            join(source, 'node_modules/vitest/vitest.mjs'),
            'run',
            '--project',
            'unit',
            'src/utils/highlight-cache.test.ts',
            'src/utils/diff-highlight.test.ts',
            'src/appearance/apply.test.ts',
            'src/terminal/runtime/terminal-stream-controller.test.ts',
            'src/terminal/runtime/terminal-emulator-runtime.test.ts',
            'src/file-pane/editor/model.test.ts',
            'src/file-pane/live-file/model.test.ts',
          ],
          {
            cwd: join(source, 'packages/app'),
            env,
            stdio: 'inherit',
          },
        );
      }
    },
  });
  console.log(`Verified ${action} export: ${receipt.files.length} files.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
