import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      '.wrangler/**',
      '.scratch/**',
      'node_modules/**',
      'resources/references/**',
      // Minified upstream MIT distribution; reviewed source/attribution lives beside it.
      'public/media/2048/game.js',
      'resources/evidence/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    files: ['src/features/great-ui/**/*.jsx', 'src/features/great-ui/useRecordingView.js'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: Object.fromEntries(
        [
          'navigator',
          'IntersectionObserver',
          'ResizeObserver',
          'MutationObserver',
          'HTMLElement',
          'HTMLVideoElement',
          'requestAnimationFrame',
          'cancelAnimationFrame',
          'matchMedia',
          'innerHeight',
        ].map((name) => [name, 'readonly']),
      ),
    },
  },
  {
    languageOptions: {
      globals: Object.fromEntries(
        [
          'console',
          'process',
          'Buffer',
          'URL',
          'URLSearchParams',
          'Response',
          'fetch',
          'setTimeout',
          'clearTimeout',
          'document',
          'window',
          'location',
          'history',
          'innerWidth',
          'getComputedStyle',
          'AbortSignal',
          'AbortController',
        ].map((name) => [name, 'readonly']),
      ),
    },
  },
];
