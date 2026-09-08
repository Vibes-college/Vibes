import { fileURLToPath } from 'node:url';
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
    // An unrendered Astro component can still emit its client chunks. Select the
    // empty entry before graph construction so ordinary builds contain none.
    resolve: {
      alias: process.env.VIBES_PASEO_PROFILE
        ? []
        : [
            {
              find: '../components/LocalAssistant.astro',
              replacement: fileURLToPath(
                new URL('./src/components/LocalAssistantDisabled.astro', import.meta.url),
              ),
            },
          ],
    },
    build: { assetsInlineLimit: 0 },
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
              rolldownOptions: {
                preserveEntrySignatures: 'allow-extension',
                output: {
                  codeSplitting: {
                    groups: [
                      {
                        name: 'site-boot',
                        includeDependenciesRecursively: false,
                        test: /(?:\/src\/scripts\/(?:reading-prefetch|media-boot|paseo-boot|page-lifecycle)\.ts$|\/src\/lib\/(?:escape|i18n\/routes)\.ts$|vite\/preload-helper)/,
                      },
                    ],
                  },
                },
              },
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
