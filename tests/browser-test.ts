import { test as base, expect } from '@playwright/test';

// Wrangler's local proxy can exit when a context closes mid-response (workers-sdk #15317).
// Let finite static-resource requests drain before Playwright closes each test page.
// A stuck request still fails teardown; this never retries tests or ignores server failures.
export const test = base.extend<{ drainRequests: void }>({
  drainRequests: [
    async ({ page }, use) => {
      await use();
      if (!page.isClosed()) await page.waitForLoadState('networkidle', { timeout: 10_000 });
    },
    { auto: true },
  ],
});
export { expect };
