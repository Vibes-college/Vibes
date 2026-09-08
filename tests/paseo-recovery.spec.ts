import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const hostUrl = process.env.PASEO_CSP_URL;
const pairingFile = process.env.PASEO_PAIRING_FILE;
if (hostUrl && !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(hostUrl))
  throw new Error('Recovery tests require the isolated local Worker.');
if (pairingFile && !resolve(pairingFile).startsWith(resolve('.scratch') + '/'))
  throw new Error('Pairing fixture must remain private under .scratch/.');
test.skip(
  !hostUrl || !pairingFile,
  'Requires the same-version isolated relay and private pairing offer.',
);
test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('history opened before connection readiness refreshes from the authoritative runtime', async ({
  browser,
}, testInfo) => {
  test.setTimeout(60000);
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = testInfo.project.use;
  const context = await browser.newContext({
    viewport,
    userAgent,
    deviceScaleFactor,
    isMobile,
    hasTouch,
  });
  let socketCount = 0;
  let release: (() => void) | undefined;
  let failure: unknown;
  // Delay only the second socket (the saved runtime connection), preserving the
  // real encrypted payloads unchanged and in memory. The first is native pairing.
  await context.routeWebSocket(/^wss:\/\/relay\.paseo\.sh\//, (socket) => {
    socketCount++;
    const server = socket.connectToServer();
    if (socketCount !== 2) return;
    let holding = true;
    const held: (string | Buffer)[] = [];
    server.onMessage((message) => {
      if (holding) held.push(message);
      else socket.send(message);
    });
    release = () => {
      holding = false;
      for (const message of held.splice(0)) socket.send(message);
    };
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  try {
    await page.goto(hostUrl + '/zh/');
    await page.locator('[data-paseo-open]').click();
    await expect(page.locator('#local-assistant')).toHaveAttribute('data-paseo-state', 'operable', {
      timeout: 30000,
    });
    await page.getByText('粘贴配对链接', { exact: true }).click();
    await page
      .getByRole('textbox', { name: '配对链接', exact: true })
      .fill(readFileSync(pairingFile!, 'utf8').trim());
    await page.getByRole('button', { name: '配对', exact: true }).click();
    await expect(page.locator('#root #menu-button')).toBeVisible();
    await page.locator('#root #menu-button').click();
    await page.getByRole('button', { name: '历史', exact: true }).click();
    await expect(page.locator('[data-testid="sessions-host-errors"]')).toBeVisible();
    expect(socketCount).toBe(2);
    expect(release).toBeDefined();
    release!();
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const runtime = (
              window as unknown as {
                __paseoHostRuntimeStore: {
                  getHosts(): { serverId: string }[];
                  getSnapshot(id: string): {
                    connectionStatus: string;
                    agentDirectoryStatus: string;
                  };
                };
              }
            ).__paseoHostRuntimeStore;
            return runtime.getHosts().every(({ serverId }) => {
              const state = runtime.getSnapshot(serverId);
              return state.connectionStatus === 'online' && state.agentDirectoryStatus === 'ready';
            });
          }),
        { timeout: 20000 },
      )
      .toBe(true);
    await expect(page.locator('[data-testid="sessions-host-errors"]')).toBeHidden();
    await expect(
      page.getByText(/^这是直接挂载界面的受控审批测试。仅在当前 compat 目录/).first(),
    ).toBeVisible();
    expect(socketCount).toBe(2);
  } catch (error) {
    failure = error;
  } finally {
    release?.();
    try {
      await context.close();
    } catch (error) {
      failure ??= error;
    }
  }
  if (failure) throw failure;
});
