import { test, expect } from '@playwright/test';
import { withMockSession } from './mock-session.ts';

export function registerMockOperationTests() {
  test('native stop and approval distinguish acknowledgement from interrupted requests', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(120000);
    await withMockSession(browser, testInfo, async ({ page, open }) => {
      let dropType: string | null = null;
      const counts: Record<string, number> = {};
      await page.routeWebSocket('ws://localhost:4396/ws', (socket) => {
        const upstream = socket.connectToServer();
        socket.onMessage((message) => {
          let type: string | undefined;
          try {
            type = JSON.parse(String(message))?.message?.type;
          } catch {
            /* Binary frames pass unchanged. */
          }
          if (type === 'cancel_agent_request' || type === 'agent_permission_response')
            counts[type] = (counts[type] || 0) + 1;
          // Drop one outbound request and close before delivery. Do not forge an acknowledgement.
          if (type && type === dropType) {
            dropType = null;
            socket.close({
              code: 1011,
              reason: 'Controlled fixture request transport interruption',
            });
            upstream.close();
            return;
          }
          upstream.send(message);
        });
        upstream.onMessage((message) => socket.send(message));
      });
      await open();
      const input = page.locator('#root textarea:visible');
      await expect(input).toBeVisible();
      const send = async (text: string) => {
        await input.fill(text);
        await page.getByRole('button', { name: '发送消息', exact: true }).click();
      };
      await send('Stream a controlled fixture for cancellation');
      const stop = page.getByRole('button', { name: '停止 Agent', exact: true });
      await expect(stop).toBeVisible();
      await page.locator('[data-paseo-close]').click();
      expect(counts.cancel_agent_request || 0).toBe(0);
      await page.locator('[data-paseo-open]:not([data-paseo-article-open])').click();
      await expect(stop).toBeVisible();
      await stop.click();
      await expect(page.getByTestId('paseo-stop-request-status')).toContainText('停止请求已获响应');
      await expect(stop).toBeHidden();
      const plan = page.getByTestId('permission-plan-card');
      await send('Emit synthetic plan approval.');
      await expect(plan).toBeVisible();
      await expect(page.getByTestId('paseo-stop-request-status')).toBeHidden();
      await page.getByRole('button', { name: 'Dismiss', exact: true }).click();
      await expect(plan).toBeHidden();
      await send('Emit synthetic plan approval.');
      await expect(plan).toBeVisible();
      await page.getByRole('button', { name: 'Implement', exact: true }).click();
      await expect(plan).toBeHidden();
      await send('Emit synthetic plan approval.');
      await expect(plan).toBeVisible();
      const permissionCount = counts.agent_permission_response;
      dropType = 'agent_permission_response';
      await page.getByRole('button', { name: 'Implement', exact: true }).click();
      await expect(page.getByTestId('paseo-permission-request-status')).toContainText('结果未知', {
        timeout: 20000,
      });
      await expect(plan).toBeVisible();
      // Observe the native reconnect window; this is not a performance sample.
      await page.waitForTimeout(2000);
      expect(counts.agent_permission_response).toBe(permissionCount + 1);
      await page.getByRole('button', { name: 'Dismiss', exact: true }).click();
      await expect(plan).toBeHidden();
      await send('Stream the cancellation transport fixture');
      await expect(stop).toBeVisible();
      const stopCount = counts.cancel_agent_request;
      dropType = 'cancel_agent_request';
      await stop.click();
      await expect(page.getByTestId('paseo-stop-request-status')).toContainText('结果未知', {
        timeout: 20000,
      });
      await page.waitForTimeout(2000);
      expect(counts.cancel_agent_request).toBe(stopCount + 1);
      await expect(stop).toBeHidden({ timeout: 30000 });
      await send('Emit synthetic turn failure.');
      await expect(
        page.getByText('Requested mock provider failure', { exact: false }).first(),
      ).toBeVisible();
    });
  });
}
