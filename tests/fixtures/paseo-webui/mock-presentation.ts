import { test, expect, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMockSession } from './mock-session.ts';

async function checkNativeMobileFiles(page: Page) {
  await expect(page.getByTestId('workspace-new-tab-button')).toBeHidden();
  await page.getByTestId('sidebar-files').click();
  await expect(page.getByTestId('explorer-header')).toBeVisible();
  await expect(page.getByTestId('sidebar-files-tree')).toHaveCount(0);
  await expect(page.getByTestId('menu-button')).toHaveAttribute('aria-expanded', 'false');
  const root = await page.locator('#root').boundingBox();
  const header = await page.getByTestId('explorer-header').boundingBox();
  const content = await page.getByTestId('explorer-content-area').boundingBox();
  expect(root && header && content).toBeTruthy();
  expect(Math.abs(header!.width - root!.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(content!.y + content!.height - (root!.y + root!.height))).toBeLessThanOrEqual(2);
  expect(content!.height).toBeGreaterThan(root!.height * 0.7);
  await page.getByTestId('explorer-close').click();
  await expect(page.getByTestId('explorer-header')).toBeHidden();
  await page.getByTestId('menu-button').click();
  await page.getByTestId('sidebar-files').click();
  await page.getByText('panel-regression.txt', { exact: true }).click();
  await expect(page.getByTestId('workspace-file-pane')).toBeVisible();
  await expect(page.locator('[contenteditable=true]:visible')).toContainText(
    'FILES_NAVIGATION_PROBE',
  );
  await expect(page.getByTestId('explorer-header')).toBeHidden();
}

export function registerPresentationTests() {
  test('narrow full menu opens native new workspace and preserves the current draft', async ({
    browser,
  }, info) => {
    test.setTimeout(60000);
    await withMockSession(browser, info, async ({ page, open }) => {
      if (!info.project.use.isMobile) await page.setViewportSize({ width: 600, height: 800 });
      await open();
      const input = page.locator('#root textarea:visible');
      await input.fill('UNSENT_NEW_WORKSPACE_NAVIGATION_DRAFT');
      await page.locator('[data-paseo-expand]').click();
      if ((await page.getByTestId('menu-button').getAttribute('aria-expanded')) !== 'true')
        await page.getByTestId('menu-button').click();
      await page.getByTestId('sidebar-global-new-workspace').click();
      await expect(
        page.getByRole('button', { name: 'Workspace project', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: '创建', exact: true })).toBeVisible();
      await expect(page.getByTestId('menu-button')).toHaveAttribute('aria-expanded', 'false');
      await page.locator('[data-paseo-compact]').click();
      await expect(input).toHaveValue('UNSENT_NEW_WORKSPACE_NAVIGATION_DRAFT');
    });
  });

  test('compact uses one toolbar and voice-first input while full keeps native navigation', async ({
    browser,
  }, info) => {
    test.setTimeout(90000);
    await withMockSession(browser, info, async ({ page, open, cwd, serverId, workspaceId }) => {
      writeFileSync(resolve(cwd, 'panel-regression.txt'), 'FILES_NAVIGATION_PROBE');
      await open();
      const toolbar = page.locator('.paseo-toolbar');
      const workspace = page.getByTestId(`workspace-deck-entry-${serverId}:${workspaceId}`);
      await expect(workspace).toBeVisible();
      // Native decks keep inactive projects mounted; assert the selected workspace's composer.
      const microphone = workspace.getByTestId('paseo-compact-dictation-start');
      const input = workspace.locator('textarea:visible');
      await expect(toolbar.getByRole('button')).toHaveCount(3);
      await expect(page.getByTestId('embedded-new-conversation')).toBeVisible();
      await expect(page.getByTestId('menu-button')).toBeHidden();
      await expect(page.getByTestId('workspace-tabs-row')).toBeHidden();
      await expect(microphone).toBeVisible();
      await expect(page.getByRole('button', { name: '启用语音模式', exact: true })).toBeHidden();
      await input.click();
      await expect(microphone).toBeVisible();
      if (info.project.use.hasTouch) {
        expect(
          await input.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)),
        ).toBeGreaterThanOrEqual(16);
      }
      await input.fill('UNSENT_COMPACT_DRAFT');
      await expect(page.getByRole('button', { name: '发送消息', exact: true })).toBeVisible();
      await expect(microphone).toBeHidden();
      await input.fill('');
      await expect(microphone).toBeVisible();
      await page.locator('.paseo-toolbar').click({ position: { x: 100, y: 20 } });
      await expect(microphone).toBeVisible();
      await input.fill('UNSENT_COMPACT_DRAFT');
      await page.locator('[data-paseo-expand]').click();
      await expect(toolbar.getByRole('button')).toHaveCount(3);
      await expect(page.getByTestId('embedded-new-conversation')).toBeHidden();
      await expect(page.getByTestId('menu-button')).toBeVisible();
      await expect(page.getByRole('button', { name: '启用语音模式', exact: true })).toBeHidden();
      await expect(
        page.locator('[data-testid="workspace-tabs-row"]:visible').first(),
      ).toBeVisible();
      if ((await page.getByTestId('menu-button').getAttribute('aria-expanded')) !== 'true')
        await page.getByTestId('menu-button').click();
      if (info.project.use.isMobile) {
        await expect(page.getByTestId('sidebar-files')).toBeVisible();
        await expect(page.getByTestId('embedded-explorer-toggle')).toBeHidden();
        await checkNativeMobileFiles(page);
      } else {
        await expect(page.getByTestId('sidebar-files')).toBeHidden();
        await expect(page.getByTestId('embedded-explorer-toggle')).toBeVisible();
        const viewport = page.viewportSize()!;
        // A narrow desktop window follows the same native drawer layout as a phone.
        await page.setViewportSize({ width: 600, height: viewport.height });
        await expect(page.getByTestId('workspace-tab-switcher-trigger')).toBeVisible();
        await expect(page.getByTestId('embedded-explorer-toggle')).toBeHidden();
        if ((await page.getByTestId('menu-button').getAttribute('aria-expanded')) !== 'true')
          await page.getByTestId('menu-button').click();
        await expect(page.getByTestId('sidebar-files')).toBeVisible();
        await expect(page.getByTestId('embedded-explorer-toggle')).toBeHidden();
        await checkNativeMobileFiles(page);
        await page.setViewportSize(viewport);
      }
      await page.locator('[data-paseo-compact]').click();
      await expect(input).toHaveValue('UNSENT_COMPACT_DRAFT');
      if (info.project.use.hasTouch) await expect(input).not.toBeFocused();
      await page.getByTestId('embedded-new-conversation').click();
      await expect(input).toHaveValue('');
      await expect(microphone).toBeVisible();
    });
  });

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
