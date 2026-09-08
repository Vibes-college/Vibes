import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMockSession } from './fixtures/paseo-webui/mock-session.ts';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

function chunks() {
  const receipt = JSON.parse(
    readFileSync(resolve('.scratch/paseo-webui/artifacts/A3/build-receipt.json'), 'utf8'),
  );
  return receipt.files
    .filter((f: { path: string }) => /\/(?:__common|highlight-runtime)-[a-f0-9]+\.js$/.test(f.path))
    .map((f: { path: string }) => receipt.publicPath + '/' + f.path) as string[];
}

test('highlighted chat copies original code and file editor reuses shared definitions', async ({
  browser,
}, info) => {
  test.skip(process.env.PASEO_MOCK_PROFILE !== 'A3', 'Requires the A3 production fixture host.');
  test.setTimeout(90000);
  await withMockSession(browser, info, async ({ page, open, createSession }) => {
    const code = "  const fixture = '<tag>&';\n  console.log(fixture);";
    const session = await createSession({
      featureValues: { mockAssistantResponse: '```javascript\n' + code + '\n\n```' },
    });
    writeFileSync(resolve(session.cwd, 'fixture.js'), code);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          async writeText(text: string) {
            Reflect.set(window, '__fixtureClipboard', text);
          },
        },
      });
    });
    const downloads: string[] = [];
    page.on('request', (r) => downloads.push(new URL(r.url()).pathname));
    await open(session);
    await page.locator('#root textarea:visible').fill('Return the configured code.');
    await page.getByRole('button', { name: '发送消息', exact: true }).click();
    const block = page.locator(
      '[data-paseo-markdown-tag=pre][data-paseo-markdown-language=javascript]',
    );
    const raw = block.locator('[data-paseo-markdown-tag=code]');
    await expect.poll(() => raw.locator('span').count()).toBeGreaterThan(0);
    if (!info.project.use.hasTouch) await block.hover();
    await block.getByRole('button', { name: '复制代码', exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, '__fixtureClipboard')))
      .toBe(code);
    const shared = chunks();
    expect(shared).toHaveLength(2);
    for (const path of shared) expect(downloads.filter((v) => v === path)).toHaveLength(1);
    await page.getByRole('button', { name: '打开侧边面板', exact: true }).click();
    await page.getByText('文件', { exact: true }).click();
    await page.getByText('fixture.js', { exact: true }).click();
    await expect(page.getByTestId('file-source-editor')).toBeVisible();
    await expect(page.locator('.cm-content')).toContainText('console.log(fixture)');
    for (const path of shared) expect(downloads.filter((v) => v === path)).toHaveLength(1);
    await info.attach('highlight-shared-copy', {
      body: JSON.stringify({
        shared,
        downloads,
        clipboard: 'Observed original text passed to the clipboard API',
      }),
      contentType: 'application/json',
    });
  });
});

test('tool content beyond the native highlight limit stays complete without grammar downloads', async ({
  browser,
}, info) => {
  test.skip(process.env.PASEO_MOCK_PROFILE !== 'A3', 'Requires the A3 production fixture host.');
  test.setTimeout(90000);
  await withMockSession(browser, info, async ({ page, open }) => {
    const downloads: string[] = [];
    page.on('request', (r) => downloads.push(new URL(r.url()).pathname));
    await open();
    await page.locator('#root textarea:visible').fill('emit 120000 byte file agent stream payload');
    await page.getByRole('button', { name: '发送消息', exact: true }).click();
    const row = page.getByRole('button').filter({ hasText: 'large-file.txt' }).first();
    await expect(row).toBeVisible();
    await row.click({ position: { x: 8, y: 8 } });
    await expect(page.getByTestId('tool-call-sheet-close')).toBeVisible();
    const raw = page
      .locator('[data-pmono]')
      .filter({ hasText: 'file ' + 'x'.repeat(20) })
      .last();
    await expect(raw).toBeVisible();
    await expect.poll(() => raw.textContent().then((text) => text?.length)).toBe(120000);
    // Let several stable-content timer intervals pass; a delayed download is still a failure.
    await page.waitForTimeout(800);
    for (const path of chunks()) expect(downloads).not.toContain(path);
    await info.attach('highlight-native-limit', {
      body: JSON.stringify({ length: 120000, downloads }),
      contentType: 'application/json',
    });
  });
});

test('native edit details load the shared highlighter only when opened', async ({
  browser,
}, info) => {
  test.skip(process.env.PASEO_MOCK_PROFILE !== 'A3', 'Requires the A3 production fixture host.');
  test.setTimeout(90000);
  await withMockSession(browser, info, async ({ page, open }) => {
    const downloads: string[] = [];
    page.on('request', (r) => downloads.push(new URL(r.url()).pathname));
    await open();
    await page.locator('#root textarea:visible').fill('Run the configured native tool fixture.');
    await page.getByRole('button', { name: '发送消息', exact: true }).click();
    const row = page.getByRole('button').filter({ hasText: 'use-scroll-anchor.ts' }).first();
    await expect(row).toBeVisible({ timeout: 30000 });
    for (const path of chunks()) expect(downloads).not.toContain(path);
    await row.click({ position: { x: 8, y: 8 } });
    await expect(page.getByTestId('tool-call-sheet-close')).toBeVisible();
    await expect(
      page.getByText('const NEAR_BOTTOM_PX = 160;', { exact: false }).last(),
    ).toBeVisible();
    for (const path of chunks())
      await expect.poll(() => downloads.filter((p) => p === path).length).toBe(1);
    await page.getByTestId('tool-call-sheet-close').click();
    await row.click({ position: { x: 8, y: 8 } });
    await expect(page.getByTestId('tool-call-sheet-close')).toBeVisible();
    for (const path of chunks()) expect(downloads.filter((p) => p === path)).toHaveLength(1);
    await info.attach('tool-highlight-boundary', {
      body: JSON.stringify({ downloads }),
      contentType: 'application/json',
    });
  });
});

test('unsupported fence languages do not request unused grammars', async ({ browser }, info) => {
  test.skip(process.env.PASEO_MOCK_PROFILE !== 'A3', 'Requires the A3 production fixture host.');
  test.setTimeout(90000);
  await withMockSession(browser, info, async ({ page, open, createSession }) => {
    const code = "printf 'opaque fixture <&>'";
    const session = await createSession({
      featureValues: { mockAssistantResponse: '```bash\n' + code + '\n```' },
    });
    const downloads: string[] = [];
    page.on('request', (r) => downloads.push(new URL(r.url()).pathname));
    await open(session);
    await page.locator('#root textarea:visible').fill('Return the configured opaque code.');
    await page.getByRole('button', { name: '发送消息', exact: true }).click();
    const raw = page.locator(
      '[data-paseo-markdown-tag=pre][data-paseo-markdown-language=bash] [data-paseo-markdown-tag=code]',
    );
    await expect(raw).toHaveText(code);
    await page.waitForTimeout(800);
    for (const path of chunks()) expect(downloads).not.toContain(path);
  });
});
