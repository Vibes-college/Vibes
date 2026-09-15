import { test, expect } from './browser-test.ts';
import { readCatalog } from '../src/lib/content/catalog.ts';
import { browsePages } from '../src/lib/content/views.ts';
import { learningMaterials } from '../src/features/great-ui/site-content.ts';

const parent = '/zh/works/great-ui-learning/';
const feed = browsePages(readCatalog(), 'zh').find(
  (page) => !page.tag && page.works.some((work) => work.slug === 'great-ui-learning'),
)!.path;
const pilots = learningMaterials().entries.filter((entry) =>
  ['linkedin-card', 'text-reveal', 'staggered-page-transition'].includes(entry.slug),
);
const mediaPath = (url: string) => new URL(url).pathname;

for (const entry of pilots)
  test(`clear pilot ${entry.slug} selects one rendition, enlarges, pans and restores focus`, async ({
    page,
    isMobile,
  }) => {
    const requested: string[] = [];
    page.on('request', (request) => {
      if (/\/great-ui\/media\/.*\.mp4$/.test(request.url()))
        requested.push(mediaPath(request.url()));
    });
    await page.goto('/zh/works/' + entry.id + '/');
    const video = page.locator('.recording-stage video');
    const rendition = isMobile ? entry.recordingMedia.mobile! : entry.recordingMedia;
    await expect
      .poll(() =>
        video.evaluate(
          (node: HTMLVideoElement) =>
            node.readyState >= 2 && node.currentTime > 0.2 && !node.paused && !node.error,
        ),
      )
      .toBe(true);
    expect(
      await video.evaluate((node: HTMLVideoElement) => new URL(node.currentSrc).pathname),
    ).toBe(rendition.video);
    expect(
      await video.evaluate((node: HTMLVideoElement) => [node.videoWidth, node.videoHeight]),
    ).toEqual([rendition.width, rendition.height]);
    expect(new Set(requested)).toEqual(new Set([rendition.video]));
    await page.getByRole('button', { name: '暂停录屏', exact: true }).click();
    const progress = page.getByRole('slider', { name: '录屏进度', exact: true });
    await progress.press('Home');
    await progress.press('PageUp');
    await progress.press('PageUp');
    await expect
      .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime))
      .toBeGreaterThan(1);
    await expect(video).toHaveJSProperty('paused', true);
    const contentWidth = () =>
      video.evaluate((node: HTMLVideoElement) => {
        const box = node.parentElement!.getBoundingClientRect();
        const scale = new DOMMatrix(getComputedStyle(node).transform).a;
        return Math.min(box.width, (box.height * node.videoWidth) / node.videoHeight) * scale;
      });
    const inline = await contentWidth();
    const expand = page.getByRole('button', { name: '放大录屏', exact: true });
    await expand.click();
    await expect(page.getByRole('dialog', { name: '放大录屏', exact: true })).toBeVisible();
    await expect.poll(contentWidth).toBeGreaterThan(inline * 1.2);
    await expect(page.locator('.learning-navigation')).toHaveAttribute('inert', '');
    await page.getByRole('button', { name: '放大画面', exact: true }).click();
    await page.getByRole('button', { name: '放大画面', exact: true }).click();
    const stage = page.locator('.recording-stage');
    await stage.press('ArrowLeft');
    const afterKey = await video.evaluate(
      (node: HTMLVideoElement) => new DOMMatrix(getComputedStyle(node).transform).e,
    );
    expect(afterKey).toBeGreaterThan(0);
    const box = await stage.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2 - 60, box!.y + box!.height / 2 + 30, {
      steps: 4,
    });
    await page.mouse.up();
    expect(
      await video.evaluate(
        (node: HTMLVideoElement) => new DOMMatrix(getComputedStyle(node).transform).e,
      ),
    ).toBeLessThan(afterKey);
    await page.getByRole('button', { name: '重置画面缩放', exact: true }).click();
    await expect(page.getByRole('button', { name: '重置画面缩放', exact: true })).toHaveText(
      '100%',
    );
    await page.keyboard.press('Escape');
    await expect(page.locator('.learning-navigation')).not.toHaveAttribute('inert', '');
    await expect(expand).toBeFocused();
    await expect(video).toHaveJSProperty('paused', true);
  });

