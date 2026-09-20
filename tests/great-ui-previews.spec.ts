import { test, expect } from './browser-test.ts';
import { readCatalog } from '../src/lib/content/catalog.ts';
import { browsePages } from '../src/lib/content/views.ts';
import { learningMaterials } from '../src/features/great-ui/site-content.ts';
import { readFile } from 'node:fs/promises';

const parent = '/zh/works/great-ui-learning/';
const feed = browsePages(readCatalog(), 'zh').find(
  (page) => !page.tag && page.works.some((work) => work.slug === 'great-ui-learning'),
)!.path;
const pilots = learningMaterials().entries.filter((entry) =>
  ['linkedin-card', 'text-reveal', 'staggered-page-transition'].includes(entry.slug),
);
const mediaPath = (url: string) => new URL(url).pathname;

test('static MP4 byte ranges preserve exact bytes and response policies', async ({ request }) => {
  const path = '/great-ui/media/scroll-flying-cards-mobile.mp4';
  const expected = await readFile(new URL('../public' + path, import.meta.url));
  const full = await request.get(path);
  expect(full.status()).toBe(200);
  expect(full.headers()['accept-ranges']).toBe('bytes');
  expect(await full.body()).toEqual(expected);
  for (const [range, start, end] of [
    ['bytes=0-1', 0, 1],
    ['bytes=4848-', 4848, expected.length - 1],
    ['bytes=-16', expected.length - 16, expected.length - 1],
  ] as const) {
    const response = await request.get(path, { headers: { range } });
    expect(response.status()).toBe(206);
    expect(response.headers()['content-range']).toBe(`bytes ${start}-${end}/${expected.length}`);
    expect(response.headers()['content-length']).toBe(String(end - start + 1));
    for (const name of [
      'content-type',
      'content-security-policy',
      'x-content-type-options',
      'cache-control',
      'etag',
    ]) {
      expect(full.headers()[name], name).toBeTruthy();
      expect(response.headers()[name], name).toBe(full.headers()[name]);
    }
    expect(await response.body()).toEqual(expected.subarray(start, end + 1));
  }
  const invalid = await request.get(path, { headers: { range: `bytes=${expected.length}-` } });
  expect(invalid.status()).toBe(416);
  expect(invalid.headers()['content-range']).toBe(`bytes */${expected.length}`);
  expect(await invalid.body()).toHaveLength(0);
  const stale = await request.get(path, {
    headers: { range: 'bytes=0-1', 'if-range': '"stale-recording"' },
  });
  expect(stale.status()).toBe(200);
  expect(await stale.body()).toEqual(expected);
});

for (const surface of ['recording', 'collection'] as const)
  test(`${surface} serves byte ranges and loops without a seek copy`, async ({ page }) => {
    const fetched: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'fetch' && /\/great-ui\/media\/.*\.mp4$/.test(request.url()))
        fetched.push(request.url());
    });
    const response = page.waitForResponse(
      (response) =>
        /\/great-ui\/media\/.*\.mp4$/.test(response.url()) &&
        [200, 206].includes(response.status()),
    );
    await page.goto(surface === 'recording' ? '/zh/works/great-ui-scroll-flying-cards/' : parent);
    const root = page.locator(surface === 'recording' ? '.video-player' : '[data-collection]');
    await root.scrollIntoViewIfNeeded();
    expect((await response).headers()['accept-ranges']).toBe('bytes');
    const video = root.locator('video');
    const toggle = root
      .locator(surface === 'recording' ? '.scrubber > button' : '[data-media-toggle]')
      .first();
    await expect
      .poll(() =>
        video.evaluate(
          (node: HTMLVideoElement) =>
            node.videoWidth > 0 && node.currentTime > 0.2 && !node.paused && !node.error,
        ),
      )
      .toBe(true);
    await toggle.click();
    await expect(video).toHaveJSProperty('paused', true);
    await video.evaluate((node: HTMLVideoElement) => {
      let previous = node.currentTime;
      const duration = node.duration;
      node.addEventListener('timeupdate', () => {
        if (previous > duration / 2 && node.currentTime < previous - duration / 2)
          node.dataset.looped = 'true';
        previous = node.currentTime;
      });
    });
    await toggle.click();
    await expect(video).toHaveAttribute('data-looped', 'true', { timeout: 15_000 });
    await expect
      .poll(() =>
        video.evaluate(
          (node: HTMLVideoElement) => node.currentTime > 0.2 && !node.paused && !node.error,
        ),
      )
      .toBe(true);
    expect(await video.evaluate((node: HTMLVideoElement) => node.currentSrc)).toMatch(/^http:/);
    expect(fetched).toEqual([]);
  });

