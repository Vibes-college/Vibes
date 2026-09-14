import assert from 'node:assert/strict';
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
const root = '.scratch/great-ui-dist';
const assets = await readdir(path.join(root, 'assets'));
const sizes: Record<string, number> = {};
for (const name of assets)
  sizes[name] = gzipSync(await readFile(path.join(root, 'assets', name))).length;
const group = (filter: (name: string) => boolean) =>
  Object.entries(sizes)
    .filter(([name]) => filter(name))
    .reduce((sum, [, size]) => sum + size, 0);
const actual = {
  initialJs: group((x) => !x.startsWith('Journey-') && x.endsWith('.js')),
  initialCss: group((x) => !x.startsWith('Journey-') && x.endsWith('.css')),
  journeyJs: group((x) => x.startsWith('Journey-') && x.endsWith('.js')),
  catalog: gzipSync(await readFile(path.join(root, 'content/catalog.json'))).length,
  capabilities: gzipSync(await readFile(path.join(root, 'content/capabilities.json'))).length,
  largestDetail: 0,
  localMedia: 0,
  largestLocalMedia: 0,
};
for (const name of await readdir(path.join(root, 'content')))
  if (name.endsWith('.json') && !['catalog.json', 'capabilities.json'].includes(name))
    actual.largestDetail = Math.max(
      actual.largestDetail,
      gzipSync(await readFile(path.join(root, 'content', name))).length,
    );
for (const name of await readdir(path.join(root, 'great-ui/media'))) {
  const size = (await stat(path.join(root, 'great-ui/media', name))).size;
  actual.localMedia += size;
  actual.largestLocalMedia = Math.max(actual.largestLocalMedia, size);
}
// Measured baseline is ~80/5/51 KiB JS/CSS/lazy JS. Leave bounded room without changing production budgets.
// Forty-eight owned clips and posters total about 4.5 MiB; a selected page loads one clip.
// Only the selected clip loads; cap both individual files and the complete local media set.
const limits = {
  initialJs: 100 * 1024,
  initialCss: 8 * 1024,
  journeyJs: 65 * 1024,
  catalog: 20 * 1024,
  capabilities: 24 * 1024,
  largestDetail: 16 * 1024,
  localMedia: 5 * 1024 * 1024,
  largestLocalMedia: 550 * 1024,
};
for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
  assert.ok(actual[key] > 0, key + ' is missing');
  assert.ok(actual[key] <= limits[key], `${key}: ${actual[key]} > ${limits[key]}`);
}
const report = {
  generatedAt: new Date().toISOString(),
  units: 'gzip bytes except localMedia and largestLocalMedia (original file bytes)',
  actual,
  limits,
  scope:
    'Standalone build of the shared site learning UI. All 48 previews use owned assets; only the selected clip loads. The normal site budget is checked separately.',
};
await mkdir('resources/evidence/018-great-ui-scale', { recursive: true });
await writeFile(
  'resources/evidence/018-great-ui-scale/budget.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
