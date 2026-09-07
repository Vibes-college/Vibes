import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { assertBudget } from '../scripts/budget-policy.ts';

test('local filtering, empty state, and URL survive refresh', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.work-card:visible')).toHaveCount(24);
  await page.locator('.category-nav a[href="/zh/tags/paper/"]').click();
  await expect(page.locator('.work-card:visible')).toHaveCount(4);
  await page.getByRole('searchbox').fill('LoRA');
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('searchbox')).toHaveValue('LoRA');
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await page.getByRole('searchbox').fill('not-in-the-collection');
  await expect(page.getByRole('heading', { name: '暂时没有找到。' })).toBeVisible();
  await page.getByRole('button', { name: '清空搜索与筛选' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(24);
});

test('cards navigate directly to a complete article; browser back restores filters', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?type=paper');
  await expect(page.locator('.work-card:visible')).toHaveCount(4);
  await page
    .getByRole('link', {
      name: 'Explore LoRA: Low-Rank Adaptation of Large Language Models',
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/works\/lora\//);
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('LoRA');
  await expect(page.locator('.prose table')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: '来源与延伸阅读' })).toBeVisible();
  expect((await page.locator('.prose').textContent())!.length).toBeGreaterThan(700);
  await page.reload();
  await expect(page.locator('.prose')).toContainText('低秩矩阵');
  await page.goBack();
  await expect(page).toHaveURL(/tags\/paper/);
  await expect(page.locator('.work-card:visible')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('standalone detail is readable with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/zh/works/attention-is-all-you-need/');
  await expect(page.getByRole('heading', { name: 'Attention Is All You Need' })).toBeVisible();
  await expect(page.locator('.detail-description')).toContainText('Transformer');
  await page.getByRole('link', { name: 'Explore', exact: true }).click();
  await expect(page.locator('.work-card')).toHaveCount(24);
  await page.getByRole('link', { name: 'Explore Transformers.js', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Transformers.js' })).toBeVisible();
  await context.close();
});

test('no horizontal overflow, no embeds, two-line card descriptions', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('iframe, video, audio')).toHaveCount(0);
  expect(
    await page.locator('.card-summary').evaluateAll((elements) =>
      elements.every((el) => {
        const style = getComputedStyle(el);
        return (
          el.clientHeight <= parseFloat(style.lineHeight) * 2 + 1 && style.webkitLineClamp === '2'
        );
      }),
    ),
  ).toBe(true);
  await page.getByRole('link', { name: 'Explore Transformers.js', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .locator('details')
    .filter({ has: page.locator('table') })
    .locator('summary')
    .click();
  await expect(page.locator('.prose table')).toBeVisible();
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('static output stays small and content routes exist', async ({ request, page }) => {
  const js = readdirSync('dist/_astro').filter((file) => file.endsWith('.js'));
  const total = js.reduce((n, file) => n + gzipSync(readFileSync(`dist/_astro/${file}`)).length, 0);
  expect(js.length).toBeGreaterThan(0);
  assertBudget({
    javascriptGzip: total,
    homepageGzip: gzipSync(readFileSync('dist/zh/index.html')).length,
    interactionSource: statSync('src/scripts/explore.ts').size,
  });
  for (const slug of readdirSync('dist/zh/works')) {
    const html = readFileSync(`dist/zh/works/${slug}/index.html`, 'utf8');
    expect(html).toContain('<table>');
    expect(html).toContain('来源与延伸阅读');
    expect(html).not.toContain('<dialog');
  }
  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('/works/lora/');
  expect((await request.get('/not-a-real-page')).status()).toBe(404);
  await page.goto('/not-a-real-page');
  await expect(page.locator('.not-found')).toContainText('404');
});

// 验证两段式阅读与真实相邻导航，避免折叠或切换破坏内容路径。
test('detail overview, disclosure, and adjacent navigation', async ({ page }) => {
  await page.goto('/works/attention-is-all-you-need/');
  await expect(page.locator('[data-direction="previous"]')).toHaveCount(0);
  await expect(page.locator('details[open]')).toHaveCount(1);
  await expect(page.locator('.reading-note, .section-number, .source-link')).toHaveCount(0);
  await page.getByRole('link', { name: '向下阅读正文' }).click();
  const section = page.locator('details').nth(1);
  await section.locator('summary').click();
  await expect(section).toHaveAttribute('open', '');
  await section.locator('summary').click();
  await expect(section).not.toHaveAttribute('open', '');
  await page.locator('[data-direction="next"]').click();
  await expect(page).toHaveURL(/transformers-js/);
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.keyboard.press('ArrowLeft');
  await expect(page).toHaveURL(/attention-is-all-you-need/);
  await page.locator('.work-facts a[href="/zh/tags/paper/"]').click();
  await expect(page.locator('.work-card:visible')).toHaveCount(4);
});

// 使用浏览器输入事件验证横滑，覆盖原有本地验收的触摸路径。
test('touch swipe navigates to the next work and the previous button returns', async ({
  page,
  context,
  browserName,
  isMobile,
}, testInfo) => {
  test.skip(!isMobile, '触摸路径只在手机模拟项目执行');
  await page.goto('/works/transformers-js/');
  if (browserName === 'webkit') {
    // Playwright没有WebKit原生滑动API，使用同一DOM触摸事件验证处理逻辑。
    const detail = page.locator('[data-work-detail]');
    await detail.dispatchEvent('touchstart', { touches: [{ clientX: 270, clientY: 430 }] });
    await detail.dispatchEvent('touchend', { changedTouches: [{ clientX: 80, clientY: 432 }] });
    await expect(page).toHaveURL(/works\/neural-networks\//);
    await page.locator('[data-direction="previous"]').click();
    await expect(page).toHaveURL(/works\/transformers-js\//);
    return;
  }
  const session = await context.newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 270, y: 430 }],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 200, y: 431 }],
    });
    await expect(page.locator('.edge-navigation')).toBeVisible();
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 80, y: 550 }],
    });
    await expect(page.locator('.edge-navigation')).toHaveCSS('top', '550px');
    await page.screenshot({ path: testInfo.outputPath('native-edge.png') });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page).toHaveURL(/works\/neural-networks\//);
    await page.locator('[data-direction="previous"]').click();
    await expect(page).toHaveURL(/works\/transformers-js\//);
  } finally {
    await session.detach();
  }
});

