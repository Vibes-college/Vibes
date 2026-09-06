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
  await page.getByRole('link', { name: '← Explore' }).click();
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
  await expect(page.locator('details[open]')).toHaveCount(0);
  await page.getByRole('link', { name: '向下阅读正文' }).click();
  const section = page.locator('details').first();
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
  isMobile,
}) => {
  test.skip(!isMobile, '触摸路径只在手机模拟项目执行');
  await page.goto('/works/transformers-js/');
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
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 80, y: 432 }],
    });
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

test('published languages switch the same work and missing translations remain absent', async ({
  page,
  request,
}) => {
  await page.goto('/zh/works/attention-is-all-you-need/');
  await page.locator('.language-switch a[lang="en"]').click();
  await expect(page).toHaveURL(/\/en\/works\/attention-is-all-you-need\//);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.prose')).toContainText('attention');
  await expect(page.locator('[data-direction]')).toHaveCount(0);
  await expect(page.locator('.fact-fallback').first()).toBeVisible();
  await page.locator('.language-switch a[lang="zh"]').click();
  await expect(page).toHaveURL(/\/zh\/works\/attention-is-all-you-need\//);
  await page.goto('/zh/works/lora/');
  await expect(page.locator('.translation-unavailable')).toContainText('尚无译文');
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
