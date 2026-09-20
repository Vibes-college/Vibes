import { test, expect } from './browser-test.ts';
import { registerJourneyTests } from './fixtures/great-ui/journey.ts';
import { withMockSession } from './fixtures/paseo-webui/mock-session.ts';
import { learningMaterials } from '../src/features/great-ui/site-content.ts';

const collection = '/zh/works/great-ui-learning/';
const accordion = '/zh/works/great-ui-accordion/';
registerJourneyTests(accordion);

test('one collection leads to searchable learning pages with honest language and edit links', async ({
  page,
}) => {
  await page.goto('/zh/?q=渐进披露');
  const result = page.locator(`[data-search-grid] .card-link[href="${accordion}"]`);
  await expect(result).toBeVisible();
  await result.click();
  await expect(
    page.getByRole('heading', { name: '折叠问答', exact: true, level: 1 }),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://vibes.college' + accordion,
  );
  await expect(page.locator('.site-header')).toHaveCount(0);
  await expect(page.locator('.language-switch a[hreflang="en"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '编辑作品' })).toHaveAttribute(
    'href',
    /\/edit\/[^/]+(?:\/[^/]+)*\/src\/content\/works\/great-ui-accordion\/zh\.md$/,
  );
  await page.getByRole('link', { name: '返回合集' }).click();
  await expect(page).toHaveURL(new RegExp(collection));
  const linkedWorks = await page
    .locator('.section-content a[href*="/works/"]')
    .evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute('href')))].sort());
  expect(linkedWorks).toEqual(
    learningMaterials()
      .entries.map((entry) => `/zh/works/${entry.id}/`)
      .sort(),
  );
  await page.goto('/zh/');
  await expect(page.locator('[data-browse-grid]')).toHaveCount(1);
  expect(
    await page.locator('[data-browse-grid] .work-card--collection').count(),
  ).toBeLessThanOrEqual(1);
});

test('all 51 site previews decode under the real content policy and load only the selected clip', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  const media: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (/\/great-ui\/media\/.*\.mp4$/.test(request.url())) media.push(request.url());
  });
  for (const entry of learningMaterials().entries) {
    media.length = 0;
    await page.goto('/zh/works/' + entry.id + '/');
    await expect(page.locator('.great-ui h1')).toHaveText(entry.title);
    await expect
      .poll(() =>
        page
          .locator('.recording-stage video')
          .evaluate(
            (node: HTMLVideoElement) =>
              node.videoWidth > 0 && node.currentTime > 0.2 && !node.paused && !node.error,
          ),
      )
      .toBe(true);
    expect(
      media.every(
        (url) =>
          new URL(url).pathname ===
          (isMobile
            ? entry.recordingMedia.mobile?.video || entry.previewRecording
            : entry.previewRecording),
      ),
      entry.slug,
    ).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      entry.slug,
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('Astro navigation preserves the task draft, media modal focus and site return path', async ({
  page,
}) => {
  await page.goto(accordion);
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole('button', { name: '改造设计', exact: true }).click();
  await page.getByRole('button', { name: '方便同时比较答案', exact: true }).click();
  await page.getByRole('button', { name: /用这个效果/ }).click();
  await page.getByLabel('用在哪里', { exact: true }).fill('产品详情页');
  await page.getByText('查看同一任务的 JSON', { exact: true }).click();
  const task = JSON.parse(await page.getByLabel('结构化任务', { exact: true }).inputValue());
  expect(task.goal.id).toBe('compare');
  expect(task.media.url).toBe(
    new URL('/great-ui/media/accordion-source-capture.mp4', page.url()).href,
  );
  expect(task.selected.learningUrl).toBe(new URL(accordion, page.url()).href);
  expect((await page.request.get(task.media.url)).ok()).toBe(true);
  expect(task.media.localPath).toBeNull();
  await page.getByRole('button', { name: '关闭复制材料' }).click();
  await page.getByRole('button', { name: '下一个作品', exact: true }).click();
  await expect(page).not.toHaveURL(new RegExp(accordion));
  await page.goBack();
  await expect(page.getByRole('button', { name: '方便同时比较答案', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: /用这个效果/ }).click();
  await expect(page.getByLabel('用在哪里', { exact: true })).toHaveValue('产品详情页');
  await page.getByRole('button', { name: '关闭复制材料' }).click();
  await page.getByRole('button', { name: '放大录屏', exact: true }).click();
  await expect(page.locator('.learning-navigation')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('.learning-navigation')).not.toHaveAttribute('inert', '');
  await page.getByRole('link', { name: '返回合集' }).click();
  await expect(page).toHaveURL(new RegExp(collection));
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
});

test('case navigation remains locked while the next page is loading', async ({ page }) => {
  await page.goto('/zh/works/great-ui-button/');
  let release: () => void = () => {};
  let requested = false;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/zh/works/great-ui-card/', async (route) => {
    requested = true;
    await gate;
    await route.continue().catch(() => {});
  });
  try {
    await page.getByRole('button', { name: '下一个作品', exact: true }).click();
    await expect.poll(() => requested).toBe(true);
    await expect(page.getByRole('button', { name: '下一个作品', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: '浏览作品：全部分类' })).toBeDisabled();
    await expect(page).toHaveURL(/\/zh\/works\/great-ui-button\/$/);
  } finally {
    release();
  }
  await expect(page).toHaveURL(/\/zh\/works\/great-ui-card\/$/);
  await expect(page.locator('.great-ui h1')).toHaveText('有分隔线反馈的图片卡');
  await expect(page.getByRole('button', { name: '下一个作品', exact: true })).toBeEnabled();
});

