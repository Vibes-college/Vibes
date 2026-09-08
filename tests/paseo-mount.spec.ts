import { test, expect } from '@playwright/test';

const probeUrl = process.env.PASEO_PROBE_URL;
if (probeUrl && !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(probeUrl))
  throw new Error('PASEO_PROBE_URL must be an explicitly selected local experiment daemon.');
test.skip(!probeUrl, 'Requires the separately built G1 probe and same-version local daemon.');
test.use({ baseURL: probeUrl });

test('direct mount retains its native root, styles and socket through Astro navigation', async ({
  page,
}) => {
  const errors: string[] = [];
  const activeSockets = new Set<object>();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('websocket', (socket) => {
    activeSockets.add(socket);
    socket.on('close', () => activeSockets.delete(socket));
  });
  await page.goto('/probe/one/');
  const timeOrigin = await page.evaluate(() => performance.timeOrigin);
  expect(activeSockets.size).toBe(0);
  await page.getByRole('button', { name: 'Mount native app' }).dblclick();
  await expect(page.locator('#root button').first()).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => activeSockets.size).toBe(1);
  const shape = () =>
    page.evaluate(() => ({
      // This counter is diagnostic-only in the G1 profile, not a second runtime.
      mounts: (window as unknown as { __vibesPaseo: { mountCount: number } }).__vibesPaseo
        .mountCount,
      styles: document.querySelector<HTMLStyleElement>('#react-native-stylesheet')?.sheet?.cssRules
        .length,
      rootBackground: getComputedStyle(document.getElementById('root')!.firstElementChild!)
        .backgroundColor,
    }));
  const before = await shape();
  expect(before.mounts).toBe(1);
  expect(before.styles).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Hide / show' }).click();
  await page.getByRole('link', { name: 'Article two' }).click();
  await expect(page).toHaveTitle('Host article two');
  await page.getByRole('button', { name: 'Hide / show' }).click();
  await page.getByRole('button', { name: 'Mount native app' }).click();
  await expect(page.locator('#root button').first()).toBeVisible();
  expect(await shape()).toEqual(before);
  expect(activeSockets.size).toBe(1);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
  await page.goBack();
  await expect(page).toHaveTitle('Host article one');
  expect(await shape()).toEqual(before);
  expect(errors).toEqual([]);
});

test('native width and keyboard focus stay inside the assigned container', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/probe/one/');
  const hostInput = page.getByRole('textbox', { name: 'Host keyboard input' });
  const hostStyles = () =>
    hostInput.evaluate((element) => ({
      font: getComputedStyle(element).font,
      padding: getComputedStyle(element).padding,
      border: getComputedStyle(element).border,
      viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
      htmlStyle: document.documentElement.getAttribute('style'),
    }));
  const before = await hostStyles();
  await page.getByRole('button', { name: 'Mount native app' }).click();
  await expect(page.locator('#root button').first()).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __vibesPaseoEnvironment: { width: number } })
            .__vibesPaseoEnvironment.width,
      ),
    )
    .toBe(420);
  if (testInfo.project.name === 'desktop-chromium') {
    const panelTop = await page
      .locator('#root')
      .evaluate((element) => element.getBoundingClientRect().top);
    await page.mouse.move(20, 250);
    await page.mouse.wheel(0, 360);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    expect(
      await page.locator('#root').evaluate((element) => element.getBoundingClientRect().top),
    ).toBe(panelTop);
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await hostInput.fill('host input');
  await hostInput.press('ControlOrMeta+k');
  await expect(hostInput).toBeFocused();
  await page.getByRole('button', { name: 'Narrow / wide' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __vibesPaseoEnvironment: { width: number } })
            .__vibesPaseoEnvironment.width,
      ),
    )
    .toBe(720);
  await page.getByRole('button', { name: 'Hide / show' }).click();
  await hostInput.fill('still independent');
  await expect(hostInput).toBeFocused();
  expect(await hostStyles()).toEqual(before);
  await expect(page).toHaveURL('/probe/one/');
  await expect(page).toHaveTitle('Host article one');
});

test('native container fits a 320px viewport without locking host scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/probe/one/');
  await page.getByRole('button', { name: 'Mount native app' }).click();
  await expect(page.locator('#root button').first()).toBeVisible({ timeout: 30_000 });
  const rect = await page.locator('#root').boundingBox();
  expect(rect).not.toBeNull();
  expect(rect!.x).toBeGreaterThanOrEqual(0);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(320);
  expect(rect!.height).toBeGreaterThan(400);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
});
