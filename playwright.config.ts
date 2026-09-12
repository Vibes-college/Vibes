import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: [
    'explore.spec.ts',
    'content-lifecycle.spec.ts',
    'navigation.spec.ts',
    'reactions.spec.ts',
    'prose.spec.ts',
    'mdx.spec.ts',
    'beui.spec.ts',
    'media.spec.ts',
    'paseo-loading.spec.ts',
    'paseo-chat.spec.ts',
    'paseo-recovery.spec.ts',
    'paseo-csp.spec.ts',
  ],
  fullyParallel: true,
  // A single local Worker serves the suite; serialize clients to avoid proxy connection loss.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL: 'http://127.0.0.1:4322', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: [
    {
      command:
        'node node_modules/wrangler/bin/wrangler.js dev --local --config wrangler.local.jsonc --persist-to .wrangler/project-local --ip 127.0.0.1 --port 4322',
      url: 'http://127.0.0.1:4322',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'node --experimental-strip-types tests/fixtures/paseo-webui/server.ts',
      url: 'http://localhost:4396/__paseo-fixture',
      reuseExistingServer: false,
      timeout: 60_000,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 15_000 },
    },
  ],
});
