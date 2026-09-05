import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://vibes-explore.daring-chime-6331.chatgpt.site',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 0 } },
});
