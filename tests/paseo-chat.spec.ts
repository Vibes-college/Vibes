import { registerMockOperationTests } from './fixtures/paseo-webui/mock-operations.ts';
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const hostUrl = process.env.PASEO_CSP_URL;
const pairingFile = process.env.PASEO_PAIRING_FILE;
if (hostUrl && !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(hostUrl))
  throw new Error('Native chat tests require the isolated local Worker.');
if (pairingFile && !resolve(pairingFile).startsWith(resolve('.scratch') + '/'))
  throw new Error('Pairing fixture must remain private under .scratch/.');
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('public work reference uses the editable native draft and survives article navigation and reload', async ({
  browser,
}, testInfo) => {
  test.skip(
    !hostUrl || !pairingFile,
    'Requires the same-version isolated relay and private pairing offer.',
  );
  test.setTimeout(90000);
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = testInfo.project.use;
  const context = await browser.newContext({
    viewport,
    userAgent,
    deviceScaleFactor,
    isMobile,
    hasTouch,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  let failure: unknown;
  try {
    await page.goto(hostUrl + '/zh/works/attention-is-all-you-need/');
    await page.locator('[data-paseo-open]').click();
    await expect(page.locator('#local-assistant')).toHaveAttribute('data-paseo-state', 'operable', {
      timeout: 45000,
    });
    await page.getByText('粘贴配对链接', { exact: true }).click();
    await page
      .getByRole('textbox', { name: '配对链接', exact: true })
      .fill(readFileSync(pairingFile!, 'utf8').trim());
    await page.getByRole('button', { name: '配对', exact: true }).click();
    await expect(page.locator('#root #menu-button')).toBeVisible({ timeout: 30000 });
    await page.locator('#root #menu-button').click();
    await page.getByRole('button', { name: '历史', exact: true }).click();
    await page
      .getByText(/^这是直接挂载界面的受控审批测试。仅在当前 compat 目录/)
      .first()
      .click();
    await expect(
      page.getByRole('button', { name: '选择模型（GPT-5.6-Luna）', exact: true }),
    ).toBeVisible({ timeout: 30000 });
    const input = page.locator('#root textarea:visible');
    await input.fill('DRAFT_REVIEW_ONLY: 请解释这篇公开作品。');
    await page.getByRole('button', { name: '附带当前作品', exact: true }).click();
    const attached = await input.inputValue();
    expect(attached).toContain('DRAFT_REVIEW_ONLY:');
    expect(attached).toContain('"title":"Attention Is All You Need"');
    expect(attached).toContain('https://vibes.college/zh/works/attention-is-all-you-need/');
    await page.getByRole('button', { name: '取消作品资料', exact: true }).click();
    await expect(input).toHaveValue('DRAFT_REVIEW_ONLY: 请解释这篇公开作品。');
    await page.getByRole('button', { name: '附带当前作品', exact: true }).click();
    const origin = await page.evaluate(() => performance.timeOrigin);
    await page.locator('[data-paseo-close]').click();
    await page.getByRole('link', { name: '下一个作品：Transformers.js', exact: true }).click();
    await expect(page).toHaveURL(/\/zh\/works\/transformers-js\/$/);
    await page.locator('[data-paseo-open]').click();
    await expect(input).toHaveValue(attached);
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
    await page.reload();
    await expect(page.locator('#local-assistant')).toBeHidden();
    await page.locator('[data-paseo-open]').click();
    await expect(input).toHaveValue(attached, { timeout: 30000 });
    await page.getByRole('button', { name: '取消作品资料', exact: true }).click();
    await expect(input).toHaveValue('DRAFT_REVIEW_ONLY: 请解释这篇公开作品。');
    // This check exercises draft editing only. A real model send is verified separately.
    await input.fill('');
  } catch (error) {
    failure = error;
  } finally {
    // Close before the runner could capture private pairing fields on failure.
    try {
      await context.close();
    } catch (error) {
      failure ??= error;
    }
  }
  if (failure) throw failure;
});

registerMockOperationTests();