for (const relation of [
  {
    source: 'great-ui-button',
    group: '相似作品',
    title: '轻量立体按钮',
    target: 'great-ui-minimal-buttons',
  },
  {
    source: 'beui-combobox',
    group: '相同原理',
    title: '有层级的基础按钮',
    target: 'great-ui-button',
  },
]) {
  test(`related case navigation resolves stable IDs from ${relation.source}`, async ({ page }) => {
    const sourcePath = `/zh/works/${relation.source}/`;
    await page.goto(sourcePath);
    const origin = await page.evaluate(() => performance.timeOrigin);
    await page
      .getByRole('region', { name: relation.group, exact: true })
      .getByRole('button', { name: new RegExp(relation.title) })
      .click();
    await expect(page).toHaveURL(new RegExp(`/zh/works/${relation.target}/$`));
    await expect(page.locator('.great-ui h1')).toHaveText(relation.title);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(sourcePath + '$'));
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  });
}

test('composition case navigation resolves its selected step and preserves the return panel', async ({
  page,
}) => {
  await page.goto(accordion);
  const origin = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole('button', { name: '串联设计', exact: true }).click();
  const step = page
    .locator('.composition-plan[open] .recipe-steps .related-case')
    .filter({ hasNotText: '折叠问答' })
    .first();
  await expect(step).toBeVisible();
  const title = (await step.innerText()).replace(/\s*→$/, '').trim();
  const target = learningMaterials().entries.find((entry) => entry.title === title)!;
  expect(target).toBeDefined();
  await step.click();
  await expect(page).toHaveURL(new RegExp(`/zh/works/${target.id}/$`));
  await expect(page.locator('.great-ui h1')).toHaveText(target.title);
  await page.goBack();
  await expect(page).toHaveURL(new RegExp(accordion + '$'));
  await expect(page.getByRole('button', { name: '串联设计', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
});

test('no JavaScript retains the full explanation, goals, glossary and sources', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + accordion);
    await page.getByText('文字版说明', { exact: true }).click();
    await expect(page.locator('.learning-markdown')).toContainText('方便同时比较');
    await expect(page.locator('.learning-markdown')).toContainText('Progressive disclosure');
    await expect(page.getByRole('link', { name: '原作', exact: true })).toHaveAttribute(
      'href',
      'https://www.great-ui.com/components/accordion',
    );
    await page.waitForLoadState('networkidle');
  } finally {
    await context.close();
  }
});

test('the learning page supplies the actual work to the native assistant without sending a message', async ({
  browser,
}, info) => {
  test.setTimeout(90_000);
  await withMockSession(browser, info, async ({ page, open }) => {
    await open();
    await page.locator('[data-paseo-close]').click();
    await page.goto(new URL(accordion, page.url()).href);
    await page.locator('[data-paseo-article-open]').focus();
    await page.locator('[data-paseo-article-open]').click();
    await expect(page.getByTestId('composer-public-work-attachment-pill')).toContainText(
      '折叠问答',
    );
    const reference = JSON.parse(
      (await page.locator('[data-paseo-public-work]').getAttribute('data-paseo-public-work')) ||
        '{}',
    );
    expect(JSON.stringify(reference)).toContain('https://vibes.college' + accordion);
    await expect(page.locator('#root textarea:visible')).toHaveValue('');
  });
});

for (const id of ['beui-combobox', 'rare-ui-duration-picker', 'microkit-sliding-content-tabs']) {
  test(`cross-source ${id}: owned playback, reachable task, attribution and navigation`, async ({
    page,
    isMobile,
  }) => {
    if (!isMobile) await page.setViewportSize({ width: 1280, height: 720 });
    const entry = learningMaterials().entries.find((entry) => entry.id === id)!;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/zh/works/' + id + '/');
    await expect(page.locator('.great-ui h1')).toHaveText(entry.title);
    const video = page.locator('.recording-stage video');
    await expect
      .poll(() =>
        video.evaluate((node: HTMLVideoElement) => ({
          decoded: node.videoWidth > 0 && node.readyState >= 2,
          playing: node.currentTime > 0.2 && !node.paused,
          error: node.error?.code || null,
        })),
      )
      .toEqual({ decoded: true, playing: true, error: null });
    expect(
      new URL(await video.evaluate((node: HTMLVideoElement) => node.currentSrc)).pathname,
    ).toBe(isMobile ? entry.recordingMedia.mobile!.video : entry.previewRecording);
    await page.getByRole('button', { name: '暂停录屏', exact: true }).click();
    await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(true);
    await page.getByRole('button', { name: '放大录屏', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '放大录屏', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /用这个效果/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByText('查看同一任务的 JSON', { exact: true }).click();
    const task = JSON.parse(await page.getByLabel('结构化任务', { exact: true }).inputValue());
    const text = await page.getByLabel('完整 Prompt', { exact: true }).inputValue();
    expect(task.selected.source).toBe(entry.source);
    expect(task.selected.reference).toBe(entry.reference);
    expect(task.license.url).toBe(entry.license);
    expect(text).toContain(entry.source);
    expect(task.media.url).toBe(new URL(entry.previewRecording!, page.url()).href);
    expect(task.media.localPath).toBeNull();
    await page.getByRole('button', { name: '关闭复制材料' }).click();
    await page.getByRole('button', { name: /浏览作品/ }).click();
    await page.getByLabel('搜索作品').fill('Combobox');
    await page.locator('.case-card').filter({ hasText: '能搜索，也能确认的选择框' }).click();
    await expect(page).toHaveURL(/\/zh\/works\/beui-combobox\/$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    expect(errors).toEqual([]);
  });
}