// 只有搜索意图加载索引；用正文独有词验证全文检索与返回状态。
test('lazy full-text search and detail back link preserve the query', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/zh/');
  await expect(page.locator('[data-browse-grid] .work-card')).toHaveCount(24);
  expect(requests.filter((url) => url.includes('/pagefind/'))).toEqual([]);
  await page.getByRole('searchbox').fill('低秩矩阵');
  await expect(page.locator('[data-search-grid] [data-work="lora"]')).toBeVisible();
  expect(requests.some((url) => url.includes('/pagefind/'))).toBe(true);
  await page.locator('[data-search-grid] [data-work="lora"]').click();
  await page.locator('.back-link').click();
  await expect(page.getByRole('searchbox')).toHaveValue('低秩矩阵');
  await expect(page.locator('[data-search-grid] [data-work="lora"]')).toBeVisible();
  await page.getByRole('button', { name: '清空搜索', exact: true }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(24);
  await expect(page).toHaveURL(/\/zh\/$/);
});

test('homepage switches language and detail omits language controls while routes stay valid', async ({
  page,
  request,
}) => {
  await page.goto('/zh/works/attention-is-all-you-need/');
  await expect(page.locator('.language-switch, .translation-unavailable')).toHaveCount(0);
  await page.locator('[data-back-link]').click();
  await page.locator('.language-switch a[lang="en"]').click();
  await page.locator('.card-link[href="/en/works/attention-is-all-you-need/"]').click();
  await expect(page).toHaveURL(/\/en\/works\/attention-is-all-you-need\//);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.prose')).toContainText('attention');
  await expect(page.locator('[data-direction]')).toHaveCount(0);
  await expect(page.locator('.fact-fallback').first()).toBeVisible();
  await page.locator('[data-back-link]').click();
  await page.locator('.language-switch a[lang="zh"]').click();
  await expect(page).toHaveURL(/\/zh\//);
  await page.goto('/zh/works/lora/');
  await expect(page.locator('.language-switch, .translation-unavailable')).toHaveCount(0);
  expect((await request.get('/en/works/lora/')).status()).toBe(404);
  expect((await request.get('/fr/')).status()).toBe(404);
  await page.goto('/en/');
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await page.getByRole('searchbox').fill('attention');
  await expect(page.locator('[data-search-grid] .work-card')).toHaveCount(1);
});

test('failed search resources can retry and clearing cancels stale results', async ({ page }) => {
  await page.route('**/pagefind/**', (route) => route.abort());
  await page.goto('/zh/');
  await page.getByRole('searchbox').fill('LoRA');
  await expect(page.locator('[data-retry]')).toBeVisible({ timeout: 20000 });
  await page.unroute('**/pagefind/**');
  await page.locator('[data-retry]').click();
  await expect(page.locator('[data-search-grid] [data-work="lora"]')).toBeVisible({
    timeout: 20000,
  });
  await page.getByRole('searchbox').fill('Transformer');
  await page.getByRole('button', { name: '清空搜索', exact: true }).click();
  await expect(page.locator('[data-browse-grid]')).toBeVisible();
  await expect(page.locator('[data-search-grid]')).toBeHidden();
  await expect(page.locator('.work-card:visible')).toHaveCount(24);
});

test('metadata uses one origin and indexes only published language routes', async ({
  page,
  request,
}) => {
  await page.goto('/zh/?q=LoRA');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${process.env.SITE_URL || 'http://127.0.0.1:4322'}/zh/`,
  );
  await page.goto('/zh/works/lora/');
  await expect(page.locator('link[hreflang="en"]')).toHaveCount(0);
  await page.goto('/zh/works/attention-is-all-you-need/');
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    'href',
    /\/en\/works\/attention-is-all-you-need\/$/,
  );
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('/en/works/lora/');
  expect(sitemap).not.toContain('?q=');
  expect(await (await request.get('/robots.txt')).text()).toContain(
    `${process.env.SITE_URL || 'http://127.0.0.1:4322'}/sitemap.xml`,
  );
});

test('failed result fragments recover after explicit retry', async ({ page }) => {
  await page.route('**/*.pf_fragment', (route) => route.abort());
  await page.goto('/zh/?q=LoRA');
  await expect(page.locator('[data-retry]')).toBeVisible({ timeout: 20000 });
  await page.unroute('**/*.pf_fragment');
  await page.locator('[data-retry]').click();
  await expect(page.locator('[data-search-grid] [data-work="lora"]')).toBeVisible({
    timeout: 20000,
  });
});

test('failed lazy search client can recover without losing the query', async ({ page }) => {
  await page.route('**/_astro/search.*.js', (route) => route.abort());
  await page.goto('/zh/?q=LoRA');
  await expect(page.locator('[data-retry]')).toBeVisible({ timeout: 20000 });
  await page.unroute('**/_astro/search.*.js');
  await page.locator('[data-retry]').click();
  await expect(page.locator('[data-search-grid] [data-work="lora"]')).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByRole('searchbox')).toHaveValue('LoRA');
});

test('detail top controls, snapped reading and reversible disclosure respect reduced motion', async ({
  page,
}) => {
  await page.goto('/zh/works/transformers-js/');
  const nav = page.locator('.detail-navigation');
  expect((await nav.boundingBox())!.y).toBeLessThan(10);
  await expect(nav.locator('img').first()).toHaveCSS('width', '15px');
  expect((await page.locator('.original-site').boundingBox())!.y).toBe(44);
  await expect(nav.locator('a')).toHaveCount(3);
  await expect(page.locator('.detail-bottom a')).toHaveCount(1);
  await page.locator('.read-down').click();
  await expect
    .poll(async () => Math.abs((await page.locator('#reading').boundingBox())!.y))
    .toBeLessThan(2);
  await expect(nav).not.toBeInViewport();
  const section = page.locator('.reading-section').nth(1);
  const title = section.locator('h2');
  const small = await title.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  await section.locator('summary').press('Enter');
  await expect(section).toHaveAttribute('open', '');
  await expect
    .poll(() => title.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)))
    .toBeGreaterThan(small);
  await section.locator('summary').press('Enter');
  await section.locator('summary').press('Enter');
  await expect(section).toHaveAttribute('open', '');
  await expect(section.locator('.section-content')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.read-down img')).toHaveCSS('animation-name', 'none');
  await section.locator('summary').press('Enter');
  await expect(section).not.toHaveAttribute('open', '');
  await section.locator('summary').press('Enter');
  await expect(section).toHaveAttribute('open', '');
  await page.locator('.reading-section').nth(2).locator('summary').click();
  await page.locator('.reading-section').last().locator('summary').scrollIntoViewIfNeeded();
  await expect(page.locator('.reading-section').last()).toBeInViewport();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
});

test('vertical paging lands on reading and long content stays reachable', async ({
  page,
  context,
  browserName,
  isMobile,
}) => {
  await page.goto('/zh/works/transformers-js/');
  if (isMobile && browserName === 'chromium') {
    const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 340, y: 710 }],
    });
    for (const y of [650, 550, 430, 310, 190]) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 340, y }],
      });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  } else if (isMobile && browserName === 'webkit') {
    // Mobile WebKit exposes no native wheel/touch input API in Playwright.
    // Programmatic scrolling still exercises the browser's CSS snap layout.
    await page.evaluate(() => window.scrollTo({ top: 650, behavior: 'smooth' }));
  } else {
    await page.mouse.wheel(0, 650);
  }
  await expect
    .poll(async () => Math.abs((await page.locator('#reading').boundingBox())!.y))
    .toBeLessThan(2);
  await expect(page).toHaveURL(/transformers-js/);
  await page.locator('.reading-section').nth(2).locator('summary').click();
  await page.locator('.reading-section').last().locator('summary').click();
  const lastLink = page.locator('.section-content a').last();
  await lastLink.scrollIntoViewIfNeeded();
  await expect(lastLink).toBeInViewport();
});

test('reading controls, selected text and system edges do not change works', async ({ page }) => {
  await page.goto('/zh/works/transformers-js/#reading');
  await page.locator('.reading-section').nth(1).locator('summary').click();
  const swipe = async (selector: string, x = 270) => {
    await page
      .locator(selector)
      .first()
      .evaluate(
        (el, { x }) => {
          for (const [type, endX] of [
            ['touchstart', x],
            ['touchmove', 80],
            ['touchend', 80],
          ] as const) {
            const event = new Event(type, { bubbles: true, cancelable: true });
            const points = [{ clientX: endX, clientY: 400 }];
            Object.defineProperties(event, {
              touches: { value: type === 'touchend' ? [] : points },
              changedTouches: { value: points },
            });
            el.dispatchEvent(event);
          }
        },
        { x },
      );
    await expect(page).toHaveURL(/transformers-js/);
    await expect(page.locator('.edge-navigation')).toBeHidden();
  };
  await swipe('summary');
  await swipe('table');
  await swipe('.detail-cover', 10);
  await page
    .locator('.section-content p')
    .first()
    .evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    });
  await swipe('.detail-cover');
});

test('edge feedback follows locked gestures and cancellation never navigates', async ({
  page,
  browserName,
}) => {
  await page.goto('/zh/works/transformers-js/');
  const root = page.locator('[data-work-detail]');
  const edge = page.locator('.edge-navigation');
  const touch = async (
    type: string,
    init: {
      touches?: { clientX: number; clientY: number }[];
      changedTouches?: { clientX: number; clientY: number }[];
    } = {},
  ) => {
    if (browserName === 'webkit') {
      await root.dispatchEvent(type, init);
      return;
    }
    await root.evaluate(
      (el, { type, init }) => {
        const points = (list: { clientX: number; clientY: number }[] = []) =>
          list.map((point, identifier) => new Touch({ identifier, target: el, ...point }));
        el.dispatchEvent(
          new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            touches: points(init.touches),
            changedTouches: points(init.changedTouches),
          }),
        );
      },
      { type, init },
    );
  };
  await touch('touchstart', { touches: [{ clientX: 270, clientY: 400 }] });
  await touch('touchmove', { touches: [{ clientX: 235, clientY: 401 }] });
  await expect(edge).toHaveAttribute('data-direction', 'next');
  await expect(edge).toBeVisible();
  await touch('touchmove', { touches: [{ clientX: 230, clientY: 520 }] });
  await expect(edge).toHaveCSS('top', '520px');
  await touch('touchcancel');
  await expect(edge).toBeHidden();
  await expect(page).toHaveURL(/transformers-js/);
  // Long press reveals, but release without horizontal commitment stays put.
  await touch('touchstart', { touches: [{ clientX: 270, clientY: 400 }] });
  await expect(edge).toBeVisible();
  await touch('touchend', { changedTouches: [{ clientX: 270, clientY: 400 }] });
  await expect(edge).toBeHidden();
  await expect(page).toHaveURL(/transformers-js/);
  await touch('touchstart', { touches: [{ clientX: 270, clientY: 400 }] });
  await touch('touchmove', { touches: [{ clientX: 260, clientY: 450 }] });
  await touch('touchend', { changedTouches: [{ clientX: 80, clientY: 451 }] });
  await expect(page).toHaveURL(/transformers-js/);
  await touch('touchstart', { touches: [{ clientX: 270, clientY: 400 }] });
  await touch('touchmove', { touches: [{ clientX: 180, clientY: 401 }] });
  await expect(edge).toHaveAttribute('data-ready', '');
  await touch('touchstart', {
    touches: [
      { clientX: 180, clientY: 401 },
      { clientX: 200, clientY: 401 },
    ],
  });
  await expect(edge).toBeHidden();
  await touch('touchend', { changedTouches: [{ clientX: 80, clientY: 401 }] });
  await expect(page).toHaveURL(/transformers-js/);
});
