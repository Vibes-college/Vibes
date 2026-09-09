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

test('article speech bubble expires, stays usable with focus, and renews on article navigation', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const resources: string[] = [];
  page.on('request', (request) => resources.push(request.url()));
  await page.goto('/zh/works/attention-is-all-you-need/');
  const bubble = page.locator('[data-paseo-article-open]');
  await expect(bubble).toBeVisible();
  const bubbleBox = await bubble.boundingBox();
  const mascotBox = await launcher(page).boundingBox();
  expect(bubbleBox!.y + bubbleBox!.height).toBeLessThan(mascotBox!.y);
  await expect(bubble).toBeHidden({ timeout: 6500 });
  await expect(launcher(page)).toBeVisible();

  await launcher(page).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(bubble).toBeFocused();
  await page.waitForTimeout(5200);
  await expect(bubble).toBeVisible();
  const next = page.getByRole('link', { name: '下一个作品：Transformers.js', exact: true });
  await next.focus();
  await expect(bubble).toBeVisible();
  await expect(bubble).toBeHidden({ timeout: 6500 });
  await next.click();
  await expect(page).toHaveURL(/\/zh\/works\/transformers-js\/$/);
  await expect(bubble).toBeVisible();
  await expect(bubble).toBeHidden({ timeout: 6500 });
  expect(resources.filter((url) => /\/vendor\/paseo\/|\/host\.[^/]+\.js/.test(url))).toEqual([]);
});

test('article speech bubble supports mouse hover and touch rediscovery without changing ordinary chat', async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  await page.goto('/zh/works/attention-is-all-you-need/');
  const bubble = page.locator('[data-paseo-article-open]');
  await expect(bubble).toBeVisible();
  await expect(bubble).toBeHidden({ timeout: 6500 });
  if (!info.project.use.hasTouch) {
    await launcher(page).hover();
    await expect(bubble).toBeVisible();
    await page.waitForTimeout(5200);
    await expect(bubble).toBeVisible();
    await bubble.hover();
    await expect(bubble).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(bubble).toBeVisible();
    await expect(bubble).toBeHidden({ timeout: 6500 });
    return;
  }
  // A real touch must not leave a synthetic hover holding the bubble open.
  await page.route(native, (route) => route.abort());
  await launcher(page).tap();
  await expect(page.locator(panel)).toBeVisible();
  await page.locator('[data-paseo-close]').tap();
  await expect(page.locator(panel)).toBeHidden();
  await expect(bubble).toBeVisible();
  await expect(bubble).toBeHidden({ timeout: 6500 });
  await launcher(page).tap();
  await page.locator('[data-paseo-close]').tap();
  await expect(bubble).toBeVisible();
  await bubble.tap();
  await expect(page.locator(panel)).toBeVisible();
  await page.locator('[data-paseo-close]').tap();
  await expect(page.locator(panel)).toBeHidden();
  await expect(bubble).toBeVisible();
  await expect(bubble).toBeHidden({ timeout: 6500 });
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

test('full screen holds the article position and minimize releases it', async ({ page }, info) => {
  await page.goto('/zh/works/attention-is-all-you-need/#reading');
  await expect(page.locator('.detail-page')).toHaveAttribute('data-detail-page', 'reading');
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  const articleY = await page.evaluate(() => scrollY);
  expect(articleY).toBeGreaterThan(0);
  await launcher(page).click();
  await mounted(page);
  await page.locator('[data-paseo-expand]').click();
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  const readingTop = await page
    .locator('.reading-section')
    .first()
    .evaluate((element) => element.getBoundingClientRect().top);
  const box = await page.locator(panel).boundingBox();
  expect(box?.x).toBeCloseTo(0);
  expect(box?.y).toBeCloseTo(0);
  expect(box?.height).toBeCloseTo(page.viewportSize()!.height);
  if (info.project.use.isMobile && info.project.use.defaultBrowserType !== 'chromium')
    // Mobile WebKit has no wheel API; a real key event still exercises document scrolling.
    await page.keyboard.press('PageDown');
  else await page.mouse.wheel(0, 500);
  await page.evaluate(
    () =>
      new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))),
  );
  await expect
    .poll(() =>
      page
        .locator('.reading-section')
        .first()
        .evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeCloseTo(readingTop);
  await page.locator('[data-paseo-close]').click();
  await expect(page.locator(panel)).toBeHidden();
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(articleY);
  await launcher(page).click();
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  await page.locator('[data-paseo-compact]').click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(articleY);
});

test('compact fits a shortened and panned visual viewport', async ({ page }, info) => {
  test.skip(!info.project.use.isMobile, 'The shortened compact layout is the phone layout.');
  await page.goto('/zh/');
  await launcher(page).click();
  await mounted(page);
  // A controlled viewport signal tests positioning, not Safari's real keyboard.
  const view = await page.evaluate(() => {
    const view = window.visualViewport!;
    const height = Math.max(240, view.height - 260);
    Object.defineProperties(view, {
      height: { configurable: true, get: () => height },
      offsetTop: { configurable: true, get: () => 42 },
    });
    view.dispatchEvent(new Event('resize'));
    return { height, top: 42 };
  });
  const bounds = await page.locator(panel).boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(view.top);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(view.top + view.height);
});

test('full screen follows browser history without carrying the previous article position', async ({
  page,
}) => {
  await page.goto('/zh/');
  const next = page.locator('a[href="/zh/works/attention-is-all-you-need/"]').first();
  await next.scrollIntoViewIfNeeded();
  const firstY = await page.evaluate(() => scrollY);
  await next.click();
  await expect(page).toHaveURL(/\/zh\/works\/attention-is-all-you-need\/$/);
  await page.locator('.read-down').click();
  await expect(page.locator('.detail-page')).toHaveAttribute('data-detail-page', 'reading');
  await page.evaluate(() => scrollTo({ top: 300, behavior: 'instant' }));
  const secondY = await page.evaluate(() => scrollY);
  expect(secondY).toBeGreaterThan(firstY);
  await launcher(page).click();
  await mounted(page);
  await page.locator('[data-paseo-expand]').click();
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL(/\/zh\/$/);
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  await page.locator('[data-paseo-compact]').click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(firstY, 0);
  await page.locator('[data-paseo-expand]').click();
  await page.goForward();
  await expect(page).toHaveURL(/\/zh\/works\/attention-is-all-you-need\/$/);
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');
  await page.locator('[data-paseo-close]').click();
  // This history entry is the article cover, whose normal position is the top.
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});
