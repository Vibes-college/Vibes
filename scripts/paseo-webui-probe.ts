import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { root } from './local-tools.ts';
import { sha256 } from './paseo-webui-build.ts';

const scratch = join(root, '.scratch/paseo-webui/probes');
const web = join(scratch, 'web');
const marker = join(web, '.vibes-probe.json');
const artifacts = join(root, '.scratch/paseo-webui/artifacts');

function copyArtifact(profile: 'B0' | 'G1', target: string) {
  const directory = join(artifacts, profile);
  const receipt = JSON.parse(readFileSync(join(directory, 'build-receipt.json'), 'utf8'));
  if (receipt.owner !== 'vibes-paseo-webui') throw new Error(`Unknown ${profile} artifact.`);
  for (const file of receipt.files as { path: string; sha256: string }[]) {
    if (resolve(directory, file.path) !== join(directory, file.path) || file.path.includes('..'))
      throw new Error('Unsafe artifact path.');
    const input = join(directory, file.path);
    if (realpathSync(input) !== join(realpathSync(directory), file.path))
      throw new Error('Artifact cannot contain symbolic links.');
    if (sha256(readFileSync(input)) !== file.sha256)
      throw new Error(`${profile} file hash mismatch.`);
    mkdirSync(dirname(join(target, file.path)), { recursive: true });
    cpSync(input, join(target, file.path));
  }
  return receipt;
}

// This is an explicit local experiment, never part of the public Vibes build.
// Keep the original standalone B0 at / and the separate mount probe at /probe/.
if (existsSync(web) && !existsSync(marker))
  throw new Error('Unknown probe output; inspect before replacing.');
if (existsSync(marker) && JSON.parse(readFileSync(marker, 'utf8')).owner !== 'vibes-paseo-probe')
  throw new Error('Probe output owner mismatch.');
if (existsSync(web)) rmSync(web, { recursive: true });
mkdirSync(web, { recursive: true });
writeFileSync(marker, JSON.stringify({ owner: 'vibes-paseo-probe', status: 'building' }) + '\n');
const original = copyArtifact('B0', web);
const candidate = copyArtifact('G1', join(web, 'vendor/paseo/g1-direct'));
const fixture = join(root, 'tests/fixtures/paseo-webui');
const astroRoot = join(scratch, 'mount-host');
cpSync(join(fixture, 'mount-host'), astroRoot, { recursive: true });
execFileSync(
  process.execPath,
  [join(root, 'node_modules/astro/bin/astro.mjs'), 'build', '--root', astroRoot],
  {
    cwd: root,
    stdio: 'inherit',
  },
);
cpSync(join(scratch, 'mount-site'), web, { recursive: true });
cpSync(join(fixture, 'probe-controls.js'), join(web, 'probe-controls.js'));
const html = readFileSync(join(artifacts, 'G1/index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
if (scripts.length !== 1 || !scripts[0].startsWith('/vendor/paseo/g1-direct/'))
  throw new Error('Unexpected probe entry or prefix.');
writeFileSync(
  join(web, 'probe-entry.js'),
  `
const script = document.createElement('script');
script.src = ${JSON.stringify(scripts[0])};
script.onerror = () => window.dispatchEvent(new Event('vibes:paseo-module-error'));
document.head.append(script);
`,
);
writeFileSync(
  marker,
  JSON.stringify(
    {
      owner: 'vibes-paseo-probe',
      status: 'ready',
      source: original.source.commit,
      baselineFiles: original.files,
      candidateFiles: candidate.files,
      candidatePatches: candidate.patches,
      dependencyPatches: candidate.dependencyPatches,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Prepared local probe web root: ${web}`);
