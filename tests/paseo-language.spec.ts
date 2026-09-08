import { test, expect, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMockSession } from './fixtures/paseo-webui/mock-session.ts';
import { highlightResources } from './fixtures/paseo-webui/highlight-resources.ts';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });
function resources() {
  const root = resolve('.scratch/paseo-webui/artifacts/A4');
  const receipt = JSON.parse(readFileSync(resolve(root, 'build-receipt.json'), 'utf8'));
  const locales = Object.fromEntries(
    ['ar', 'es', 'fr', 'ja', 'ko', 'pt-BR', 'ru', 'zh-CN'].map((locale) => {
      const files = receipt.files.filter((file: { path: string }) =>
        new RegExp('/' + locale + '-[a-f0-9]+\\.js$').test(file.path),
      );
      expect(files).toHaveLength(1);
      return [locale, receipt.publicPath + '/' + files[0].path];
    }),
  );
  return { locales, grammar: highlightResources()[0] };
}
async function settings(page: Page) {
  if (!(await page.getByTestId('sidebar-settings').isVisible()))
    await page.locator('#root #menu-button:visible').first().click();
  await page.getByTestId('sidebar-settings').click();
  if (!(await page.getByTestId('settings-language-select').isVisible()))
    await page.getByRole('button', { name: '通用', exact: true }).click();
  await expect(page.getByTestId('settings-language-select')).toBeVisible();
}
async function select(page: Page, locale: string) {
  await page.getByTestId('settings-language-select').click();
  await page.getByTestId('settings-language-' + locale).click();
}

test('all native languages load on selection without fetching unrelated grammars', async ({
  browser,
}, info) => {
  test.skip(process.env.PASEO_MOCK_PROFILE !== 'A4', 'Requires the A4 production fixture.');
  test.setTimeout(120000);
  const { locales, grammar } = resources();
  await withMockSession(browser, info, async ({ page, open }) => {
    const downloads: string[] = [];
    page.on('request', (r) => downloads.push(new URL(r.url()).pathname));
    await open();
    expect(downloads.filter((url) => Object.values(locales).includes(url))).toEqual([
      locales['zh-CN'],
    ]);
    expect(downloads).not.toContain(grammar);
    await settings(page);
    const labels = {
      en: 'Language',
      ar: 'لغة',
      es: 'Idioma',
      fr: 'Langue',
      ja: '言語',
      ko: '언어',
      'pt-BR': 'Idioma',
      ru: 'Язык',
      'zh-CN': '语言',
    };
    for (const [locale, label] of Object.entries(labels)) {
      await select(page, locale);
      await expect(page.getByText(label, { exact: true })).toBeVisible();
      expect(await page.locator('#root').innerText()).not.toMatch(
        /settings\.general\.|common\.actions\./,
      );
      expect(downloads).not.toContain(grammar);
    }
    for (const path of Object.values(locales))
      expect(downloads.filter((url) => url === path)).toHaveLength(1);
    await info.attach('language-requests', {
      body: JSON.stringify({ locales, grammar, downloads }),
      contentType: 'application/json',
    });
  });
});

test('initial language failure keeps English usable and explicit retry restores Chinese', async ({
  browser,
}, info) => {
  test.skip(process.env.PASEO_MOCK_PROFILE !== 'A4', 'Requires the A4 production fixture.');
  const { locales, grammar } = resources();
  await withMockSession(browser, info, async ({ page, open }) => {
    let attempts = 0;
    const requests: string[] = [];
    page.on('request', (r) => requests.push(new URL(r.url()).pathname));
    await page.route('**' + locales['zh-CN'], async (route) => {
      if (++attempts === 1) await route.abort();
      else await route.continue();
    });
    await page.goto('http://localhost:4393/zh/');
    await page.locator('[data-paseo-open]').click();
    await expect(page.getByTestId('paseo-language-error')).toContainText('Language');
    await expect(page.locator('#root #menu-button:visible').first()).toBeVisible();
    expect(attempts).toBe(1);
    await page.getByTestId('paseo-language-retry').click();
    await expect(page.getByTestId('paseo-language-error')).toBeHidden();
    await open();
    expect(attempts).toBe(2);
    expect(requests).not.toContain(grammar);
  });
});

test('failed selection can retry and late language downloads cannot overwrite English', async ({
  browser,
}, info) => {
  test.skip(process.env.PASEO_MOCK_PROFILE !== 'A4', 'Requires the A4 production fixture.');
  test.setTimeout(90000);
  const { locales } = resources();
  await withMockSession(browser, info, async ({ page, open }) => {
    await open();
    await settings(page);
    let french = 0;
    await page.route('**' + locales.fr, async (route) => {
      if (++french === 1) await route.abort();
      else await route.continue();
    });
    await select(page, 'fr');
    await expect(page.getByTestId('paseo-language-error')).toBeVisible();
    await expect(page.getByText('语言', { exact: true })).toBeVisible();
    await page.getByTestId('paseo-language-retry').click();
    await expect(page.getByText('Langue', { exact: true })).toBeVisible();
    expect(french).toBe(2);
    let japanese: Route | undefined;
    await page.route('**' + locales.ja, (route) => {
      japanese = route;
    });
    await select(page, 'ja');
    await expect.poll(() => Boolean(japanese)).toBe(true);
    await select(page, 'en');
    await expect(page.getByText('Language', { exact: true })).toBeVisible();
    const response = page.waitForResponse(
      (response) => new URL(response.url()).pathname === locales.ja,
    );
    await japanese!.continue();
    await response;
    await page.waitForTimeout(300);
    await expect(page.getByText('Language', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('@paseo:app-settings') || '{}').language,
      ),
    ).toBe('en');
  });
});
