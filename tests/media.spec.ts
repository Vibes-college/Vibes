import { test, expect } from './browser-test.ts';
import type { Page } from '@playwright/test';

// Exercise decoding/lifecycle with a licensed local stream; external playback is manual QA.
// Apply only to the remote-video cases so the cold/cached timing test keeps real HTTP caching.
async function useLocalVideoTransport(page: Page) {
  await page.route(/^https:\/\/yaoda\.work\/video\//, (route) =>
    route.fulfill({ path: 'public/media/sintel/preview.mp4', contentType: 'video/mp4' }),
  );
}

const detail = (kind: string, locale = 'zh') =>
  `/${locale}/works/${({ video: 'sintel-trailer', audio: 'carefree', loop: 'yaoda-football', gallery: 'feature-visualization', chart: 'anscombe-quartet', demo: '2048-original' } as Record<string, string>)[kind]}/`;
const mediaRequests = (url: string) => /\/media\/|\/_astro\/media[.-]/.test(url);

test('ordinary pages request no media and full video waits for click, supports chapters', async ({
  page,
}) => {
  const requested: string[] = [];
  page.on('request', (request) => {
    if (mediaRequests(request.url())) requested.push(request.url());
  });
  await page.goto('/zh/works/lora/');
  await page.waitForLoadState('networkidle');
  expect(requested).toEqual([]);
  await page.goto(detail('video'));
  const video = page.locator('[data-context=detail] video');
  await expect(video.locator('source')).toHaveCount(0);
  expect(requested.some((url) => url.endsWith('/full.mp4'))).toBe(false);
  await page.locator('[data-media-toggle]').click();
  await expect
    .poll(() => video.evaluate((el) => (el as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0);
  await expect(video.locator('track[src]')).toHaveCount(0);
  await page.locator('.media-tools > summary').click();
  await page.locator('[data-media-seek="30"]').first().click();
  await expect
    .poll(() => video.evaluate((el) => (el as HTMLVideoElement).currentTime))
    .toBeGreaterThanOrEqual(30);
  await page.locator('[data-media-toggle]').click();
  await expect(video).toHaveJSProperty('paused', true);
  await page.locator('.read-down').click();
  await expect(video).toHaveJSProperty('paused', true);
  await page.goBack();
  await expect(page.locator('[data-media-panel]')).toBeVisible();
  await expect(video).toHaveJSProperty('paused', true);
});

test('search cards preserve navigation, manual audio is exclusive, and replacement releases players', async ({
  page,
  isMobile,
}) => {
  await useLocalVideoTransport(page);
  await page.goto('/zh/page/2/');
  const max = isMobile ? 1 : 2;
  const playing = () =>
    page
      .locator('[data-context=card] video')
      .evaluateAll((els) => els.filter((el) => !(el as HTMLVideoElement).paused).length);
  await expect.poll(playing).toBeLessThanOrEqual(max);
  await page.getByRole('searchbox').fill('Sintel');
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  const autoVideo = page.locator('.work-card:visible video');
  await autoVideo.scrollIntoViewIfNeeded();
  await expect
    .poll(() => autoVideo.evaluate((el) => (el as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0);
  await page.goto('/zh/page/2/');
  const audioCard = page.locator('.work-card[data-kind=audio]:visible');
  await audioCard.scrollIntoViewIfNeeded();
  await audioCard.locator('[data-media-toggle]').click();
  await expect
    .poll(() => audioCard.locator('audio').evaluate((el) => (el as HTMLAudioElement).currentTime))
    .toBeGreaterThan(0);
  expect(await playing()).toBe(0);
  await page.getByRole('searchbox').fill('LoRA');
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await expect(page.locator('audio:visible, video:visible')).toHaveCount(0);
  await page.getByRole('searchbox').fill('Carefree');
  await expect(page.locator('.work-card--media:visible')).toHaveCount(1);
  await page.locator('.work-card[data-kind=audio]:visible .card-link').click();
  await expect(page).toHaveURL(/carefree/);
  await page.goBack();
  await expect(page.locator('.work-card--media:visible')).toHaveCount(1);
});

test('reduced motion waits for explicit play, pauses offscreen, and does not restart a user pause', async ({
  page,
}) => {
  await useLocalVideoTransport(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(detail('loop'));
  const root = page.locator('[data-media-panel]');
  const video = root.locator('video');
  await expect(video.locator('source')).toHaveCount(0);
  await root.locator('[data-media-toggle]').click();
  await expect
    .poll(() => video.evaluate((el) => (el as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0);
  await root.locator('[data-media-toggle]').click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(video).toHaveJSProperty('paused', true);
  await root.locator('[data-media-toggle]').click();
  await expect(video).toHaveJSProperty('paused', false);
  await page.locator('.read-down').click();
  await expect(video).toHaveJSProperty('paused', true);
});

test('gallery switches actual frames, zoom closes with focus restored, and remains narrow', async ({
  page,
}) => {
  await page.goto(detail('gallery'));
  await page.setViewportSize({ width: 320, height: 700 });
  const tabs = page.locator('[data-media-select]');
  await tabs.nth(1).click();
  const panel = page.locator('[data-media-panel]:visible');
  await expect(panel.locator('img')).toHaveAttribute('src', /distill-channel/);
  const zoom = panel.locator('[data-media-zoom]');
  await zoom.click();
  await expect(page.locator('dialog[open] img')).toHaveAttribute('src', /distill-channel/);
  await page.locator('dialog button').click();
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(zoom).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('audio full source is lazy and waveform and seek use the actual recording', async ({
  page,
}) => {
  await page.goto(detail('audio'));
  const audio = page.locator('audio');
  await expect(audio.locator('source')).toHaveCount(0);
  expect(await page.locator('.media-waveform path').count()).toBeGreaterThan(20);
  await page.locator('.media-tools > summary').click();
  await page.locator('[data-media-seek="60"]').click();
  await expect
    .poll(() => audio.evaluate((el) => (el as HTMLAudioElement).currentTime))
    .toBeGreaterThanOrEqual(60);
  await expect(audio.locator('source')).toHaveAttribute('src', '/media/carefree/full.mp3');
  await page.goto(detail('gallery'));
  await expect(page.locator('audio')).toHaveCount(0);
});

test('registered game and real dataset only start on demand and exit cleans up', async ({
  page,
}) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await page.goto(detail('demo'));
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.locator('[data-media-launch]').click();
  const game = page.frameLocator('iframe');
  await expect(game.locator('.game-container')).toBeVisible();
  await expect(game.locator('.tile')).toHaveCount(2);
  await game.locator('.game-container').click();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => game.locator('.tile').count()).toBeGreaterThan(2);
  await page.locator('[data-media-exit]').click();
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.goto(detail('chart'));
  expect(requested.some((url) => url.endsWith('/data.json'))).toBe(false);
  const panel = page.locator('[data-media-panel]:visible');
  await panel.locator('[data-media-launch]').click();
  await expect(panel.locator('.media-experience svg')).toBeVisible();
  await panel.locator('.media-experience input[type=range]').fill('5');
  await panel.locator('.media-experience summary').click();
  await expect(panel.locator('.media-experience tbody tr')).toHaveCount(5);
  await expect(panel.locator('.media-experience tbody tr').first()).toHaveText('108.04');
  await page.locator('[data-media-select]').nth(1).click();
  await expect(page.locator('.media-experience svg')).toHaveCount(0);
  await page.locator('[data-media-panel]:visible [data-media-launch]').click();
  await expect(page.locator('.media-experience svg')).toBeVisible();
  await page.locator('.read-down').click();
  await expect(page.locator('.media-experience svg')).toHaveCount(0);
});

test('failed full video and dataset keep retry, poster and source fallback', async ({ page }) => {
  await page.route('**/media/sintel/full.mp4', (route) => route.abort());
  await page.goto(detail('video'));
  await page.locator('[data-media-toggle]').click();
  await expect(page.locator('[data-media-status]')).toContainText('失败');
  await expect(page.locator('[data-media-image]')).toBeVisible();
  await expect(page.locator('.original-site')).toHaveAttribute(
    'href',
    'https://durian.blender.org/',
  );
  await page.unroute('**/media/sintel/full.mp4');
  await page.locator('[data-media-toggle]').click();
  await expect
    .poll(() => page.locator('video').evaluate((el) => (el as HTMLVideoElement).currentTime))
    .toBeGreaterThan(0);
  await page.route('**/media/anscombe/data.json', (route) =>
    route.fulfill({ status: 200, body: '[{"phase":0,"sine":"invalid","cosine":1}]' }),
  );
  await page.goto(detail('chart'));
  await page.locator('[data-media-panel]:visible [data-media-launch]').click();
  await expect(page.locator('[data-media-panel]:visible [data-media-status]')).toContainText(
    '失败',
  );
  await expect(page.locator('[data-media-panel]:visible [data-media-launch]')).toBeEnabled();
});

test('published English media and no-JS fallback remain readable', async ({ page, browser }) => {
  await page.goto('/en/?q=Attention%20transformers');
  await expect(page.locator('.work-card--media:visible')).toHaveCount(1);
  await page.locator('.work-card--media:visible .card-link').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Attention in transformers, step-by-step',
  );
  await expect(page.locator('[data-media-launch]')).toHaveAccessibleName('Start experience');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto('http://127.0.0.1:4322' + detail('video'));
  await expect(plain.locator('noscript a')).toHaveAttribute('href', '/media/sintel/full.mp4');
  await expect(plain.getByRole('heading', { level: 1 })).toContainText('Sintel');
  await plain.waitForLoadState('networkidle');
  await context.close();
});

test('cold and cached visits record page appearance and actual first video frame', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    const timing = { clickAt: 0, frameAt: 0, frameMethod: '' };
    Object.assign(window, { mediaPlaybackTiming: timing });
    document.addEventListener(
      'click',
      (event) => {
        if (!(event.target instanceof Element) || !event.target.closest('[data-media-toggle]'))
          return;
        const video = document.querySelector('video');
        if (!video || timing.clickAt) return;
        timing.clickAt = performance.now();
        if ('requestVideoFrameCallback' in video) {
          timing.frameMethod = 'requestVideoFrameCallback';
          video.requestVideoFrameCallback(() => {
            timing.frameAt = performance.now();
          });
        } else {
          timing.frameMethod = 'timeupdate fallback';
          (video as HTMLVideoElement).addEventListener(
            'timeupdate',
            () => {
              if (!timing.frameAt) timing.frameAt = performance.now();
            },
            { once: true },
          );
        }
      },
      true,
    );
  });
  const samples = [];
  for (const visit of ['cold', 'cached'] as const) {
    if (visit === 'cold') await page.goto(detail('video'));
    else await page.reload();
    await expect(page.locator('[data-media-image]')).toBeVisible();
    await page.locator('[data-media-image]').evaluate(async (element) => {
      await (element as HTMLImageElement).decode();
    });
    const posterObservedMs = await page.evaluate(() => performance.now());
    await page.locator('[data-media-toggle]').click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { mediaPlaybackTiming: { frameAt: number } }).mediaPlaybackTiming
              .frameAt,
        ),
      )
      .toBeGreaterThan(0);
    samples.push(
      await page.evaluate(
        ({ visit, posterObservedMs }) => {
          const timing = (
            window as unknown as {
              mediaPlaybackTiming: {
                clickAt: number;
                frameAt: number;
                frameMethod: string;
              };
            }
          ).mediaPlaybackTiming;
          const navigation = performance.getEntriesByType(
            'navigation',
          )[0] as PerformanceNavigationTiming;
          return {
            visit,
            domContentLoadedMs: navigation.domContentLoadedEventEnd,
            firstContentfulPaintMs:
              performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
            posterObservedMs,
            firstVideoFrameMs: timing.frameAt,
            clickToVideoFrameMs: timing.frameAt - timing.clickAt,
            frameMethod: timing.frameMethod,
            transferredBytes: navigation.transferSize,
          };
        },
        { visit, posterObservedMs },
      ),
    );
    expect(samples.at(-1)!.clickToVideoFrameMs).toBeGreaterThanOrEqual(0);
    await expect
      .poll(() =>
        page.locator('video').evaluate((video) => (video as HTMLVideoElement).currentTime),
      )
      .toBeGreaterThan(0);
  }
  await page.goto('/zh/works/lora/');
  await testInfo.attach('media-playback-timing', {
    body: JSON.stringify(
      {
        environment: testInfo.project.name,
        scope:
          'Local production build; one cold and one same-context cached visit. Mobile is emulation, not physical Safari. Poster is an observation upper bound; unavailable paint timing is null.',
        samples,
      },
      null,
      2,
    ),
    contentType: 'application/json',
  });
});

test('video cards keep the configured framing in the directory and search', async ({ page }) => {
  await useLocalVideoTransport(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/zh/page/2/');
  for (const search of [false, true]) {
    if (search) await page.getByRole('searchbox').fill('华丽');
    // Search keeps the original directory in the DOM; wait for the intended grid.
    const grid = page.locator(search ? '[data-search-grid]' : '[data-browse-grid]');
    await expect(grid).toBeVisible();
    const card = grid
      .locator('.work-card[data-kind=video]')
      .filter({ has: page.locator('a[data-work=yaoda-fx]') });
    await expect(card).toHaveCount(1);
    await expect(card).toBeVisible();
    await card.scrollIntoViewIfNeeded();
    await card.locator('[data-media-toggle]').click();
    const video = card.locator('video');
    await expect
      .poll(() => video.evaluate((el) => (el as HTMLVideoElement).currentTime))
      .toBeGreaterThan(0);
    await expect(video).toHaveCSS('object-fit', 'contain');
    const posterPosition = await card
      .locator('img')
      .evaluate((el) => getComputedStyle(el).objectPosition);
    await expect(video).toHaveCSS('object-position', posterPosition);
    await card.locator('[data-media-toggle]').click();
  }
});
