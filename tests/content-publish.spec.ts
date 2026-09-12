import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readCatalog } from '../src/lib/content/catalog.ts';

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
    test(`${work.meta.id}/${locale}: published article and local resources`, async ({
      request,
    }) => {
      const response = await request.get(`/${locale}/works/${work.meta.id}/`);
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain('data-pagefind-body');
      expect(html).toContain('id="reading"');
      expect(html).toContain(`/edit/main/src/content/works/${work.meta.id}/${locale}.`);
      const paths = new Set(
        [...html.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)]
          .map((match) => match[1])
          .filter((path) => !path.endsWith('/')),
      );
      for (const path of paths) expect((await request.get(path)).status(), path).toBe(200);
    });
  }
}

test('article reading remains within a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/zh/works/beui-motion-lab/#reading');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('#reading')).toContainText(/./);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.waitForLoadState('networkidle');
});
