import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://vibes.college',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 0 } },
});
