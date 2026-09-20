import { test, expect } from './browser-test.ts';
import type { Page } from '@playwright/test';
import { resources } from '../src/features/ui-topic/catalog.ts';

const url = '/zh/works/beui-motion-lab/';
const dialogSelector = '[data-resource-dialog]';
async function openResource(page: Page, id: string) {
  await page.locator(`[data-open-resource="${id}"]`).first().click();
  const dialog = page.locator(dialogSelector);
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('iframe')).toHaveAttribute('data-preview-ready', 'true');
  return dialog;
}

test('resource galleries, chapter navigation and source previews work in the existing article', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await expect(page.locator('.article-header h1')).toHaveText('AI 原生 UI：选着做，看着改');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.locator('.read-down').click();
  await expect(page.locator('.chapter-heading')).toHaveCount(8);
  const gallery = page.locator('[data-group="inspiration"]');
  await gallery.getByRole('searchbox').fill('不存在的效果');
  await expect(gallery.locator('.ut-empty')).toBeVisible();
  await gallery.getByRole('searchbox').fill('');
  await gallery.getByRole('button', { name: '动效', exact: true }).click();
  await expect(gallery.locator('[data-resource]:visible')).toHaveCount(4);
  await gallery.getByRole('button', { name: '大图', exact: true }).click();
  await expect(gallery).toHaveAttribute('data-density', 'large');
  await gallery.getByRole('button', { name: '全部', exact: true }).click();
  for (const resource of resources) {
    const dialog = await openResource(page, resource.id);
    await expect(dialog.locator('.ut-source-frame')).toHaveAttribute('sandbox', 'allow-scripts');
    const frame = page.frameLocator(`${dialogSelector} iframe`);
    await expect(frame.locator('body')).not.toBeEmpty();
    // Check the actual vendor CSS and content rendered, beyond receiving a ready message.
    expect(await frame.locator('body').evaluate((body) => body.scrollHeight)).toBeGreaterThan(100);
    await dialog.getByRole('button', { name: '关闭', exact: true }).click();
    await expect(dialog.locator('iframe')).toHaveCount(0);
  }
  await page.getByRole('button', { name: '打开章节目录', exact: true }).click();
  await page.getByRole('link', { name: '规范', exact: true }).click();
  await expect(page.locator('h2#规范')).toBeInViewport();
  expect(errors).toEqual([]);
  await testInfo.attach('ui-topic-gallery', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});

test('preview isolation, native controls and parameter changes survive production headers', async ({
  page,
  request,
}) => {
  await page.goto(url + '#reading');
  const parentHeaders = (await request.get(url)).headers();
  const previewHeaders = (await request.get('/ui-topic/previews/hyperui-toggle/')).headers();
  expect(parentHeaders['content-security-policy']).not.toMatch(
    /script-src[^;]*'unsafe-(?:inline|eval)'/,
  );
  expect(previewHeaders['content-security-policy']).toContain('sandbox allow-scripts');
  expect(previewHeaders['content-security-policy']).toContain("connect-src 'none'");
  expect(previewHeaders['content-security-policy']).toMatch(/script-src 'sha256-/);
  expect(previewHeaders['x-frame-options']).toBeUndefined();
  const dialog = await openResource(page, 'hyperui-toggle');
  const frame = page.frameLocator(`${dialogSelector} iframe`);
  const toggle = frame.getByRole('checkbox', { name: '示例开关' });
  await toggle.check();
  await expect(toggle).toBeChecked();
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).not.toBeChecked();
  const isolated = await frame.locator('body').evaluate(async () => {
    let parentBlocked = false;
    let storageBlocked = false;
    let networkBlocked = false;
    try {
      void parent.document.body;
    } catch {
      parentBlocked = true;
    }
    try {
      localStorage.setItem('should-not-write', '1');
    } catch {
      storageBlocked = true;
    }
    try {
      await fetch('https://example.com/should-not-request');
    } catch {
      networkBlocked = true;
    }
    return { parentBlocked, storageBlocked, networkBlocked };
  });
  expect(isolated).toEqual({ parentBlocked: true, storageBlocked: true, networkBlocked: true });
  await page.evaluate(() => window.postMessage({ type: 'vibes-demo-escape' }, '*'));
  await expect(dialog).toBeVisible();
  await toggle.focus();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('[data-open-resource="hyperui-toggle"]').first()).toBeFocused();
  await openResource(page, 'props-spacing');
  const token = page.frameLocator(`${dialogSelector} iframe`).locator('.token-demo');
  await dialog.getByRole('button', { name: '紧凑 / 小', exact: true }).click();
  await expect(token).toHaveCSS('padding', '8px');
  await dialog.getByRole('button', { name: '宽松 / 大', exact: true }).click();
  await expect(token).toHaveCSS('padding', '24px');
  await expect(dialog.getByRole('textbox', { name: '怎么改' })).toHaveValue(/--size-5/);
});

