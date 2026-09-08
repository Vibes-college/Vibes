import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join, sep } from 'node:path';

export function collectPaseoLicenses(source: string) {
  const lock: {
    packages: Record<
      string,
      { version?: string; integrity?: string; license?: string; link?: boolean }
    >;
  } = JSON.parse(readFileSync(join(source, 'package-lock.json'), 'utf8'));
  return Object.entries(lock.packages)
    .filter(([path, item]) => path && !item.link)
    .flatMap(([path, item]) => {
      const directory = join(source, path);
      if (!existsSync(join(directory, 'package.json'))) return [];
      if (!realpathSync(directory).startsWith(realpathSync(source) + sep))
        throw new Error(`Dependency is outside the fixed source checkout: ${path}`);
      const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
      if (pkg.version !== item.version)
        throw new Error(`Installed dependency version mismatch: ${path}`);
      const texts: { path: string; text: string }[] = [];
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (!/(?:license|licence|notice|copying)/i.test(entry.name)) continue;
        if (entry.isFile())
          texts.push({ path: entry.name, text: readFileSync(join(directory, entry.name), 'utf8') });
        if (entry.isDirectory()) {
          for (const child of readdirSync(join(directory, entry.name), { withFileTypes: true }))
            if (child.isFile())
              texts.push({
                path: `${entry.name}/${child.name}`,
                text: readFileSync(join(directory, entry.name, child.name), 'utf8'),
              });
        }
      }
      return [
        {
          path,
          name: pkg.name,
          version: pkg.version,
          license: pkg.license ?? item.license ?? null,
          integrity: item.integrity ?? null,
          texts,
        },
      ];
    });
}
