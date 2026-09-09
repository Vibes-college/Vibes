import { test, expect } from '@playwright/test';
import { withMockSession } from './mock-session.ts';

export function registerPresentationTests() {
  test('presentation changes retain the native runtime and hidden stream subscription', async ({
    browser,
  }, info) => {
    test.setTimeout(60000);
    await withMockSession(browser, info, async ({ page, open, agentId, serverId }) => {
      let sockets = 0;
      let streamFrames = 0;
      let cancellationRequests = 0;
      let heartbeat: { appVisible: boolean; focusedAgentId: string | null } | undefined;
      await page.routeWebSocket('ws://localhost:4396/ws', (socket) => {
        sockets++;
        const upstream = socket.connectToServer();
        socket.onMessage((message) => {
          let frame;
          try {
            frame = JSON.parse(String(message));
          } catch {
            /* Binary traffic is unchanged. */
          }
          if (frame?.message?.type === 'client_heartbeat') heartbeat = frame.message;
          if (frame?.message?.type === 'cancel_agent_request') cancellationRequests++;
          upstream.send(message);
        });
        upstream.onMessage((message) => {
          let frame;
          try {
            frame = JSON.parse(String(message));
          } catch {
            /* Binary traffic is unchanged. */
          }
          if (frame?.message?.type === 'agent_stream' && frame.message.payload.agentId === agentId)
            streamFrames++;
          socket.send(message);
        });
      });
      await open();
      const runtime = await page.evaluateHandle(() =>
        Reflect.get(globalThis, '__paseoHostRuntimeStore'),
      );
      const input = page.locator('#root textarea:visible');
      await input.fill('Keep streaming through presentation changes.');
      await page.getByRole('button', { name: '发送消息', exact: true }).click();
      await expect(page.getByRole('button', { name: '停止 Agent', exact: true })).toBeVisible();
      await expect.poll(() => heartbeat?.appVisible).toBe(true);
      const initialSockets = sockets;
      const beforeHidden = streamFrames;
      await page.locator('[data-paseo-close]').click();
      await expect.poll(() => heartbeat?.appVisible).toBe(false);
      await expect.poll(() => heartbeat?.focusedAgentId).toBeNull();
      await expect.poll(() => streamFrames).toBeGreaterThan(beforeHidden);
      expect(cancellationRequests).toBe(0);
      await page.locator('[data-paseo-open]:not([data-paseo-article-open])').click();
      await input.click();
      await expect.poll(() => heartbeat?.appVisible).toBe(true);
      await expect.poll(() => heartbeat?.focusedAgentId).toBe(agentId);
      expect(sockets).toBe(initialSockets);
      expect(
        await page.evaluate(
          (saved) => saved === Reflect.get(globalThis, '__paseoHostRuntimeStore'),
          runtime,
        ),
      ).toBe(true);
      // Controlled browser signal only; this does not emulate Safari suspension,
      // locking or a real phone. Both native AppState and host observers see it.
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await expect.poll(() => heartbeat?.appVisible).toBe(false);
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'visible',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await input.click();
      await expect.poll(() => heartbeat?.appVisible).toBe(true);
      await expect
        .poll(async () =>
          page.evaluate((id) => {
            const runtime = Reflect.get(globalThis, '__paseoHostRuntimeStore');
            const snapshot = runtime.getSnapshot(id);
            return (
              snapshot.connectionStatus === 'online' && snapshot.agentDirectoryStatus === 'ready'
            );
          }, serverId),
        )
        .toBe(true);
      expect(sockets).toBe(initialSockets);
      expect(cancellationRequests).toBe(0);
      expect(
        await page.evaluate(
          (saved) => saved === Reflect.get(globalThis, '__paseoHostRuntimeStore'),
          runtime,
        ),
      ).toBe(true);
      await runtime.dispose();
    });
  });
}
