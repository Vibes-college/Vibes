import { test, expect } from '@playwright/test';
const hostUrl = process.env.PASEO_HOST_URL;
if (hostUrl && !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(hostUrl))
  throw new Error('PASEO_HOST_URL must select a local H experiment.');
test.skip(!hostUrl, 'Requires the isolated H production export and same-version daemon.');
test.use({ baseURL: hostUrl });
const native = '**/vendor/paseo/**/*.js';
const panel = '#local-assistant';
const opened = async (page: import('@playwright/test').Page) => {
  await expect(page.locator(panel)).toHaveAttribute('data-paseo-state', 'operable', {
    timeout: 45000,
  });
  await expect(page.locator('#root button').first()).toBeVisible();
};
const shape = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ({
    mounts: (window as unknown as { __vibesPaseo: { mountCount: number } }).__vibesPaseo.mountCount,
    styles: document.querySelector<HTMLStyleElement>('#react-native-stylesheet')?.sheet?.cssRules
      .length,
    origin: performance.timeOrigin,
  }));
test('ordinary browsing and no-JS load no assistant runtime or connection', async ({
  page,
  browser,
}) => {
  const requests: string[] = [];
  let sockets = 0;
  page.on('request', (request) => requests.push(request.url()));
  page.on('websocket', () => sockets++);
  await page.goto('/zh/');
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  expect(requests.filter((url) => /\/vendor\/paseo\/|\/host\.[^/]+\.js/.test(url))).toEqual([]);
  expect(sockets).toBe(0);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  const staticRequests: string[] = [];
  staticPage.on('request', (request) => staticRequests.push(request.url()));
  await staticPage.goto(hostUrl + '/zh/');
  await expect(staticPage.locator('.paseo-noscript')).toBeVisible();
  await expect(staticPage.locator('.paseo-noscript')).toHaveText(
    '启用 JavaScript 后可打开本地助手。',
  );
  expect(staticRequests.filter((url) => /\/vendor\/paseo\//.test(url))).toEqual([]);
  await context.close();
});
test('concurrent opens, hiding and Astro navigation retain one root and connection', async ({
  page,
}) => {
  const errors: string[] = [];
  const sockets = new Set<object>();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('websocket', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  await page.goto('/zh/');
  await page.locator('[data-paseo-open]').dblclick();
  await opened(page);
  await expect.poll(() => sockets.size).toBe(1);
  const before = await shape(page);
  expect(before.mounts).toBe(1);
  expect(before.styles).toBeGreaterThan(0);
  await page.locator('[data-paseo-close]').click();
  await expect(page.locator('[data-paseo-open]')).toBeFocused();
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await page.locator('[data-paseo-open]').click();
  await opened(page);
  expect(await shape(page)).toEqual(before);
  expect(sockets.size).toBe(1);
  expect(errors).toEqual([]);
});
test('failed first native request is visible and retry mounts once', async ({ page }) => {
  await page.route(native, (route) => route.abort());
  await page.goto('/zh/');
  await page.locator('[data-paseo-open]').click();
  await expect(page.locator(panel)).toHaveAttribute('data-paseo-state', 'resource-error');
  await expect(page.locator('[data-paseo-status]')).toContainText('加载失败');
  await page.unroute(native);
  await page.locator('[data-paseo-retry]').click();
  await opened(page);
  expect((await shape(page)).mounts).toBe(1);
});
test('closing while native code loads stays closed and reopens the same mount', async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(native, async (route) => {
    await held;
    await route.continue();
  });
  await page.goto('/zh/');
  const requested = page.waitForRequest(
    (request) => request.url().includes('/vendor/paseo/') && request.url().endsWith('.js'),
  );
  await page.locator('[data-paseo-open]').click();
  await requested;
  await page.locator('[data-paseo-close]').click();
  release();
  await expect(page.locator(panel)).toHaveAttribute('data-paseo-state', 'operable', {
    timeout: 45000,
  });
  await expect(page.locator(panel)).toBeHidden();
  await page.locator('[data-paseo-open]').click();
  await opened(page);
  expect((await shape(page)).mounts).toBe(1);
});
test('old missing native assets provide a full document recovery', async ({ page }) => {
  await page.route(native, (route) =>
    route.fulfill({ status: 404, contentType: 'text/plain', body: 'Missing previous version' }),
  );
  await page.goto('/zh/');
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.locator('[data-paseo-open]').click();
  await expect(page.locator(panel)).toHaveAttribute('data-paseo-state', 'resource-error');
  await page.unroute(native);
  await page.locator('[data-paseo-reload]').click();
  await expect.poll(() => page.evaluate(() => performance.timeOrigin)).not.toBe(origin);
  await expect(page.locator(panel)).toBeHidden();
  await page.locator('[data-paseo-open]').click();
  await opened(page);
});
test('explicit exit reloads without reopening or changing native device storage', async ({
  page,
}) => {
  let requestsAfterExit = 0;
  let exiting = false;
  page.on('request', (request) => {
    if (exiting && request.url().includes('/vendor/paseo/')) requestsAfterExit++;
  });
  await page.goto('/zh/');
  await page.locator('[data-paseo-open]').click();
  await opened(page);
  const origin = await page.evaluate(() => performance.timeOrigin);
  const storageDigest = () =>
    page.evaluate(async () => {
      const entries = Object.keys(localStorage)
        .filter((key) => /host.*registry|daemon.*registry/i.test(key))
        .sort()
        .map((key) => [key, localStorage.getItem(key)]);
      const hash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(entries)),
      );
      return Array.from(new Uint8Array(hash))
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('');
    });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Object.keys(localStorage).filter((key) => /host.*registry|daemon.*registry/i.test(key))
            .length,
      ),
    )
    .toBeGreaterThan(0);
  const before = await storageDigest();
  exiting = true;
  await page.locator('[data-paseo-exit]').click();
  await expect.poll(() => page.evaluate(() => performance.timeOrigin)).not.toBe(origin);
  await expect(page.locator('[data-paseo-open]')).toBeEnabled();
  await expect(page.locator(panel)).toBeHidden();
  expect(requestsAfterExit).toBe(0);
  expect(await storageDigest()).toBe(before);
});
test('outside search keeps native shortcuts and styles out of Explore', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/zh/');
  const search = page.getByRole('searchbox');
  const style = () =>
    search.evaluate((element) => {
      const css = getComputedStyle(element);
      return {
        font: css.font,
        padding: css.padding,
        border: css.border,
        background: css.backgroundColor,
      };
    });
  const before = await style();
  await page.locator('[data-paseo-open]').click();
  await opened(page);
  await search.focus();
  await search.press('ControlOrMeta+Shift+o');
  await expect(search).toBeFocused();
  expect(await style()).toEqual(before);
  await page.locator('[data-paseo-close]').click();
  await expect(page.locator('[data-paseo-open]')).toBeFocused();
});
test('320px host and native composer fit with independent panel scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/zh/');
  const originalScroll = await page.evaluate(() => scrollY);
  await page.locator('[data-paseo-open]').click();
  await opened(page);
  const bounds = await page.locator(panel).boundingBox();
  expect(bounds?.x).toBe(0);
  expect(bounds?.width).toBe(320);
  expect(bounds?.height).toBe(568);
  const rootBounds = await page.locator('#root').boundingBox();
  expect(rootBounds!.y + rootBounds!.height).toBeLessThanOrEqual(568);
  expect(await page.evaluate(() => scrollY)).toBe(originalScroll);
  await page.locator('[data-paseo-close]').click();
  await expect(page.locator(panel)).toBeHidden();
});
test('offline first open gives reload recovery when the host module is unavailable', async ({
  page,
  context,
}) => {
  await page.goto('/zh/');
  const origin = await page.evaluate(() => performance.timeOrigin);
  await context.setOffline(true);
  await page.locator('[data-paseo-open]').click();
  await expect(page.locator('[data-paseo-status]')).toContainText('加载失败');
  await expect(page.locator('[data-paseo-retry]')).toHaveText('刷新页面');
  await context.setOffline(false);
  await page.locator('[data-paseo-retry]').click();
  await expect.poll(() => page.evaluate(() => performance.timeOrigin)).not.toBe(origin);
  await page.locator('[data-paseo-open]').click();
  await opened(page);
});
