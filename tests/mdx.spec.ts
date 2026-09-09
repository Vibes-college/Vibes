import { test, expect } from './browser-test.ts';

const zh = '/zh/works/mdx-interaction-lab/';
const en = '/en/works/mdx-interaction-lab/';

test('MDX islands load on visibility, share a runtime and preserve independent state', async ({
  page,
}, testInfo) => {
  const scripts: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(new URL(request.url()).pathname);
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(zh);
  const islands = page.locator('astro-island[component-url]');
  await expect(islands).toHaveCount(2);
  const renderer = (await islands.first().getAttribute('renderer-url'))!;
  const component = (await islands.first().getAttribute('component-url'))!;
  await page.waitForLoadState('networkidle');
  expect(scripts).not.toContain(renderer);
  expect(scripts).not.toContain(component);
  await page.locator('.read-down').click();
  await expect(islands.first()).not.toHaveAttribute('ssr');
  await expect(islands.last()).toHaveAttribute('ssr');
  const demos = page.locator('[data-mix-demo]');
  const firstDrag = demos.first().getByRole('slider', { name: '拖动调色' });
  await firstDrag.focus();
  await page.keyboard.press('ArrowRight');
  await expect(demos.first().locator('output')).toHaveText('36%');
  await expect(page).toHaveURL(zh + '#reading');
  await demos.last().scrollIntoViewIfNeeded();
  await expect(islands.last()).not.toHaveAttribute('ssr');
  await demos.last().getByRole('slider', { name: '蓝色比例' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(demos.last().locator('output')).toHaveText('71%');
  await expect(demos.first().locator('output')).toHaveText('36%');
  await demos.last().getByRole('button', { name: '重置颜色' }).click();
  await expect(demos.last().locator('output')).toHaveText('70%');
  expect(scripts.filter((path) => path === renderer)).toHaveLength(1);
  expect(scripts.filter((path) => path === component)).toHaveLength(1);
  expect(errors).toEqual([]);
  await testInfo.attach('mdx-network', {
    body: JSON.stringify({ renderer, component, scripts }, null, 2),
    contentType: 'application/json',
  });
});

test('ordinary Markdown does not request the React renderer or demo modules', async ({
  page,
  request,
}, testInfo) => {
  const html = await (await request.get(zh)).text();
  const renderer = html.match(/renderer-url="([^"]+)"/)![1];
  const component = html.match(/component-url="([^"]+)"/)![1];
  const scripts: string[] = [];
  page.on('request', (item) => {
    if (item.resourceType() === 'script') scripts.push(new URL(item.url()).pathname);
  });
  await page.goto('/zh/works/transformers-js/#reading');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('astro-island')).toHaveCount(0);
  expect(scripts).not.toContain(renderer);
  expect(scripts).not.toContain(component);
  expect(scripts.some((path) => /react|jsx-runtime|MixDemo/.test(path))).toBe(false);
  await testInfo.attach('markdown-network', {
    body: JSON.stringify({ scripts }, null, 2),
    contentType: 'application/json',
  });
});

