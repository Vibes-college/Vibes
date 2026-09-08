import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';

export interface DependencyPatch {
  path: string;
  sha256: string;
  files: { path: string; before: string; after: string }[];
}

const digest = (data: Buffer) => createHash('sha256').update(data).digest('hex');
const apply = (source: string, args: string[]) =>
  execFileSync('git', ['apply', ...args], {
    cwd: source,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

function checkFiles(source: string, patch: DependencyPatch, state: 'before' | 'after') {
  for (const file of patch.files) {
    if (
      !/^node_modules\/(expo-router|react-native-web|react-native-unistyles)\//.test(file.path) ||
      file.path.split('/').some((part) => !part || part === '.' || part === '..') ||
      file.path.includes('\\')
    )
      throw new Error('Dependency patch path is outside the approved installed packages.');
    const absolute = resolve(realpathSync(source), file.path);
    if (realpathSync(absolute) !== absolute)
      throw new Error('Dependency patch cannot follow a symbolic link.');
    if (digest(readFileSync(absolute)) !== file[state])
      throw new Error(`Dependency file ${state} hash mismatch: ${file.path}`);
  }
}

function validatePatch(source: string, patch: DependencyPatch) {
  if (digest(readFileSync(patch.path)) !== patch.sha256)
    throw new Error('Dependency patch hash mismatch.');
  const paths = apply(source, ['--numstat', '-z', patch.path])
    .split('\0')
    .filter(Boolean)
    .map((entry) => {
      const match = /^\d+\t\d+\t([^\t\n]+)$/.exec(entry);
      if (!match) throw new Error('Dependency patches must be text edits without renames.');
      return match[1];
    });
  const declared = patch.files.map((file) => file.path).sort();
  if (
    !declared.length ||
    new Set(declared).size !== declared.length ||
    JSON.stringify(paths.sort()) !== JSON.stringify(declared)
  )
    throw new Error('Dependency patch file list mismatch.');
  checkFiles(source, patch, 'before');
}

// Installed dependencies are outside Git's index. Exact before/after hashes and an
// explicit file list keep a probe from contaminating the next unmodified B0 build.
export function applyDependencyPatches(source: string, patches: DependencyPatch[]): () => void {
  const applied: DependencyPatch[] = [];
  const restore = () => {
    for (const patch of [...applied].reverse()) {
      checkFiles(source, patch, 'after');
      apply(source, ['--reverse', '--check', patch.path]);
      apply(source, ['--reverse', patch.path]);
      checkFiles(source, patch, 'before');
    }
    applied.length = 0;
  };
  try {
    for (const patch of patches) {
      validatePatch(source, patch);
      apply(source, ['--check', '--whitespace=error-all', patch.path]);
      apply(source, ['--whitespace=error-all', patch.path]);
      applied.push(patch);
      checkFiles(source, patch, 'after');
    }
  } catch (error) {
    try {
      restore();
    } catch (restorationError) {
      throw new AggregateError(
        [error, restorationError],
        'Dependency changes preserved for inspection.',
        { cause: restorationError },
      );
    }
    throw error;
  }
  return restore;
}
