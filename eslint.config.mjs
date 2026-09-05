import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      '.wrangler/**',
      'node_modules/**',
      'references/**',
      'research/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
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
        ].map((name) => [name, 'readonly']),
      ),
    },
    rules: { 'max-lines': ['error', { max: 300 }] },
  },
];
