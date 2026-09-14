import { test, expect } from '@playwright/test';
import { entries, index } from '../../src/features/great-ui/content-build.mjs';
import { fileURLToPath } from 'node:url';
import recordings from '../../src/features/great-ui/data/local-recordings.json' with { type: 'json' };

const recordedFixture = fileURLToPath(
  new URL('../../src/features/great-ui/media/staggered-source-capture.mp4', import.meta.url),
);

test('all local replacement recordings decode and start without an external media request', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('imagekit.io')) external.push(request.url());
  });
  for (const slug of Object.keys(recordings)) {
    await page.goto('/?case=' + slug);
    const video = page.locator('.recording-stage video');
    await expect
      .poll(() =>
        video.evaluate((node: HTMLVideoElement) => ({
          decoded: node.videoWidth > 0 && node.readyState >= 2,
          advanced: node.currentTime > 0.2 && !node.paused,
          error: node.error?.code || null,
        })),
      )
      .toEqual({ decoded: true, advanced: true, error: null });
  }
  expect(external).toEqual([]);
});

test('opening an external MP4 starts muted playback with no launch card or credit row', async ({
  page,
}) => {
  await page.route('https://ik.imagekit.io/**', (route) =>
    route.fulfill({ path: recordedFixture, contentType: 'video/mp4' }),
  );
  await page.goto('/?case=scroll-flying-cards');
  const video = page.locator('.recording-stage video');
  await expect
    .poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime))
    .toBeGreaterThan(0);
  expect(await video.evaluate((node: HTMLVideoElement) => node.muted && !node.paused)).toBe(true);
  await expect(page.getByRole('button', { name: '播放作者演示', exact: true })).toHaveCount(0);
  await expect(page.locator('.preview-credit, .external-preview-actions')).toHaveCount(0);
  const gap = await page.evaluate(
    () =>
      document.querySelector('.case-navigation')!.getBoundingClientRect().top -
      document.querySelector('.video-player')!.getBoundingClientRect().bottom,
  );
  expect(gap).toBeLessThanOrEqual(1);
});

test('script-disabled and failed startup retain explanation and an original source link', async ({
  browser,
  page: enabledPage,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4336/');
  await expect(
    page.getByText('Great UI 学习工作台正在加载，浏览与生成任务需要 JavaScript。'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: '查看 Great UI 原作' })).toHaveAttribute(
    'href',
    'https://www.great-ui.com',
  );
  await context.close();
  await enabledPage.route('**/assets/index*.js', (route) => route.abort());
  await enabledPage.goto('/');
  await expect(enabledPage.getByRole('link', { name: '查看 Great UI 原作' })).toBeVisible();
  await expect(
    enabledPage.getByText('Great UI 学习工作台正在加载，浏览与生成任务需要 JavaScript。'),
  ).toBeVisible();
});

