import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

test('local filtering, empty state, sorting, and URL survive refresh', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.work-card:visible')).toHaveCount(24);
  await page.getByText('Papers', { exact: true }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(4);
  await page.getByRole('searchbox').fill('LoRA');
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('searchbox')).toHaveValue('LoRA');
  await expect(page.locator('.work-card:visible')).toHaveCount(1);
  await page.getByRole('searchbox').fill('not-in-the-collection');
  await expect(page.getByRole('heading', { name: 'Nothing here, yet.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search & filters' }).click();
  await expect(page.locator('.work-card:visible')).toHaveCount(24);
  await page.getByText('A–Z', { exact: true }).click();
  await expect(page.locator('.work-card:visible').first()).toHaveAttribute('data-title', 'AI Index Report 2025');
});

test('details open without requests; back, forward, Escape and focus work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('[data-enhanced]')).toBeVisible();
  const opener = page.getByRole('link', { name: 'Explore LoRA: Low-Rank Adaptation of Large Language Models', exact: true });
  await opener.scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await opener.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('heading', { level: 1 })).toContainText('LoRA');
  await expect(page).toHaveURL(/\/works\/lora\//);
  await expect(page.getByRole('dialog').getByRole('link', { name: /Visit original/ })).toHaveAttribute('href', 'https://arxiv.org/abs/2106.09685');
  await page.goBack();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(opener).toBeFocused();
  expect(Math.abs(await page.evaluate(() => scrollY) - scroll)).toBeLessThan(5);
  await page.goForward();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test('standalone detail is readable with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/works/attention-is-all-you-need/');
  await expect(page.getByRole('heading', { name: 'Attention Is All You Need' })).toBeVisible();
  await expect(page.locator('.detail-description')).toContainText('Transformer');
  await page.getByRole('link', { name: '← Explore' }).click();
  await expect(page.locator('.work-card')).toHaveCount(24);
  await page.getByRole('link', { name: 'Explore Transformers.js', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Transformers.js' })).toBeVisible();
  await context.close();
});

test('no horizontal overflow, no embeds, two-line card descriptions', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('iframe, video, audio')).toHaveCount(0);
  expect(await page.locator('.card-summary').evaluateAll(elements => elements.every(el => {
    const style = getComputedStyle(el);
    return el.clientHeight <= parseFloat(style.lineHeight) * 2 + 1 && style.webkitLineClamp === '2';
  }))).toBe(true);
  await page.getByRole('link', { name: 'Explore Transformers.js', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Close detail' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('static output stays small and content routes exist', async ({ request }) => {
  const js = readdirSync('dist/_astro').filter(file => file.endsWith('.js'));
  const total = js.reduce((n,file) => n + gzipSync(readFileSync(`dist/_astro/${file}`)).length, 0);
  expect(js.length).toBeGreaterThan(0);
  expect(total).toBeLessThan(10_000);
  expect(gzipSync(readFileSync('dist/index.html')).length).toBeLessThan(40_000);
  expect(statSync('src/scripts/explore.ts').size).toBeLessThan(12_000);
  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('/works/lora/');
  expect((await request.get('/not-a-real-page')).status()).toBe(404);
});
