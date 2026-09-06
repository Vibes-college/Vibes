import { defineConfig } from 'astro/config';
import { buildSite } from './src/config/site.ts';
export default defineConfig({
  site: buildSite().origin,
  output: 'static',
  prefetch: { prefetchAll: false },
  outDir: process.env.VIBES_OUT_DIR || './dist',
  cacheDir: process.env.VIBES_OUT_DIR ? `${process.env.VIBES_OUT_DIR}-cache` : './.astro',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 0 } },
});
