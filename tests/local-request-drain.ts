import type { BrowserContext, Request } from '@playwright/test';

/** Protect Wrangler's local proxy when a test context closes mid-response.
 * External requests never pass through that proxy and must not hold its teardown open. */
export function trackLocalRequests(context: BrowserContext, baseURL: string) {
  const origin = new URL(baseURL).origin;
  const pending = new Set<Request>();
  let lastActivity = Date.now();
  const start = (request: Request) => {
    if (new URL(request.url()).origin !== origin) return;
    pending.add(request);
    lastActivity = Date.now();
  };
  const end = (request: Request) => {
    if (pending.delete(request)) lastActivity = Date.now();
  };
  context.on('request', start);
  context.on('requestfinished', end);
  context.on('requestfailed', end);
  return async function drain({ timeoutMs = 10_000, quietMs = 500 } = {}) {
    const deadline = Date.now() + timeoutMs;
    try {
      while (pending.size || Date.now() - lastActivity < quietMs) {
        if (Date.now() >= deadline) {
          const paths = [...pending].map((request) => new URL(request.url()).pathname);
          throw new Error(`Local proxy requests did not drain: ${paths.join(', ')}`);
        }
        await new Promise((resolve) => setTimeout(resolve, Math.min(quietMs, 50)));
      }
    } finally {
      context.off('request', start);
      context.off('requestfinished', end);
      context.off('requestfailed', end);
    }
  };
}