test('offscreen collection downloads no video; switching releases the old clip and keeps only the current one', async ({
  page,
  isMobile,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\/great-ui\/media\/.*\.mp4$/.test(request.url())) requests.push(mediaPath(request.url()));
  });
  await page.goto('/zh/');
  await page.waitForLoadState('networkidle');
  expect(requests).toEqual([]);
  expect(await page.locator('[data-collection]').count()).toBe(0);
  await page.goto(feed);
  const card = page.locator('[data-browse-grid] [data-collection]');
  expect((await card.boundingBox())!.y).toBeGreaterThan((await page.viewportSize())!.height);
  await page.waitForLoadState('networkidle');
  expect(requests).toEqual([]);
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByRole('button', { name: '下一个预览', exact: true })).toBeEnabled();
  await expect
    .poll(() =>
      card
        .locator('video')
        .evaluate((node: HTMLVideoElement) => node.currentTime > 0.2 && !node.paused),
    )
    .toBe(true);
  expect(requests.every((path) => path.endsWith('-card.mp4'))).toBe(true);
  expect(new Set(requests).size).toBe(1);
  const old = await card.locator('video').elementHandle();
  await card.getByRole('button', { name: '下一个预览', exact: true }).click();
  await expect
    .poll(() =>
      old!.evaluate(
        (node) =>
          !node.isConnected &&
          (node as HTMLVideoElement).paused &&
          node.querySelectorAll('source').length === 0,
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      card
        .locator('video')
        .evaluate((node: HTMLVideoElement) => node.currentTime > 0.2 && !node.paused),
    )
    .toBe(true);
  expect(new Set(requests).size).toBe(2);
  const title = await card.locator('[data-collection-current]').textContent();
  await card.locator('.media-summary-link').click();
  await expect(page).toHaveURL(new RegExp(parent));
  await expect(page.locator('[data-collection-current]')).toHaveText(title!);
  expect(await page.locator('[data-media-root] video').count()).toBe(1);
  for (let index = 0; index < 5; index++)
    await page.getByRole('button', { name: '下一个预览', exact: true }).click();
  expect(await page.locator('[data-media-root] video').count()).toBe(1);
  expect(
    await page
      .locator('video')
      .evaluateAll((nodes) => nodes.filter((node) => !(node as HTMLVideoElement).paused).length),
  ).toBeLessThanOrEqual(isMobile ? 1 : 2);
  const current = await page.locator('[data-collection-current]').getAttribute('href');
  await page.locator('[data-collection-current]').click();
  await expect(page).toHaveURL(new RegExp(current!));
  expect(requests.slice(0, -1).every((path) => path.endsWith('-card.mp4'))).toBe(true);
});

for (const preference of ['reduce', 'saveData'] as const)
  test(`${preference} keeps collection and recording playback manual`, async ({ page }) => {
    if (preference === 'reduce') await page.emulateMedia({ reducedMotion: 'reduce' });
    else
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'connection', {
          value: { saveData: true, addEventListener() {}, removeEventListener() {} },
          configurable: true,
        });
      });
    const requests: string[] = [];
    page.on('request', (request) => {
      if (/\/great-ui\/media\/.*\.mp4$/.test(request.url())) requests.push(request.url());
    });
    await page.goto(parent);
    await expect(page.getByRole('button', { name: '下一个预览', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: '下一个预览', exact: true }).click();
    await page.waitForLoadState('networkidle');
    expect(requests).toEqual([]);
    await page.locator('[data-media-toggle]').click();
    await expect
      .poll(() =>
        page
          .locator('video')
          .evaluate((node: HTMLVideoElement) => node.currentTime > 0.2 && !node.paused),
      )
      .toBe(true);
    await page.goto('/zh/works/great-ui-text-reveal/');
    requests.length = 0;
    await page.waitForLoadState('networkidle');
    expect(requests).toEqual([]);
    await page.getByRole('button', { name: '播放录屏', exact: true }).click();
    await expect
      .poll(() =>
        page
          .locator('video')
          .evaluate((node: HTMLVideoElement) => node.currentTime > 0.2 && !node.paused),
      )
      .toBe(true);
    const video = page.locator('.recording-stage video');
    const originalViewport = page.viewportSize()!;
    const rotated =
      originalViewport.width <= 800 ? { width: 844, height: 390 } : { width: 390, height: 844 };
    const entry = pilots.find((item) => item.slug === 'text-reveal')!;
    const rendition = rotated.width <= 800 ? entry.recordingMedia.mobile! : entry.recordingMedia;
    await page.setViewportSize(rotated);
    await expect
      .poll(() =>
        video.evaluate(
          (node: HTMLVideoElement) =>
            node.readyState >= 2 &&
            !node.paused &&
            node.currentTime > 0.2 &&
            new URL(node.currentSrc).pathname,
        ),
      )
      .toBe(rendition.video);
    await page.getByRole('button', { name: '暂停录屏', exact: true }).click();
    const fraction = await video.evaluate(
      (node: HTMLVideoElement) => node.currentTime / node.duration,
    );
    await page.setViewportSize(originalViewport);
    await expect(video).toHaveJSProperty('paused', true);
    await page.getByRole('button', { name: '播放录屏', exact: true }).click();
    await expect
      .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime / node.duration))
      .toBeGreaterThanOrEqual(fraction - 0.03);
  });