for (const entry of pilots)
  test(`clear pilot ${entry.slug} selects one rendition, enlarges, pans and restores focus`, async ({
    page,
    isMobile,
  }) => {
    const requested: string[] = [];
    const fetched: string[] = [];
    page.on('request', (request) => {
      if (/\/great-ui\/media\/.*\.mp4$/.test(request.url())) {
        requested.push(mediaPath(request.url()));
        if (request.resourceType() === 'fetch') fetched.push(mediaPath(request.url()));
      }
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
    expect(fetched).toEqual([]);
    await page.getByRole('button', { name: '暂停录屏', exact: true }).click();
    const progress = page.getByRole('slider', { name: '录屏进度', exact: true });
    await progress.press('Home');
    await expect
      .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentSrc))
      .toMatch(/^data:video\/mp4;base64,/);
    await expect(video).toHaveJSProperty('currentTime', 0);
    await expect(page.getByText('录屏无法加载', { exact: true })).toHaveCount(0);
    await progress.press('PageUp');
    await progress.press('PageUp');
    await expect
      .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime))
      .toBeGreaterThan(1);
    await expect(video).toHaveJSProperty('paused', true);
    expect(fetched).toEqual([rendition.video]);
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

test('a seek copy replays locally and can still be paused', async ({ page }) => {
  const fetched: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'fetch' && /\/great-ui\/media\/.*\.mp4$/.test(request.url()))
      fetched.push(request.url());
  });
  await page.goto('/zh/works/great-ui-text-reveal/');
  const video = page.locator('.recording-stage video');
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime > 0.2 && !node.error))
    .toBe(true);
  await page.getByRole('button', { name: '暂停录屏', exact: true }).click();
  const progress = page.getByRole('slider', { name: '录屏进度', exact: true });
  await progress.press('End');
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentSrc))
    .toMatch(/^data:video\/mp4;base64,/);
  await progress.press('PageDown');
  await expect
    .poll(() =>
      video.evaluate(
        (node: HTMLVideoElement) =>
          !node.seeking && node.paused && node.currentTime > node.duration / 2,
      ),
    )
    .toBe(true);
  await page.getByRole('button', { name: '播放录屏', exact: true }).click();
  await expect
    .poll(() =>
      video.evaluate(
        (node: HTMLVideoElement) =>
          !node.paused &&
          !node.error &&
          node.currentTime > 0.2 &&
          node.currentTime < node.duration / 2,
      ),
    )
    .toBe(true);
  expect(fetched).toHaveLength(1);
  expect(await video.evaluate((node: HTMLVideoElement) => node.currentSrc)).toMatch(
    /^data:video\/mp4;base64,/,
  );
  await page.getByRole('button', { name: '暂停录屏', exact: true }).click();
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
          (node: HTMLVideoElement, expected) =>
            node.readyState >= 2 &&
            !node.paused &&
            node.currentTime > 0.2 &&
            node.videoWidth === expected.width &&
            node.videoHeight === expected.height,
          rendition,
        ),
      )
      .toBe(true);
    expect(requests.some((url) => mediaPath(url) === rendition.video)).toBe(true);
    await page.getByRole('button', { name: '暂停录屏', exact: true }).click();
    const fraction = await video.evaluate(
      (node: HTMLVideoElement) => node.currentTime / node.duration,
    );
    await page.setViewportSize(originalViewport);
    const restored =
      originalViewport.width <= 800 ? entry.recordingMedia.mobile! : entry.recordingMedia;
    await expect
      .poll(() =>
        video.evaluate(
          (node: HTMLVideoElement, expected) =>
            node.readyState >= 2 &&
            node.paused &&
            node.videoWidth === expected.width &&
            node.videoHeight === expected.height,
          restored,
        ),
      )
      .toBe(true);
    await expect(video).toHaveJSProperty('paused', true);
    await page.getByRole('button', { name: '播放录屏', exact: true }).click();
    await expect
      .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime / node.duration))
      .toBeGreaterThanOrEqual(fraction - 0.03);
  });

