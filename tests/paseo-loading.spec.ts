import { test, expect } from './browser-test.ts';
import type { Page } from '@playwright/test';

const native = '**/vendor/paseo/**/*.js';
const panel = '#local-assistant';
const launcher = (page: Page) => page.locator('[data-paseo-open]:not([data-paseo-article-open])');
const mounted = async (page: Page) => {
  await expect(page.locator(panel)).toHaveAttribute('data-paseo-state', 'operable', {
    timeout: 45_000,
  });
};
const shape = (page: Page) =>
  page.evaluate(() => ({
    mounts: (window as unknown as { __vibesPaseo: { mountCount: number } }).__vibesPaseo.mountCount,
    styles: document.querySelector<HTMLStyleElement>('#react-native-stylesheet')?.sheet?.cssRules
      .length,
    origin: performance.timeOrigin,
  }));

test('browsing and no-JS do not fetch or connect Paseo', async ({ page, browser, baseURL }) => {
  const resources: string[] = [];
  let sockets = 0;
  page.on('request', (request) => resources.push(request.url()));
  page.on('websocket', () => sockets++);
  await page.goto('/zh/');
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  expect(resources.filter((url) => /\/vendor\/paseo\/|\/host\.[^/]+\.js/.test(url))).toEqual([]);
  expect(sockets).toBe(0);
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await context.newPage();
    const requested: string[] = [];
    staticPage.on('request', (request) => requested.push(request.url()));
    await staticPage.goto(baseURL + '/zh/');
    await expect(staticPage.locator('.paseo-noscript')).toBeVisible();
    await expect(staticPage.locator('.paseo-noscript').getByRole('link')).toHaveAttribute(
      'href',
      /paseo\.sh/,
    );
    expect(requested.filter((url) => /\/vendor\/paseo\//.test(url))).toEqual([]);
    await staticPage.waitForLoadState('networkidle');
  } finally {
    await context.close();
  }
});

test('first click shows usable onboarding while the native bundle is pending', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(native, async (route) => {
    await pending;
    await route.continue();
  });
  try {
    await page.goto('/zh/');
    await launcher(page).click();
    await expect(page.locator(panel)).toBeVisible();
    await expect(page.locator('[data-paseo-onboarding]')).toBeVisible();
    await expect(
      page.locator('[data-paseo-onboarding]').getByRole('link', { name: /下载|Download/ }),
    ).toHaveAttribute('href', 'https://paseo.sh/download');
    await page.locator('[data-paseo-close]').click();
    await expect(page.locator(panel)).toBeHidden();
    release();
    await mounted(page);
    await expect(page.locator(panel)).toBeHidden();
    await launcher(page).click();
    await expect(page.locator(panel)).toBeVisible();
    expect((await shape(page)).mounts).toBe(1);
  } finally {
    release();
  }
});

test('failed resources retain guidance and retry mounts once', async ({ page }) => {
  await page.route(native, (route) => route.abort());
  await page.goto('/zh/');
  await launcher(page).click();
  await expect(page.locator(panel)).toHaveAttribute('data-paseo-state', 'resource-error');
  await expect(page.locator('[data-paseo-status]')).toContainText('加载失败');
  await expect(page.locator('[data-paseo-onboarding]')).toBeVisible();
  await page.unroute(native);
  await page.locator('[data-paseo-retry]').click();
  await mounted(page);
  expect((await shape(page)).mounts).toBe(1);
});

test('navigation and compact/full preserve one root and live styles', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/zh/works/attention-is-all-you-need/');
  await page.locator('[data-paseo-article-open]').click();
  await mounted(page);
  const before = await shape(page);
  expect(before.mounts).toBe(1);
  expect(before.styles).toBeGreaterThan(0);
  await page.locator('[data-paseo-expand]').click();
  await expect(page.locator(panel)).toHaveAttribute('data-paseo-surface', 'full');
  await page.locator('[data-paseo-compact]').click();
  await expect(page.locator(panel)).toHaveAttribute('data-paseo-surface', 'compact');
  await page.locator('[data-paseo-close]').click();
  await page.getByRole('link', { name: '下一个作品：Transformers.js', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/works\/transformers-js\/$/);
  await launcher(page).click();
  await mounted(page);
  expect(await shape(page)).toEqual(before);
  expect(errors).toEqual([]);
});
