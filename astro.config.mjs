import { createRequire } from 'node:module';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { proseStyle } from './src/lib/markdown/prose-style.ts';
import { proseProcessor, proseHighlight } from './src/lib/markdown/config.ts';
import { buildSite } from './src/config/site.ts';
export default defineConfig({
  site: buildSite().origin,
  integrations: [mdx(), react()],
  markdown: { processor: proseProcessor, shikiConfig: proseHighlight },
  output: 'static',
  prefetch: { prefetchAll: false },
  outDir: process.env.VIBES_OUT_DIR || './dist',
  cacheDir: process.env.VIBES_OUT_DIR ? `${process.env.VIBES_OUT_DIR}-cache` : './.astro',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: {
    // relay 0.7.2 publishes dist but its browser export points at absent src.
    resolve: {
      alias: {
        '@getpaseo/relay/e2ee': createRequire(import.meta.url).resolve('@getpaseo/relay/e2ee'),
      },
    },
    build: {
      assetsInlineLimit: 0,
      rolldownOptions: {
        output: {
          manualChunks(id) {
            // These always ship together in Layout; one chunk avoids repeated compression overhead.
            if (
              id.endsWith('/src/scripts/reading-prefetch.ts') ||
              id.includes('/astro/dist/prefetch/')
            )
              return 'reading-prefetch';
          },
        },
      },
    },
    plugins: [
      proseStyle(),
      tailwindcss(),
      {
        name: 'recoverable-lazy-imports',
        // Astro supplies its own build environments; apply this at the client boundary.
        configEnvironment(name) {
          if (name !== 'client') return;
          return {
            build: {
              modulePreload: {
                polyfill: false,
                // WebKit 270357: a failed modulepreload can survive an ordinary reload.
                // Import the target normally; retain parallel preparation of dependencies.
                resolveDependencies(filename, dependencies, { hostType }) {
                  return hostType === 'js'
                    ? dependencies.filter((path) => path !== filename)
                    : dependencies;
                },
              },
            },
          };
        },
      },
    ],
  },
});
