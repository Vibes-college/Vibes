import { defineConfig } from 'astro/config';
export default defineConfig({
  output: 'static',
  outDir: '../mount-site',
  devToolbar: { enabled: false },
});
