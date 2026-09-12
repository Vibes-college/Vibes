import { test, expect } from './browser-test.ts';
import { execFileSync } from 'node:child_process';
import { readCatalog } from '../src/lib/content/catalog.ts';
import { localResourceFailures } from './content-resources.ts';

// A shared-code change checks all articles; a content-only diff checks affected work languages.
const catalog = readCatalog();
const base = process.env.CONTENT_BASE_REF || 'origin/main';
const changed = execFileSync('git', ['diff', '--no-renames', '--name-only', base, '--'], {
  encoding: 'utf8',
})
  .trim()
  .split('\n');
const ids = new Set(
  changed.flatMap((path) => path.match(/^src\/content\/works\/([^/]+)\//)?.[1] ?? []),
);
const all =
  !ids.size ||
  changed.some(
    (path) =>
      path.startsWith('public/') ||
      (path.startsWith('src/') && !path.startsWith('src/content/works/')),
  );
for (const work of catalog.works.filter((work) => all || ids.has(work.meta.id))) {
  for (const [locale, version] of Object.entries(work.versions)) {
    if (version?.data.status !== 'published') continue;
    test(`${work.meta.id}/${locale}: reading, resources and narrow layout`, async ({
      page,
      request,
    }) => {
      const response = await page.goto(`/${locale}/works/${work.meta.id}/`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('.article-header h1')).toHaveText(version.data.title);
      await page.locator('.read-down').click();
      await expect(page.locator('#reading')).toBeVisible();
      await expect(page.locator('#reading .prose')).toContainText(/./);
      await expect(page.locator('#reading a[href*="/edit/main/src/content/"]')).toHaveAttribute(
        'href',
        `https://github.com/Vibes-college/Vibes/edit/main/src/content/works/${work.meta.id}/${locale}.${version.file.endsWith('.mdx') ? 'mdx' : 'md'}`,
      );
      expect(await localResourceFailures(page, request)).toEqual([]);
      for (const image of await page.locator('#reading img').all()) {
        const local = await image.evaluate(
          (element) => new URL((element as HTMLImageElement).src).origin === location.origin,
        );
        if (!local) continue;
        // Closed disclosures keep lazy images unloaded; exercise the actual opening control first.
        for (const disclosure of await image.locator('xpath=ancestor::details').all()) {
          if ((await disclosure.getAttribute('open')) === null)
            await disclosure.locator(':scope > summary').click();
        }
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate(
              (element) =>
                (element as HTMLImageElement).complete &&
                (element as HTMLImageElement).naturalWidth > 0,
            ),
          )
          .toBe(true);
      }
      for (const width of [1280, 320]) {
        await page.setViewportSize({ width, height: 800 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
      }
    });
  }
}

test('content smoke reports a missing relative image instead of accepting the page HTML', async ({
  page,
  request,
}) => {
  await page.route('**/zh/works/beui-motion-lab/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><section id="reading"><img src="./missing-review-image.png" alt="fixture"></section>',
    }),
  );
  await page.goto('/zh/works/beui-motion-lab/');
  expect(await localResourceFailures(page, request)).toEqual([
    'http://127.0.0.1:4322/zh/works/beui-motion-lab/missing-review-image.png: HTTP 404',
  ]);
});
