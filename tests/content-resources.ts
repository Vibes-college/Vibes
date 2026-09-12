import type { APIRequestContext, Page } from '@playwright/test';

export async function localResourceFailures(page: Page, request: APIRequestContext) {
  // The browser resolves HTML entities, relative URLs and document paths exactly as readers do.
  const resources = await page.evaluate(() => {
    const paths = new Set<string>();
    for (const element of document.querySelectorAll(
      'img[src], script[src], link[href], #reading a[href], source[src], video[poster]',
    )) {
      const raw =
        element.getAttribute('src') ??
        element.getAttribute('href') ??
        element.getAttribute('poster');
      if (!raw || raw.startsWith('#')) continue;
      const url = new URL(raw, document.baseURI);
      if (url.origin === location.origin) {
        url.hash = '';
        paths.add(url.href);
      }
    }
    return [...paths];
  });
  const failures: string[] = [];
  for (const url of resources) {
    const response = await request.get(url);
    if (response.status() !== 200) failures.push(`${url}: HTTP ${response.status()}`);
    await response.dispose();
  }
  return failures;
}
