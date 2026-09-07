import { defineConfig } from 'astro/config';
import { proseStyle } from './src/lib/markdown/prose-style.ts';
import { proseProcessor, proseHighlight } from './src/lib/markdown/config.ts';
import { buildSite } from './src/config/site.ts';
export default defineConfig({
  site: buildSite().origin,
  markdown: { processor: proseProcessor, shikiConfig: proseHighlight },
  output: 'static',
  prefetch: { prefetchAll: false },
  outDir: process.env.VIBES_OUT_DIR || './dist',
  cacheDir: process.env.VIBES_OUT_DIR ? `${process.env.VIBES_OUT_DIR}-cache` : './.astro',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: {
    build: { assetsInlineLimit: 0 },
    plugins: [
      proseStyle(),
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