test('MDX chapters, reactions, search, language and history retain the existing reading path', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/zh/?q=' + encodeURIComponent('琥珀蓝'));
  const card = page.locator(`[data-search-grid] .card-link[href="${zh}"]`);
  await expect(card).toBeVisible();
  await card.click();
  await page.locator('.read-down').click();
  await expect(page.locator('astro-island[component-url]').first()).not.toHaveAttribute('ssr');
  await expect(page.locator('.reading-section')).toHaveCount(4);
  await expect(page.locator('.chapter-heading')).toHaveCount(4);
  const reaction = page.locator('[data-reaction]').first();
  await reaction.click();
  await page.getByRole('menuitemradio', { name: '惊喜' }).click();
  await expect(reaction.locator('[data-reaction-value]')).toHaveText('🤩');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '打开章节目录' }).click();
  await page.getByRole('link', { name: '第二个独立实验', exact: true }).click();
  await expect(page.locator('h2#第二个独立实验')).toBeInViewport();
  await page.reload();
  await expect(page.locator('h2#第二个独立实验')).toBeInViewport();
  await expect(reaction.locator('[data-reaction-value]')).toHaveText('🤩');
  await page.goBack();
  await expect(page.locator('.detail-page')).toHaveAttribute('data-detail-page', 'reading');
  await page.goBack();
  await expect(page.locator('.detail-page')).toHaveAttribute('data-detail-page', 'cover');
  await page.locator('[data-back-link]').click();
  await expect(card).toBeVisible();
  await page.locator('.language-switch a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/en\//);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('searchbox').fill('amberblue');
  await page.locator(`[data-search-grid] .card-link[href="${en}"]`).click();
  await page.locator('.read-down').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.locator('[data-mix-demo]').first().getByRole('button', { name: 'Reset color' }),
  ).toBeVisible();
  await expect(page.locator('astro-island[component-url]').first()).not.toHaveAttribute('ssr');
  await page.getByRole('slider', { name: 'Blue proportion' }).first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('output').first()).toHaveText('36%');
  await expect(page.locator('.translation-notice')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('demo drag, touch and wheel belong to the component at narrow widths', async ({
  page,
  isMobile,
  browserName,
  context,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(zh + '#reading');
  const island = page.locator('astro-island[component-url]').first();
  await expect(island).not.toHaveAttribute('ssr');
  const drag = page.locator('.mix-demo-drag').first();
  await drag.scrollIntoViewIfNeeded();
  const box = (await drag.boundingBox())!;
  if (isMobile && browserName === 'chromium') {
    const session = await context.newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: box.x + 20, y: box.y + box.height / 2 }],
      });
      for (let step = 1; step <= 8; step++)
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            { x: box.x + 20 + ((box.width - 40) * step) / 8, y: box.y + box.height / 2 },
          ],
        });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      expect(
        Number((await page.locator('output').first().textContent())!.replace('%', '')),
      ).toBeGreaterThan(60);
    } finally {
      await session.detach();
    }
  } else if (!isMobile) {
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    expect(
      Number((await page.locator('output').first().textContent())!.replace('%', '')),
    ).toBeGreaterThan(60);
  }
  // DOM touch streams cover exclusion in WebKit; Chromium above also uses native touch.
  await drag.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const send = (type: string, x: number, y: number) => {
      const point = { identifier: 1, target: element, clientX: x, clientY: y };
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        touches: { value: type === 'touchend' ? [] : [point] },
        changedTouches: { value: [point] },
      });
      element.dispatchEvent(event);
    };
    send('touchstart', rect.x + 30, rect.y + 10);
    send('touchmove', rect.x + 160, rect.y + 10);
    send('touchend', rect.x + 160, rect.y + 10);
    window.scrollTo(0, 0);
    send('touchstart', rect.x + 30, 150);
    send('touchmove', rect.x + 30, 260);
    send('touchend', rect.x + 30, 260);
    element.dispatchEvent(
      new WheelEvent('wheel', { deltaY: -160, bubbles: true, cancelable: true }),
    );
  });
  await expect(page).toHaveURL(zh + '#reading');
  await expect(page.locator('.detail-page')).toHaveAttribute('data-detail-page', 'reading');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.reading-section h2').last().scrollIntoViewIfNeeded();
  await expect(page.locator('.reading-section h2').last()).toBeInViewport();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1000);
});

test('MDX without JavaScript keeps prose, formulas and initial demonstration states', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 700 },
  });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4322' + en);
    await expect(page.locator('[data-mix-demo]')).toHaveCount(2);
    await expect(page.locator('output').first()).toHaveText('35%');
    await expect(page.locator('.reading-section')).toHaveCount(4);
    await expect(page.locator('.katex')).toHaveCount(1);
    await expect(page.locator('.callout')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.waitForLoadState('networkidle');
  } finally {
    await context.close();
  }
});

test('MDX prose disables adjacent-work drags while Markdown retains them', async ({ page }) => {
  async function dragProse() {
    await page.locator('.detail-page').evaluate((element) => {
      const target = element.querySelector('.section-content p')!;
      for (const [type, x] of [
        ['touchstart', 240],
        ['touchmove', 90],
        ['touchend', 90],
      ] as const) {
        const point = { identifier: 4, target, clientX: x, clientY: 260 };
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperties(event, {
          touches: { value: type === 'touchend' ? [] : [point] },
          changedTouches: { value: [point] },
        });
        target.dispatchEvent(event);
      }
    });
  }
  await page.goto(zh + '#reading');
  await dragProse();
  await expect(page.locator('.edge-navigation')).not.toHaveAttribute('data-visible');
  await expect(page).toHaveURL(zh + '#reading');
  await page.goto(zh);
  const next = page.locator('a[data-direction="next"]');
  const destination = (await next.getAttribute('href'))!;
  await next.click();
  await expect(page).toHaveURL(new RegExp(destination.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await page.goto('/zh/works/transformers-js/#reading');
  const markdownNext = (await page.locator('a[data-direction="next"]').getAttribute('href'))!;
  await dragProse();
  await expect(page).toHaveURL(new RegExp(markdownNext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