test('selection editing, source licensing and clipboard failure preserve the full task', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('blocked');
        },
      },
    }),
  );
  await page.goto(url + '#reading');
  const dialog = await openResource(page, 'hyperui-toggle');
  await dialog.getByRole('textbox', { name: '放哪里', exact: true }).fill('首页设置');
  await dialog.getByRole('textbox', { name: '怎么改', exact: true }).fill('保留品牌颜色');
  await dialog.locator('.ut-provenance summary').click();
  await dialog.getByRole('button', { name: '复制当前代码节选', exact: true }).click();
  await expect(dialog.locator('[data-source-fallback]')).toHaveValue(
    /AUTHORS OR COPYRIGHT HOLDERS/,
  );
  await expect(dialog.locator('[data-source-fallback]')).toHaveValue(/Mark Mead/);
  await dialog.getByRole('button', { name: '用这一项生成任务', exact: true }).click();
  const task = page.locator('[data-task-dialog]');
  await expect(task.locator('[data-task-text]')).toHaveValue(/首页设置/);
  await expect(task.locator('[data-task-text]')).toHaveValue(
    /9c2f586aed62b644246fc68e1759544982066ef0/,
  );
  await task.getByRole('button', { name: '复制并打开助手', exact: true }).click();
  await expect(task.locator('[data-task-status]')).toContainText('请手动复制');
  await expect(task.locator('[data-task-text]')).toBeFocused();
  await expect(page.locator('#local-assistant')).not.toBeVisible();
  await task.getByRole('button', { name: '修改轻推开关', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: '怎么改', exact: true })).toHaveValue(
    '保留品牌颜色',
  );
  await dialog.getByRole('textbox', { name: '怎么改', exact: true }).fill('保留品牌颜色，间距缩小');
  await dialog.getByRole('button', { name: '用这一项生成任务', exact: true }).click();
  await expect(task.locator('[data-task-text]')).toHaveValue(/间距缩小/);
  await task.getByRole('button', { name: '移除轻推开关', exact: true }).click();
  await expect(task.locator('[data-task-text]')).toHaveValue('');
  await expect(task.getByRole('button', { name: '复制任务', exact: true })).toBeDisabled();
});

test('copied task opens the existing assistant and compact layout leaves the gallery usable', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => {} },
    }),
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(url + '#reading');
  const dialog = await openResource(page, 'hyperui-toggle');
  await dialog.getByRole('button', { name: '用这一项生成任务', exact: true }).click();
  await page
    .locator('[data-task-dialog]')
    .getByRole('button', { name: '复制并打开助手', exact: true })
    .click();
  const assistant = page.locator('#local-assistant');
  await expect(assistant).toBeVisible();
  await expect(page.locator('[data-task-dialog]')).not.toBeVisible();
  const bounds = await page.locator('.ut-gallery').first().boundingBox();
  const panel = await assistant.boundingBox();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(panel!.x);
  // Opening only prepares the existing assistant; no task was attached or submitted.
  await expect(assistant).toHaveAttribute('data-paseo-guide', 'true');
  await page.locator('[data-paseo-close]').click();
  await expect(page.locator('[data-selection-count]')).toHaveText('1');
});

