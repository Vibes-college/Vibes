import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://vibes-explore.jachi2.chatgpt.site',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: { build: { assetsInlineLimit: 0 } },
});
