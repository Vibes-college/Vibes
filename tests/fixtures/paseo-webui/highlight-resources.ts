import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function highlightResources() {
  const profile = process.env.PASEO_MOCK_PROFILE;
  if (profile !== 'A3' && profile !== 'A4')
    throw new Error('Requires a built highlighting profile');
  const root = resolve('.scratch/paseo-webui/artifacts', profile);
  const receipt = JSON.parse(readFileSync(resolve(root, 'build-receipt.json'), 'utf8'));
  const grammar = receipt.files.filter(
    (file: { path: string }) =>
      file.path.includes('/__common-') &&
      readFileSync(resolve(root, file.path), 'utf8').includes('getLanguageForFile'),
  );
  const runtime = receipt.files.filter((file: { path: string }) =>
    /\/highlight-runtime-[a-f0-9]+\.js$/.test(file.path),
  );
  // Identify the actual grammar owner, not an unrelated translation common chunk.
  expect(grammar).toHaveLength(1);
  expect(runtime).toHaveLength(1);
  return [grammar[0], runtime[0]].map((file) => receipt.publicPath + '/' + file.path) as [
    string,
    string,
  ];
}