test('local comparison rejects invalid images and revokes object URLs on replace and navigation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = URL.revokeObjectURL;
    Object.defineProperty(window, 'uiRevokedUrls', { value: [] });
    URL.revokeObjectURL = (url) => {
      (window as unknown as { uiRevokedUrls: string[] }).uiRevokedUrls.push(url);
      original.call(URL, url);
    };
  });
  await page.goto(url + '#验证');
  const input = page.locator('[data-compare-file="reference"]');
  const image = page.locator('[data-compare-image="reference"]');
  await input.setInputFiles({
    name: 'unsupported.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg/>'),
  });
  await expect(page.locator('[data-verify-status]')).toContainText('15 MB');
  await input.setInputFiles({
    name: 'large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(15 * 1024 * 1024 + 1),
  });
  await expect(image).not.toBeVisible();
  await input.setInputFiles({
    name: 'broken.png',
    mimeType: 'image/png',
    buffer: Buffer.from('broken'),
  });
  await expect(page.locator('[data-verify-status]')).toContainText('无法解码');
  await input.setInputFiles('public/media/ui-topic/props-bloom.webp');
  await expect(image).toBeVisible();
  const first = await image.getAttribute('src');
  await input.setInputFiles('public/media/ui-topic/props-spacing.webp');
  await expect.poll(() => image.getAttribute('src')).not.toBe(first);
  expect(
    await page.evaluate(() => (window as unknown as { uiRevokedUrls: string[] }).uiRevokedUrls),
  ).toContain(first);
  const current = await image.getAttribute('src');
  // Return through the ordinary cover/list controls, exercising ClientRouter cleanup.
  await page.getByRole('button', { name: '打开章节目录', exact: true }).click();
  await page.getByRole('link', { name: '作品概览', exact: true }).click();
  await page.locator('[data-back-link]').click();
  await expect(page.locator('[data-ui-topic-overlay]')).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as unknown as { uiRevokedUrls: string[] }).uiRevokedUrls),
  ).toContain(current);
  await page.goBack();
  await page.locator('.read-down').click();
  await expect(page.locator('[data-ui-topic-overlay]')).toHaveCount(1);
  await openResource(page, 'hyperui-toggle');
});

test('320px and reduced motion preserve readable cards, dialogs and no-JS source access', async ({
  page,
  browser,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url + '#reading');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  for (const gallery of await page.locator('.ut-gallery').all()) {
    expect(await gallery.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
  }
  const dialog = await openResource(page, 'props-bloom');
  await dialog.getByRole('button', { name: '重播', exact: true }).click();
  const moving = page.frameLocator(`${dialogSelector} iframe`).locator('[data-animate]');
  expect(
    await moving.evaluate(
      (element) =>
        element.getAnimations().filter((animation) => animation.playState === 'running').length,
    ),
  ).toBe(0);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await testInfo.attach('ui-topic-320px', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();
  const noJs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 740 },
  });
  try {
    const staticPage = await noJs.newPage();
    await staticPage.goto('http://127.0.0.1:4322' + url + '#reading');
    await expect(staticPage.getByRole('heading', { name: '灵感', exact: true })).toBeVisible();
    await expect(staticPage.locator('.ut-source').first()).toBeVisible();
    await expect(staticPage.getByRole('searchbox', { name: '搜索灵感' })).not.toBeVisible();
    await expect(staticPage.locator('iframe')).toHaveCount(0);
    await staticPage.waitForLoadState('networkidle');
  } finally {
    await noJs.close();
  }
});

test('hover recordings load on demand, resume and stop when no longer visible', async ({
  page,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'Hover playback is a desktop enhancement; mobile uses the interactive preview.',
  );
  await page.goto(url + '#reading');
  const video = page.locator('[data-group="inspiration"] [data-resource="props-bloom"] video');
  await expect(video).not.toHaveAttribute('src');
  await video.locator('..').hover();
  await expect
    .poll(() => video.evaluate((element) => (element as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0);
  await page.mouse.move(0, 0);
  await expect
    .poll(() => video.evaluate((element) => (element as HTMLVideoElement).paused))
    .toBe(true);
  await video.locator('..').hover();
  await expect
    .poll(() => video.evaluate((element) => (element as HTMLVideoElement).paused))
    .toBe(false);
  await page.locator('h2#验证').scrollIntoViewIfNeeded();
  await expect
    .poll(() => video.evaluate((element) => (element as HTMLVideoElement).paused))
    .toBe(true);
});
