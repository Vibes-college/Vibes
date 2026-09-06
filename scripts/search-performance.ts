import assert from 'node:assert/strict';
import { scaleMarker } from './scale-marker.ts';
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

// 每次冷测量使用新浏览器上下文；热测量复用同一查询已加载的索引与分片。
export async function searchPerformance(origin: string) {
  const browser = await chromium.launch();
  const samples: { locale: string; cold: number[]; warm: number[]; initialRequests: number }[] = [];
  try {
    for (const locale of ['zh', 'en']) {
      const row = { locale, cold: [] as number[], warm: [] as number[], initialRequests: 0 };
      for (let attempt = 0; attempt < 5; attempt++) {
        const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
        try {
          const page = await context.newPage();
          const session = await context.newCDPSession(page);
          await session.send('Network.enable');
          await session.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 150,
            downloadThroughput: 1_600_000 / 8,
            uploadThroughput: 750_000 / 8,
          });
          await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
          let requests = 0;
          page.on('request', (request) => {
            if (request.url().includes('/pagefind/')) requests++;
          });
          await page.goto(`${origin}/${locale}/`, { waitUntil: 'networkidle' });
          row.initialRequests += requests;
          assert.equal(requests, 0, 'Homepage fetched search resources without intent');
          for (const state of ['cold', 'warm'] as const) {
            const started = performance.now();
            await page.getByRole('searchbox').fill(scaleMarker(2500));
            await page
              .locator('[data-search-grid] [data-work="scale-2500"]')
              .waitFor({ timeout: 30000 });
            row[state].push(Math.round(performance.now() - started));
            await page.locator('.search-clear').click();
            await page.locator('[data-browse-grid]').waitFor();
          }
        } finally {
          await context.close();
        }
      }
      samples.push(row);
    }
  } finally {
    await browser.close();
  }
  return samples.map((row) => ({
    ...row,
    coldMedian: median(row.cold),
    coldMax: Math.max(...row.cold),
    warmMedian: median(row.warm),
    warmMax: Math.max(...row.warm),
    pass: median(row.cold) <= 3000 && median(row.warm) <= 1000,
  }));
}
function median(values: number[]): number {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
}

// 首中末关键词只写正文；打开实际详情并验证无JS静态分页与全目录相邻导航。
export async function validateScale(origin: string) {
  const browser = await chromium.launch();
  try {
    for (const locale of ['zh', 'en']) {
      const page = await browser.newPage();
      const diagnostics: string[] = [];
      page.on('console', (message) => diagnostics.push(`console: ${message.text()}`));
      page.on('pageerror', (error) => diagnostics.push(`pageerror: ${error.message}`));
      page.on('requestfailed', (request) =>
        diagnostics.push(`request: ${request.url()} ${request.failure()?.errorText}`),
      );
      for (const index of [0, 2500, 4999]) {
        await page.goto(`${origin}/${locale}/?q=${scaleMarker(index)}`);
        const result = page.locator(`[data-search-grid] [data-work="scale-${index}"]`);
        try {
          await result.waitFor();
        } catch (error) {
          const path = 'resources/evidence/001-multilingual-explore';
          mkdirSync(path, { recursive: true });
          await page.screenshot({ path: `${path}/scale-search-failure.png` });
          writeFileSync(
            `${path}/scale-search-failure.json`,
            JSON.stringify(
              { locale, index, diagnostics, text: await page.locator('body').innerText() },
              null,
              2,
            ),
          );
          throw error;
        }
        await result.click();
        assert.ok((await page.locator('.prose').textContent())?.includes(`${scaleMarker(index)}`));
      }
      await page.goto(
        `${origin}/${locale}/?q=${encodeURIComponent(locale === 'zh' ? '低秩矩阵' : 'attention')}`,
      );
      await page.locator('[data-search-grid] .work-card').first().waitFor();
      assert.equal(await page.locator('[data-search-grid] .work-card').count(), 24);
      await page.locator('[data-more]').click();
      await page.waitForFunction(
        () => document.querySelectorAll('[data-search-grid] .work-card').length === 48,
      );
      await page.close();
      const context = await browser.newContext({ javaScriptEnabled: false });
      const staticPage = await context.newPage();
      await staticPage.goto(`${origin}/${locale}/`);
      assert.equal(await staticPage.locator('.work-card').count(), 24);
      await staticPage.locator('[data-pagination] a[rel="next"]').click();
      assert.equal(await staticPage.locator('.work-card').count(), 24);
      assert.ok(staticPage.url().endsWith('/page/2/'));
      await staticPage.goto(`${origin}/${locale}/page/209/`);
      assert.equal(await staticPage.locator('.work-card').count(), 8);
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
