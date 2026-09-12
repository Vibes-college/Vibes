import { test, expect } from '@playwright/test';
import { statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { withMockSession } from './mock-session.ts';

export function registerDefaultDirectoryTests() {
  test('first launch prepares Chat without Codex or an automatic model choice', async ({
    browser,
  }, info) => {
    test.setTimeout(90_000);
    await withMockSession(browser, info, async ({ page, serverId }) => {
      let creates = 0;
      await page.routeWebSocket('ws://localhost:4396/ws', (socket) => {
        const upstream = socket.connectToServer();
        socket.onMessage((message) => {
          try {
            if (JSON.parse(String(message))?.message?.type === 'create_agent_request') creates++;
          } catch {
            // Binary protocol frames are forwarded without interpretation.
          }
          upstream.send(message);
        });
      });
      await page.goto('http://localhost:4396/zh/');
      await page.locator('[data-paseo-open]:not([data-paseo-article-open])').click();
      const input = page.locator('#root textarea:visible');
      await expect(input).toBeVisible({ timeout: 45_000 });
      const selector = page.getByTestId('combined-model-selector');
      await expect(selector).toContainText('选择模型');
      const preparation = await page.evaluate((id) => {
        return JSON.parse(localStorage.getItem(`vibes-chat-preparation-v1:${id}`) || 'null');
      }, serverId);
      expect(preparation).toMatchObject({ phase: 'ready' });
      expect(preparation.cwd.endsWith('/Vibes/Chat')).toBe(true);
      expect(preparation.cwd.startsWith(resolve('.scratch/paseo-webui/test-runs') + sep)).toBe(
        true,
      );
      expect(statSync(preparation.cwd).isDirectory()).toBe(true);
      expect(creates).toBe(0);
      await input.fill('UNSENT_WITHOUT_AUTOMATIC_PROVIDER');
      await selector.click();
      await page.getByTestId('agent-controls-model').click();
      await page.getByTestId('model-provider-mock').click();
      await page.getByTestId('model-row-mock-ten-second-stream').click();
      await page
        .getByTestId('agent-controls-model-sheet')
        .getByRole('button', { name: '关闭', exact: true })
        .click();
      await expect(selector).toContainText('Ten second stream');
      await page.locator('[data-paseo-close]').click();
      await page.locator('[data-paseo-open]:not([data-paseo-article-open])').click();
      await expect(input).toHaveValue('UNSENT_WITHOUT_AUTOMATIC_PROVIDER');
      await expect(selector).toContainText('Ten second stream');
      expect(creates).toBe(0);
    });
  });
}