test('a failed recording retains an original-source link', async ({ page }) => {
  await page.route('**/great-ui/media/*.mp4', (route) => route.abort());
  await page.goto('/zh/works/great-ui-text-reveal/');
  await expect(page.getByText('录屏无法加载', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '查看原作', exact: true })).toHaveAttribute(
    'href',
    'https://www.great-ui.com/components/text-reveal',
  );
});

test('two-finger touch zoom and one-finger pan preserve paused playback', async ({
  page,
  browserName,
  isMobile,
  context,
}) => {
  test.skip(
    browserName !== 'chromium' || !isMobile,
    'Native touch injection uses Chromium CDP; WebKit controls are covered separately.',
  );
  await page.goto('/zh/works/great-ui-text-reveal/');
  const video = page.locator('.recording-stage video');
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime > 0.2))
    .toBe(true);
  await page.getByRole('button', { name: '暂停录屏', exact: true }).click();
  await page.getByRole('button', { name: '放大录屏', exact: true }).click();
  const box = (await page.locator('.recording-stage').boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: x - 45, y, id: 1 },
      { x: x + 45, y, id: 2 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: x - 90, y, id: 1 },
      { x: x + 90, y, id: 2 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect
    .poll(() => video.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a))
    .toBeGreaterThan(1.5);
  const before = await video.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).e);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: x + 50, y, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect
    .poll(() => video.evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).e))
    .toBeGreaterThan(before + 20);
  await expect(video).toHaveJSProperty('paused', true);
  await cdp.detach();
  await page.keyboard.press('Escape');
});

for (const paused of [false, true])
  test(`late collection controls preserve manual ${paused ? 'pause' : 'play'} over saved selection`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let waiting = false;
    await page.route('**/*media-collection*', async (route) => {
      waiting = true;
      await gate;
      await route.continue();
    });
    try {
      await page.goto(parent, { waitUntil: 'domcontentloaded' });
      const card = page.locator('[data-collection]');
      await expect.poll(() => waiting).toBe(true);
      const expected = await card.evaluate((root: HTMLElement) => {
        const config = JSON.parse(root.dataset.collection!);
        const key = `vibes:collection:zh:${config.id}`;
        sessionStorage.setItem(key, config.items.at(-1).id);
        return { key, id: config.items[0].id, title: config.items[0].title };
      });
      const old = (await card.locator('video').elementHandle())!;
      await card.locator('[data-media-toggle]').click();
      await expect
        .poll(() =>
          old.evaluate((node: HTMLVideoElement) => node.currentTime > 0.2 && !node.paused),
        )
        .toBe(true);
      if (paused) await card.locator('[data-media-toggle]').click();
      const before = await old.evaluate((node: HTMLVideoElement) => node.currentTime);
      release();
      await expect(card.getByRole('button', { name: '下一个预览', exact: true })).toBeEnabled();
      expect(await old.evaluate((node) => node.isConnected)).toBe(true);
      await expect(card.locator('video')).toHaveJSProperty('paused', paused);
      expect(
        await old.evaluate((node: HTMLVideoElement) => node.currentTime),
      ).toBeGreaterThanOrEqual(before);
      await expect(card.locator('[data-collection-current]')).toHaveText(expected.title);
      expect(await page.evaluate((key) => sessionStorage.getItem(key), expected.key)).toBe(
        expected.id,
      );
    } finally {
      release();
    }
  });
