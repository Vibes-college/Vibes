import { resolve } from 'node:path';
import { run } from './local-tools.ts';

// 合成目录使用独立输出及Astro缓存；所有构建先执行与维护命令相同的校验。
const out = process.env.VIBES_OUT_DIR || 'dist';
if (process.env.VIBES_CONTENT_DIR && !process.env.VIBES_OUT_DIR)
  throw new Error('Isolated content requires VIBES_OUT_DIR to protect the real build.');
if (process.env.VIBES_OUT_DIR && !resolve(out).startsWith(resolve('.scratch') + '/'))
  throw new Error('Isolated output must be under .scratch/.');
run(process.execPath, ['--experimental-strip-types', 'scripts/validate-content.ts']);
run(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build']);
run(process.execPath, ['node_modules/pagefind/lib/runner/bin.cjs', '--site', out]);
