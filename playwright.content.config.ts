import { defineConfig, devices } from '@playwright/test';

// Content changes exercise the real static output and Worker headers without a Paseo daemon.
export default defineConfig({
  testDir: './tests',
  testMatch: ['content-publish.spec.ts', 'beui.spec.ts', 'mdx.spec.ts'],
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL: 'http://127.0.0.1:4322', trace: 'retain-on-failure' },
  projects: [{ name: 'content-chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      'node node_modules/wrangler/bin/wrangler.js dev --local --config wrangler.local.jsonc --persist-to .wrangler/project-local --ip 127.0.0.1 --port 4322',
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
