import { test as base, expect } from '@playwright/test';
import { trackLocalRequests } from './local-request-drain.ts';

// Wrangler's local proxy can exit when a context closes mid-response (workers-sdk #15317).
// Let finite static-resource requests drain before Playwright closes each test page.
// A stuck request still fails teardown; this never retries tests or ignores server failures.
export const test = base.extend<{ drainRequests: void }>({
  drainRequests: [
    async ({ context, baseURL }, use) => {
      if (!baseURL) throw new Error('The local proxy baseURL is required.');
      const drain = trackLocalRequests(context, baseURL);
      try {
        await use();
      } finally {
        await drain();
      }
    },
    { auto: true },
  ],
});
export { expect };
