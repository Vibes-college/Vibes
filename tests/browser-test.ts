import { test as base, expect, type Page, type Request, type Frame } from '@playwright/test';

// Only requests to the local proxy can interrupt that proxy when the page closes.
// Remote media can remain pending independently and must not hold its teardown open.
export function watchLocalRequests(page: Page, origin: string) {
  const pending = new Set<Request>();
  let changed = Date.now();
  let navigation: { request: Request; previous: Set<Request> } | undefined;
  const started = (request: Request) => {
    const url = new URL(request.url());
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) return;
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      navigation = { request, previous: new Set(pending) };
    }
    pending.add(request);
    changed = Date.now();
  };
  const ended = (request: Request) => {
    if (pending.delete(request)) changed = Date.now();
    if (navigation?.request === request) navigation = undefined;
  };
  const committed = (frame: Frame) => {
    if (frame !== page.mainFrame() || !navigation || frame.url() !== navigation.request.url())
      return;
    // Match Playwright's new-document lifecycle reset. Media from the replaced
    // document may not emit a page-level completion after the document is gone.
    for (const request of navigation.previous) pending.delete(request);
    navigation = undefined;
    changed = Date.now();
  };
  const detached = (frame: Frame) => {
    for (const request of pending) if (request.frame() === frame) pending.delete(request);
    changed = Date.now();
  };
  page.on('framenavigated', committed);
  page.on('framedetached', detached);
  page.on('request', started);
  page.on('requestfinished', ended);
  page.on('requestfailed', ended);
  return async () => {
    try {
      if (!page.isClosed()) {
        await expect
          .poll(
            () =>
              pending.size
                ? [...pending].map((request) => request.url())
                : Date.now() - changed >= 500
                  ? []
                  : ['settling'],
            {
              timeout: 10_000,
              message: 'Local proxy requests must drain before closing the page',
            },
          )
          .toEqual([]);
      }
    } finally {
      page.off('framenavigated', committed);
      page.off('framedetached', detached);
      page.off('request', started);
      page.off('requestfinished', ended);
      page.off('requestfailed', ended);
    }
  };
}

export const test = base.extend<{ drainRequests: void }>({
  drainRequests: [
    async ({ page, baseURL }, use) => {
      const drain = watchLocalRequests(page, new URL(baseURL!).origin);
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