test('a stale source error leaves a playing recording usable', async ({ page }) => {
  await page.goto('/zh/works/great-ui-text-reveal/');
  const video = page.locator('.recording-stage video');
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime > 0.2 && !node.paused))
    .toBe(true);
  await video.locator('source').last().dispatchEvent('error');
  await expect(page.getByText('录屏无法加载', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '暂停录屏', exact: true }).click();
  await expect(video).toHaveJSProperty('paused', true);
  await page.getByRole('button', { name: '播放录屏', exact: true }).click();
  await expect(video).toHaveJSProperty('paused', false);
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

for (const scenario of ['latest seek', 'rotation', 'oversize'] as const)
  test(`a server without byte ranges handles ${scenario} and releases its seek copy`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const sizes: number[] = [];
      Object.assign(window, { recordingCopies: sizes });
      const read = FileReader.prototype.readAsDataURL;
      FileReader.prototype.readAsDataURL = function (blob) {
        sizes.push(blob.size);
        read.call(this, blob);
      };
    });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetched: string[] = [];
    await page.route('**/great-ui/media/*.mp4', async (route) => {
      const path = mediaPath(route.request().url());
      if (route.request().resourceType() === 'fetch') {
        fetched.push(path);
        if (fetched.length === 1) await gate;
        if (scenario === 'oversize') {
          await route.fulfill({ status: 200, headers: { 'content-length': '2097153' }, body: '' });
          return;
        }
      }
      await route.fulfill({
        status: 200,
        contentType: 'video/mp4',
        body: await readFile(new URL('../public' + path, import.meta.url)),
      });
    });
    try {
      await page.goto('/zh/works/great-ui-text-reveal/');
      const video = page.locator('.recording-stage video');
      await expect
        .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime > 0.2))
        .toBe(true);
      expect(fetched).toEqual([]);
      const progress = page.getByRole('slider', { name: '录屏进度', exact: true });
      await progress.press('Home');
      for (let index = 0; index < 4; index++) await progress.press('PageUp');
      await expect.poll(() => fetched.length).toBe(1);
      const target = Number(await progress.inputValue());
      const duration = await video.evaluate((node: HTMLVideoElement) => node.duration);
      const fraction = target / duration;
      expect(fraction).toBeGreaterThan(0.35);
      if (scenario === 'rotation') {
        const narrow = page.viewportSize()!.width > 800;
        await page.setViewportSize(
          narrow ? { width: 390, height: 844 } : { width: 844, height: 390 },
        );
        await page.getByRole('button', { name: '播放录屏', exact: true }).click();
        const entry = pilots.find((item) => item.slug === 'text-reveal')!;
        const selected = narrow ? entry.recordingMedia.mobile! : entry.recordingMedia;
        await expect.poll(() => fetched.length).toBe(2);
        expect(fetched[1]).toBe(selected.video);
        await expect(video).toHaveJSProperty('videoWidth', selected.width);
        await expect
          .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime / node.duration))
          .toBeGreaterThanOrEqual(fraction - 0.03);
        await page.getByRole('button', { name: '暂停录屏', exact: true }).click();
      }
      release();
      if (scenario === 'oversize') {
        await expect(page.getByText('录屏无法加载', { exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: '查看原作', exact: true })).toBeVisible();
      } else {
        if (scenario === 'latest seek')
          await expect
            .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime))
            .toBeCloseTo(target, 1);
        await expect(video).toHaveJSProperty('paused', true);
        expect(await video.evaluate((node: HTMLVideoElement) => node.currentSrc)).toMatch(
          /^data:video\/mp4;base64,/,
        );
      }
      const old = (await video.elementHandle())!;
      await page.getByRole('link', { name: '返回合集', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(parent));
      await expect.poll(() => old.evaluate((node) => node.isConnected)).toBe(false);
      await expect
        .poll(() =>
          old.evaluate((node: HTMLVideoElement) => [
            node.getAttribute('src'),
            node.readyState,
            node.paused,
          ]),
        )
        .toEqual(['', 0, true]);
      await expect
        .poll(() =>
          page.evaluate(() => {
            const sizes = (window as unknown as { recordingCopies: number[] }).recordingCopies;
            return [sizes.length, sizes.every((size) => size <= 2 * 1024 * 1024)];
          }),
        )
        .toEqual([scenario === 'oversize' ? 0 : 1, true]);
    } finally {
      release();
    }
  });

