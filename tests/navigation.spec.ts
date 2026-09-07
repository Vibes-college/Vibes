import { test, expect } from '@playwright/test';

const first = '/zh/works/attention-is-all-you-need/';
const second = '/zh/works/transformers-js/';

test('continuous lifecycle survives adjacent reading, history, search and languages', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/zh/');
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.locator(`.card-link[href="${first}"]`).click();
  await expect(page.locator('h1')).toHaveText('Attention Is All You Need');
  await page.locator('[data-direction="next"]').click();
  await expect(page).toHaveURL(new RegExp(second));
  // 键盘和按钮必须使用同一导航；重复进入不遗留旧详情监听。
  await page.locator('h1').click();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/works\/neural-networks\//);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(second));
  await page.locator('[data-back-link]').click();
  await page.getByRole('searchbox').fill('Transformer');
  await expect(page.locator('[data-search-grid] .card-link').first()).toBeVisible();
  await page.locator(`.card-link[href="${first}"]:visible`).click();
  await page.locator('.language-switch a[hreflang="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('[data-back-link]').click();
  await page.getByRole('searchbox').fill('Transformer');
  await expect(page.locator('[data-search-grid] .card-link')).toHaveCount(1);
  await expect(page.locator('[data-search-grid] .card-link')).toHaveAttribute(
    'href',
    '/en/works/attention-is-all-you-need/',
  );
  await page.locator('.language-switch a[hreflang="zh"]').click();
  await expect(page.locator('[data-search-grid] .card-link').first()).toBeVisible();
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  expect(errors).toEqual([]);
});

test('visible detail preparation stays bounded', async ({ page, request }) => {
  const response = await request.get(first);
  expect(response.headers()['cache-control']).toContain('max-age=60');
  await page.setViewportSize({ width: 1200, height: 2000 });
  await page.goto('/zh/');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          performance.getEntriesByType('resource').filter((r) => r.name.includes('/works/')).length,
      ),
    )
    .toBe(6);
  const prepared = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((r) => r.name.includes('/works/'))
      .map((r) => r.name),
  );
  expect(prepared.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.locator(`.card-link[href="${first}"]`).click();
  await expect(page.locator('h1')).toHaveText('Attention Is All You Need');
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
});

test('late first navigation cannot replace the last selected work', async ({ page }) => {
  await page.route(`**${first}`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.goto('/zh/');
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.locator(`.card-link[href="${first}"]`).click();
  await page.locator(`.card-link[href="${second}"]`).click();
  await expect(page.locator('h1')).toHaveText('Transformers.js');
  await page.waitForTimeout(850);
  await expect(page).toHaveURL(new RegExp(second));
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
});

test('failed background requests fall back to a readable normal navigation', async ({ page }) => {
  let fallback = false;
  await page.route(`**${first}`, async (route) => {
    if (route.request().isNavigationRequest()) {
      fallback = true;
      await route.continue();
    } else await route.abort('failed');
  });
  await page.goto('/zh/');
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.locator(`.card-link[href="${first}"]`).click();
  await expect(page.locator('h1')).toHaveText('Attention Is All You Need');
  expect(fallback).toBe(true);
  expect(await page.evaluate(() => performance.timeOrigin)).not.toBe(origin);
});

test('reported save-data suppresses automatic prefetch without blocking navigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true, effectiveType: '4g' },
      configurable: true,
    });
  });
  await page.goto('/zh/');
  await page.waitForTimeout(650);
  expect(
    await page.evaluate(
      () =>
        performance.getEntriesByType('resource').filter((r) => r.name.includes('/works/')).length,
    ),
  ).toBe(0);
  await page.locator(`.card-link[href="${first}"]`).click();
  await expect(page.locator('h1')).toHaveText('Attention Is All You Need');
});

