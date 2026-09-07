import { test, expect } from './browser-test.ts';
const path = '/zh/works/prose-ui-showcase/';

test('prose groups synchronize files and languages, copy visible code and restore selection', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (text: string) => {
          document.documentElement.dataset.copiedCode = text;
        },
      },
    });
  });
  await page.goto(path);
  await page.locator('.read-down').click();
  await expect(page.locator('.prose-ui[data-prose-ready]')).toBeVisible();
  const codes = page.locator('[data-prose-group="codegroup"][data-sync="reader-example"]');
  await codes.first().getByRole('tab', { name: 'Client', exact: true }).click();
  for (const group of await codes.all())
    await expect(group).toHaveAttribute('data-selected-tab', 'Client');
  await codes.first().getByRole('button', { name: '代码语言' }).click();
  await codes.first().getByRole('option', { name: 'Javascript', exact: true }).click();
  for (const group of await codes.all()) {
    await expect(group).toHaveAttribute('data-selected-language', 'javascript');
    await expect(group.locator('[role="tabpanel"]:visible')).toHaveCount(1);
  }
  const visibleText = await codes.first().locator('[role="tabpanel"]:visible code').textContent();
  await codes.first().getByRole('button', { name: '复制代码', exact: true }).click();
  await expect(codes.first().getByRole('button', { name: '已复制', exact: true })).toBeVisible();
  expect(await page.locator('html').getAttribute('data-copied-code')).toBe(
    visibleText!.replace(/\n$/, ''),
  );
  await page.reload();
  await expect(codes.first()).toHaveAttribute('data-selected-tab', 'Client');
  await expect(codes.first()).toHaveAttribute('data-selected-language', 'javascript');
  await codes.first().getByRole('tab', { name: 'Client', exact: true }).focus();
  await page.keyboard.press('Home');
  await expect(codes.first().getByRole('tab', { name: 'Server', exact: true })).toBeFocused();
  await expect(page).toHaveURL(new RegExp('prose-ui-showcase'));
  const tabs = page.locator('[data-prose-group="tabs"][data-sync="workflow"]');
  await tabs.first().getByRole('tab', { name: '构建', exact: true }).click();
  await expect(tabs.last()).toHaveAttribute('data-selected-tab', '构建');
  await tabs.first().getByRole('tab', { name: '构建', exact: true }).press('End');
  await expect(tabs.last()).toHaveAttribute('data-selected-tab', '检查');
  await codes.first().getByRole('button', { name: '代码语言' }).click();
  await page.keyboard.press('Escape');
  await expect(codes.first().getByRole('button', { name: '代码语言' })).toBeFocused();
  await expect(codes.first().getByRole('listbox')).toBeHidden();
});

test('prose images support keyboard zoom, Escape, focus restoration and cleanup', async ({
  page,
}) => {
  await page.goto(path);
  await page.locator('.read-down').click();
  const image = page.getByRole('button', {
    name: '放大图片：木星表面的云带，来自 Juno 任务的影像',
    exact: true,
  });
  await image.focus();
  await image.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('img').first()).toHaveJSProperty(
    'naturalWidth',
    3820,
  );
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(image).toBeFocused();
  await image.click();
  await page.getByRole('button', { name: '关闭图片', exact: true }).click();
  await expect(image).toBeFocused();
  await expect(page.locator('img[alt="不启用放大的图片"]')).not.toHaveAttribute('role', 'button');
  await page.goBack();
  await page.locator('.detail-navigation a').first().click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('prose handles denied clipboard and storage without losing content', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw Error('blocked');
    };
    Storage.prototype.setItem = () => {
      throw Error('blocked');
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw Error('denied');
        },
      },
    });
  });
  await page.goto(path);
  await page.locator('.read-down').click();
  const group = page.locator('[data-prose-group="tabs"]').first();
  await group.getByRole('tab', { name: '检查', exact: true }).click();
  await expect(group.getByRole('tabpanel', { name: '检查', exact: true })).toBeVisible();
  const copy = page.locator('.code-block').first().locator('[data-prose-copy]');
  await copy.click();
  await expect(copy).toHaveAttribute('aria-label', '复制失败，请手动选择代码');
  await expect(page.locator('.code-block').first().locator('pre')).toBeVisible();
});

test('prose narrow layout, complete sections and deep anchors remain readable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path + '#' + encodeURIComponent('明暗主题与局部样式-styling'));
  await expect(page.locator('.reading-section')).toHaveCount(13);
  await expect
    .poll(() =>
      page
        .locator('h2#明暗主题与局部样式-styling')
        .evaluate((el) => el.getBoundingClientRect().top),
    )
    .toBeLessThan(700);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const long = page.locator('.code-block').filter({ hasText: 'notes.txt' }).locator('.code-scroll');
  expect(await long.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  const copyIcon = await page
    .locator('.code-block .copy-button-icon-default')
    .first()
    .boundingBox();
  expect(copyIcon!.width).toBe(16);
  expect(copyIcon!.height).toBe(16);
  const colors = await page
    .locator('.theme-example')
    .evaluateAll((nodes) => nodes.slice(0, 2).map((el) => getComputedStyle(el).color));
  expect(colors[0]).not.toBe(colors[1]);
  for (const icon of await page.locator('.card-icon .prose-icon').all()) {
    const box = await icon.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(16);
    expect(box!.height).toBeGreaterThanOrEqual(16);
  }
  await page.getByRole('button', { name: '打开章节目录' }).click();
  await page.getByRole('link', { name: '五种提示 Callouts', exact: true }).click();
  await expect(page.locator('#五种提示-callouts')).toBeInViewport();
});

test('prose without JavaScript keeps every panel and static formula available', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 700 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322' + path);
  for (const panel of await page.locator('[role="tabpanel"]').all())
    await expect(panel).toBeVisible();
  await expect(page.locator('.katex')).toHaveCount(7);
  await expect(page.locator('.copy-button').first()).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