test('a late media conversion cannot replace the current rendition', async ({ page }) => {
  await page.addInitScript(() => {
    const state = { waiting: false, aborted: 0, release: () => {} };
    Object.assign(window, { delayedConversion: state });
    const read = FileReader.prototype.readAsDataURL;
    const abort = FileReader.prototype.abort;
    let first = true;
    FileReader.prototype.readAsDataURL = function (blob) {
      if (first) {
        first = false;
        // Hold native completion while the user changes rendition.
        const loaded = this.onload;
        const ended = this.onloadend;
        let finish = () => {};
        this.onload = (event) => {
          state.waiting = true;
          state.release = () => {
            loaded?.call(this, event);
            finish();
          };
        };
        this.onloadend = (event) => {
          finish = () => ended?.call(this, event);
        };
      }
      read.call(this, blob);
    };
    FileReader.prototype.abort = function () {
      state.aborted++;
      abort.call(this);
    };
  });
  await page.goto('/zh/works/great-ui-text-reveal/');
  const video = page.locator('.recording-stage video');
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime > 0.2))
    .toBe(true);
  await page.getByRole('slider', { name: '录屏进度', exact: true }).press('Home');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { delayedConversion: { waiting: boolean } }).delayedConversion
            .waiting,
      ),
    )
    .toBe(true);
  const narrow = page.viewportSize()!.width > 800;
  await page.setViewportSize(narrow ? { width: 390, height: 844 } : { width: 844, height: 390 });
  await page.getByRole('button', { name: '播放录屏', exact: true }).click();
  const entry = pilots.find((item) => item.slug === 'text-reveal')!;
  await expect(video).toHaveJSProperty(
    'videoWidth',
    (narrow ? entry.recordingMedia.mobile! : entry.recordingMedia).width,
  );
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentSrc))
    .toMatch(/^data:video\/mp4;base64,/);
  const current = await video.evaluate((node: HTMLVideoElement) => node.currentSrc);
  expect(
    await page.evaluate(async () => {
      const state = (
        window as unknown as {
          delayedConversion: { aborted: number; release: () => void };
        }
      ).delayedConversion;
      state.release();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      return state.aborted;
    }),
  ).toBe(1);
  await expect(video).toHaveJSProperty('currentSrc', current);
  await expect(page.getByText('录屏无法加载', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '暂停录屏', exact: true }).click();
  await expect(video).toHaveJSProperty('paused', true);
});

test('a rejected rotation restore stays paused when motion preferences change', async ({
  page,
}) => {
  let fetched = 0;
  await page.route('**/great-ui/media/*.mp4', async (route) => {
    if (route.request().resourceType() === 'fetch') {
      fetched++;
      await route.fulfill({ status: 503, body: 'Unavailable' });
    } else
      await route.fulfill({
        status: 200,
        contentType: 'video/mp4',
        body: await readFile(
          new URL('../public' + mediaPath(route.request().url()), import.meta.url),
        ),
      });
  });
  await page.goto('/zh/works/great-ui-text-reveal/');
  const video = page.locator('.recording-stage video');
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime > 0.2 && !node.paused))
    .toBe(true);
  await page.setViewportSize(
    page.viewportSize()!.width > 800 ? { width: 390, height: 844 } : { width: 844, height: 390 },
  );
  await expect(page.getByText('录屏无法加载', { exact: true })).toBeVisible();
  // A queued readiness event must not retry the rejected restore.
  await video.dispatchEvent('canplay');
  await video.dispatchEvent('loadeddata');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(video).toHaveJSProperty('paused', true);
  await expect(page.getByRole('button', { name: '播放录屏', exact: true })).toBeDisabled();
  expect(fetched).toBe(1);
  // Paused native video may retain its request; leaving the player ends that lifetime.
  await page.getByRole('link', { name: '返回合集', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(parent));
});
