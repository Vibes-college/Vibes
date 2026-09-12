import { cpSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { getPaseoBuild } from '../src/features/paseo-webui/build-config.ts';

export function copyPaseoAssets(output: string) {
  const build = getPaseoBuild();
  if (!build) return false;
  const target = join(output, build.config.basePath.slice(1));
  for (const file of build.files) {
    mkdirSync(dirname(join(target, file.path)), { recursive: true });
    cpSync(join(build.directory, file.path), join(target, file.path));
  }
  return true;
}
