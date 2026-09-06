import { resolve } from 'node:path';
import { rmSync } from 'node:fs';
import { run } from './local-tools.ts';
import { readCatalog } from '../src/lib/content/catalog.ts';

// 合成目录使用独立输出及Astro缓存；所有构建先执行与维护命令相同的校验。
const out = process.env.VIBES_OUT_DIR || 'dist';
if (process.env.VIBES_CONTENT_DIR && !process.env.VIBES_OUT_DIR)
  throw new Error('Isolated content requires VIBES_OUT_DIR to protect the real build.');
if (process.env.VIBES_OUT_DIR && !resolve(out).startsWith(resolve('.scratch') + '/'))
  throw new Error('Isolated output must be under .scratch/.');
const catalog = readCatalog();
const hasPublished = catalog.works.some((work) =>
  Object.values(work.versions).some((version) => version.data.status === 'published'),
);
run(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build']);
// 显式指定正文根；全站没有发布作品时也不能回退去索引导航页面。
if (hasPublished)
  run(process.execPath, [
    'node_modules/pagefind/lib/runner/bin.cjs',
    '--site',
    out,
    '--root-selector',
    '[data-pagefind-body]',
  ]);
else {
  rmSync(resolve(out, 'pagefind'), { recursive: true, force: true });
  console.log('No published works: no search index generated.');
}