test('return restores browse scroll and hash reading stays in the same document', async ({
  page,
}) => {
  await page.goto('/zh/');
  const card = page.locator('.card-link[href="/zh/works/karpathy-llm/"]');
  await card.scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  const origin = await page.evaluate(() => performance.timeOrigin);
  await card.click();
  await page.locator('.read-down').click();
  await expect(page).toHaveURL(/#reading$/);
  await page.goBack();
  await expect(page).not.toHaveURL(/#reading$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/zh\/$/);
  await expect
    .poll(async () => Math.abs((await page.evaluate(() => scrollY)) - scroll))
    .toBeLessThan(3);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
});

test('touch intent prepares a card outside the automatic candidates', async ({ page }) => {
  await page.goto('/zh/');
  const target = '/zh/works/llama-cpp/';
  // 不导航：验证真实触摸意图绑定也覆盖不在前6项的卡片。
  await page
    .locator(`.card-link[href="${target}"]`)
    .dispatchEvent('touchstart', { touches: [{ identifier: 0 }] });
  await expect
    .poll(() =>
      page.evaluate(
        (path) =>
          performance.getEntriesByType('resource').some((r) => new URL(r.name).pathname === path),
        target,
      ),
    )
    .toBe(true);
  await expect(page).toHaveURL(/\/zh\/$/);
});

test('history restores the position inside asynchronously recreated search results', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/zh/?q=a');
  const cards = page.locator('[data-search-grid] .card-link');
  await expect(cards.nth(5)).toBeVisible();
  await cards.nth(5).scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  await cards.nth(5).click();
  await expect(page.locator('[data-work-detail]')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('searchbox')).toHaveValue('a');
  await expect(cards.nth(5)).toBeVisible();
  await expect
    .poll(async () => Math.abs((await page.evaluate(() => scrollY)) - scroll))
    .toBeLessThan(3);
});

test('completed prefetch is reused in a persistent browser context', async ({
  playwright,
  browserName,
}, testInfo) => {
  test.setTimeout(90_000);
  // WebKit临时context没有磁盘缓存；用独立空profile验证普通浏览模式，不读取用户数据。
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = testInfo.project.use;
  const context = await playwright[browserName].launchPersistentContext(
    testInfo.outputPath('cache-profile'),
    {
      headless: true,
      baseURL: 'http://127.0.0.1:4322',
      viewport,
      userAgent,
      deviceScaleFactor,
      isMobile,
      hasTouch,
    },
  );
  try {
    const page = await context.newPage();
    await page.goto('/zh/');
    await expect
      .poll(() =>
        page.evaluate(
          (path) =>
            performance.getEntriesByType('resource').some((r) => new URL(r.name).pathname === path),
          first,
        ),
      )
      .toBe(true);
    const origin = await page.evaluate(() => performance.timeOrigin);
    const count = await page.evaluate(
      (path) =>
        performance.getEntriesByType('resource').filter((r) => new URL(r.name).pathname === path)
          .length,
      first,
    );
    await page.locator(`.card-link[href="${first}"]`).click();
    await expect(page.locator('h1')).toHaveText('Attention Is All You Need', { timeout: 1000 });
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
    const cached = await page.evaluate(
      ({ path, count }) => {
        const entries = performance
          .getEntriesByType('resource')
          .filter((r) => new URL(r.name).pathname === path) as PerformanceResourceTiming[];
        const last = entries.at(-1)!;
        // WebKit为磁盘缓存仍报告300字节固定头部开销，正文为0；Chromium报告transferSize=0。
        return (
          entries.length > count &&
          (last.transferSize === 0 || (last.transferSize === 300 && last.encodedBodySize === 0))
        );
      },
      { path: first, count },
    );
    expect(cached).toBe(true);
    if (testInfo.project.name === 'desktop-chromium') {
      // 经过真实60秒TTL后再访问，浏览器应重新向服务器读取或验证，仍保持连续导航。
      await page.waitForTimeout(61_000);
      await page.goBack();
      await page.locator(`.card-link[href="${first}"]`).click();
      await expect(page.locator('h1')).toHaveText('Attention Is All You Need');
      expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
      expect(
        await page.evaluate((path) => {
          const entries = performance
            .getEntriesByType('resource')
            .filter((r) => new URL(r.name).pathname === path) as PerformanceResourceTiming[];
          return entries.at(-1)!.transferSize;
        }, first),
      ).toBeGreaterThan(0);
    }
  } finally {
    await context.close();
  }
});

test('new-tab and external links preserve native navigation semantics', async ({
  page,
  context,
}) => {
  await page.goto(first);
  const origin = await page.evaluate(() => performance.timeOrigin);
  const external = page.locator('a[target="_blank"]').first();
  const destination = await external.getAttribute('href');
  expect(new URL(destination!).origin).not.toBe(new URL(page.url()).origin);
  // 截断外站加载，不依赖外部服务可用性；仍由真实链接打开新标签页。
  await context.route(destination!, (route) => route.fulfill({ body: 'External destination' }));
  const popupPromise = page.waitForEvent('popup');
  await external.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(destination!);
  await popup.close();
  // 无头浏览器不提供系统快捷键开标签行为；检查路由器不会取消修饰键点击。
  const uncancelled = await page.locator('[data-direction="next"]').evaluate((link) =>
    ['ctrlKey', 'metaKey'].map((key) => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, [key]: true });
      let native = false;
      window.addEventListener(
        'click',
        (observed) => {
          native = !observed.defaultPrevented;
          observed.preventDefault(); // 路由器处理之后阻止浏览器默认动作，只检查事件归属。
        },
        { once: true },
      );
      link.dispatchEvent(event);
      return native;
    }),
  );
  expect(uncancelled).toEqual([true, true]);
  await expect(page).toHaveURL(new RegExp(first));
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
});
