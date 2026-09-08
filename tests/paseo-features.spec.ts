import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMockSession } from './fixtures/paseo-webui/mock-session.ts';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

for (const failFirst of [false, true]) {
  test(`Mermaid waits for explicit expansion and retains native isolation${failFirst ? ' after a failed chunk and retry' : ''}`, async ({
    browser,
  }, info) => {
    test.skip(process.env.PASEO_MOCK_PROFILE !== 'A1', 'Requires the A1 production fixture host.');
    test.setTimeout(90000);
    const receipt = JSON.parse(
      readFileSync(resolve('.scratch/paseo-webui/artifacts/A1/build-receipt.json'), 'utf8'),
    );
    const chunks = receipt.files.filter((file: { path: string }) =>
      /\/host-[a-f0-9]+\.js$/.test(file.path),
    );
    expect(chunks).toHaveLength(1);
    const chunkPath = receipt.publicPath + '/' + chunks[0].path;
    await withMockSession(browser, info, async ({ page, createSession, open }) => {
      const session = await createSession({
        featureValues: {
          mockAssistantResponse:
            'Diagram fixture\n\n```mermaid\nflowchart LR\n  Start[Fixture start] --> Middle[Fixture middle] --> Finish[Fixture finish]\n```',
        },
      });
      const downloads: string[] = [];
      const errors: string[] = [];
      let attempts = 0;
      page.on('request', (request) => downloads.push(new URL(request.url()).pathname));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.route('**' + chunkPath, async (route) => {
        attempts++;
        if (failFirst && attempts === 1) await route.abort('failed');
        else await route.continue();
      });
      try {
        await open(session);
        expect(downloads).not.toContain(chunkPath);
        await page.locator('#root textarea:visible').fill('Render the configured diagram fixture.');
        await page.getByRole('button', { name: '发送消息', exact: true }).click();
        const expand = page.getByTestId('paseo-mermaid-expand');
        await expect(expand).toBeVisible();
        expect(downloads).not.toContain(chunkPath);
        await expect(page.getByTestId('paseo-mermaid-lazy-fence')).toContainText('Fixture start');
        await expand.click();
        if (failFirst) {
          await expect(page.getByTestId('paseo-mermaid-load-error')).toBeVisible();
          expect(attempts).toBe(1);
          await expect(expand).toBeEnabled();
          await expand.click();
        }
        const frame = page.locator('#root iframe[sandbox="allow-scripts"]').last();
        await expect(frame).toBeAttached();
        await expect(frame.contentFrame().locator('svg')).toBeVisible({ timeout: 20000 });
        expect(await frame.getAttribute('sandbox')).toBe('allow-scripts');
        expect(
          await frame
            .contentFrame()
            .locator('body')
            .evaluate(() => {
              try {
                void window.parent.document;
                return true;
              } catch {
                return false;
              }
            }),
        ).toBe(false);
        const canvas = page.getByTestId('mermaid-viewport-canvas');
        if (info.project.use.hasTouch) await canvas.tap({ position: { x: 8, y: 8 } });
        else await canvas.hover({ position: { x: 8, y: 8 } });
        const viewportBox = await page.getByTestId('mermaid-viewport').boundingBox();
        const actionBox = await page
          .getByRole('button', { name: '查看源码', exact: true })
          .boundingBox();
        expect(viewportBox).not.toBeNull();
        expect(actionBox).not.toBeNull();
        expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(
          viewportBox!.y + viewportBox!.height,
        );
        await page.getByRole('button', { name: '查看源码', exact: true }).click();
        await page.getByRole('button', { name: '查看图表', exact: true }).click();
        await expect(frame.contentFrame().locator('svg')).toBeVisible();
        expect(attempts).toBe(failFirst ? 2 : 1);
        await page.locator('[data-paseo-close]').click();
        await page.locator('[data-paseo-open]').click();
        await expect(frame.contentFrame().locator('svg')).toBeVisible();
        expect(attempts).toBe(failFirst ? 2 : 1);
        expect(errors.filter((error) => /Content Security Policy|Refused to/i.test(error))).toEqual(
          [],
        );
      } finally {
        console.log(
          JSON.stringify({ attempts, errors: errors.map((error) => error.slice(0, 1200)) }),
        );
        await info.attach('mermaid-production-requests', {
          body: JSON.stringify({ chunkPath, attempts, downloads, errors }),
          contentType: 'application/json',
        });
      }
    });
  });
}