test('the original three examples retain glossary controls inside their explanations', async ({
  page,
}) => {
  for (const slug of ['staggered-page-transition', 'accordion', 'text-reveal']) {
    await page.goto('/?case=' + slug);
    const term = page.locator('.explanation .term').first();
    await term.click();
    await expect(page.locator('.term-popover')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.term-popover')).toBeHidden();
  }
});

test('all 48 details, glossary and modification goals render without loading other videos', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  const externalMedia: string[] = [];
  await page.route('https://ik.imagekit.io/**', (route) =>
    route.fulfill({ path: recordedFixture, contentType: 'video/mp4' }),
  );
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.url().includes('imagekit.io')) externalMedia.push(request.url());
  });
  for (const entry of index) {
    externalMedia.length = 0;
    await page.goto('/?case=' + entry.slug);
    await expect(
      page.getByRole('heading', { name: entry.title, exact: true, level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /全部作品/ })).toBeVisible();
    await page.getByRole('button', { name: '改造设计', exact: true }).click();
    await expect(page.getByRole('heading', { name: '让 Agent 这样改', exact: true })).toBeVisible();
    await expect(page.locator('.goal-options button')).toHaveCount(3);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    expect(overflow, entry.slug + ' horizontal overflow').toBe(false);
    const current = entries.find((item: { slug: string }) => item.slug === entry.slug)!;
    expect(
      externalMedia.every((url) => url === current.previewRecording),
      entry.slug + ' only loads its own recording',
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('search, category, empty results, draft state and history stay usable', async ({ page }) => {
  await page.goto('/?case=accordion');
  await page.getByRole('button', { name: /用这个效果/ }).click();
  await page.getByLabel('用在哪里', { exact: true }).fill('产品详情页');
  await page.getByRole('button', { name: '关闭复制材料' }).click();
  await page.getByRole('button', { name: /全部作品/ }).click();
  await page.getByLabel('搜索作品').fill('zzzz-no-match');
  await expect(page.getByText('找到 0 件作品')).toBeVisible();
  await page.getByLabel('搜索作品').fill('');
  await page.getByRole('combobox', { name: '分类', exact: true }).selectOption('主题切换');
  await expect(page.getByText('找到 4 件作品')).toBeVisible();
  await page.locator('.case-card').first().click();
  await expect(page.locator('h1')).not.toHaveText('折叠问答');
  await page.goBack();
  await page.getByRole('button', { name: /用这个效果/ }).click();
  await expect(page.getByLabel('用在哪里', { exact: true })).toHaveValue('产品详情页');
});

test('clipboard failure preserves readable text and the same structured task', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('test denied')) },
    });
  });
  await page.goto('/?case=button');
  await page.getByRole('button', { name: /用这个效果/ }).click();
  await page.getByLabel('用在哪里', { exact: true }).fill('检查表单');
  await page.getByLabel('保留什么，改什么').fill('保留颜色，失败时允许重试');
  await page.getByRole('button', { name: '复制 Prompt', exact: true }).click();
  await expect(page.getByText('自动复制未成功，已展开完整材料，请全选复制。')).toBeVisible();
  const text = await page.getByLabel('完整 Prompt', { exact: true }).inputValue();
  await page.getByText('查看同一任务的 JSON', { exact: true }).click();
  const task = JSON.parse(await page.getByLabel('结构化任务', { exact: true }).inputValue());
  expect(task.placement).toBe('检查表单');
  for (const value of [task.placement, task.changes, task.selected.source, task.goal.action])
    expect(text).toContain(value);
});

test('bad details are retryable, and leaving a delayed response cannot replace the current work', async ({
  page,
}) => {
  let bad = true;
  await page.route('**/content/button.json', async (route) =>
    bad ? route.fulfill({ json: { id: 'broken' } }) : route.continue(),
  );
  await page.goto('/?case=button');
  await expect(page.getByRole('alert')).toContainText('作品材料未完整加载');
  bad = false;
  await page.getByRole('button', { name: '重新加载', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('有层级的基础按钮');
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/content/github-card.json', async (route) => {
    await gate;
    await route.continue().catch(() => {});
  });
  await page.getByRole('button', { name: '下一个作品' }).click();
  await expect(page.getByText('正在加载作品材料…')).toBeVisible();
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('有层级的基础按钮');
  release();
  await expect(page.locator('h1')).toHaveText('有层级的基础按钮');
});

test('composition discloses pinned conflicts and exports complete steps with project conditions', async ({
  page,
}) => {
  await page.goto('/?case=split-theme-provider');
  await page.getByRole('button', { name: '串联设计', exact: true }).click();
  await expect(page.getByRole('heading', { name: '当前条件下没有完整方案' })).toBeVisible();
  await page.getByLabel('方案中保留当前作品').uncheck();
  await expect(page.locator('.composition-plan')).toHaveCount(3);
  await page.getByRole('button', { name: '生成这条路径的任务 →' }).first().click();
  await page.getByText('查看同一任务的 JSON', { exact: true }).click();
  const task = JSON.parse(await page.getByLabel('结构化任务', { exact: true }).inputValue());
  expect(task.mode).toBe('composition');
  expect(task.plan.steps).toHaveLength(5);
  expect(task.plan.contextKey).toContain('framework=unknown');
  expect(task.plan.status).not.toBe('verified');
});
