import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { build, createServer, preview, type InlineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { entries, index, capabilities } from '../src/features/great-ui/content-build.mjs';
import { createTask, taskText } from '../src/features/great-ui/task.mjs';
import { validateCatalog, validateDetail } from '../src/features/great-ui/catalog.ts';
import { validateCapabilities } from '../src/features/great-ui/composition/validate.ts';
import { currentDemoProof } from './great-ui-proof.ts';
import { projects } from '../src/features/great-ui/journey/data.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, '.scratch/great-ui-public');
const outDir = path.join(root, '.scratch/great-ui-dist');
const action = process.argv[2];
if (!['build', 'dev', 'preview'].includes(action)) {
  throw new Error('Usage: great-ui.ts build|dev|preview [port]');
}
const port = Number(process.argv[3] || 4325);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local port');

async function exportContent(): Promise<void> {
  await mkdir(path.join(publicDir, 'content'), { recursive: true });
  await mkdir(path.join(publicDir, 'journeys'), { recursive: true });
  validateCatalog(index);
  validateCapabilities(capabilities);
  for (const item of entries) validateDetail(item, item);
  const proof = await currentDemoProof('standalone');
  await writeFile(
    path.join(publicDir, 'content/demo-proof.json'),
    JSON.stringify({ adapterRevision: proof.adapterRevision, records: proof.records }),
  );
  await writeFile(path.join(publicDir, 'content/catalog.json'), JSON.stringify(index));
  await writeFile(path.join(publicDir, 'content/capabilities.json'), JSON.stringify(capabilities));
  for (const project of projects) {
    await writeFile(
      path.join(publicDir, 'journeys', `${project.id}.json`),
      JSON.stringify(project) + '\n',
    );
  }
  await cp(path.join(root, 'public/great-ui/media'), path.join(publicDir, 'great-ui/media'), {
    recursive: true,
  });
  for (const entry of entries) {
    await writeFile(
      path.join(publicDir, 'content', `${entry.slug}.json`),
      JSON.stringify(entry, null, 2) + '\n',
    );
    await writeFile(
      path.join(publicDir, 'content', `${entry.slug}-prompt.txt`),
      taskText(createTask(entry, { placement: '', changes: '', goalId: 'faithful' })),
    );
  }
}

const config: InlineConfig = {
  configFile: false,
  root: path.join(root, 'src/features/great-ui'),
  publicDir,
  plugins: [react()],
  build: { outDir, emptyOutDir: true },
  server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [root] } },
  preview: { host: '127.0.0.1', port, strictPort: true },
};

if (action !== 'preview') await exportContent();
if (action === 'build') await build(config);
if (action === 'dev') {
  const server = await createServer(config);
  await server.listen();
  server.printUrls();
}
if (action === 'preview') {
  const server = await preview(config);
  server.printUrls();
}
