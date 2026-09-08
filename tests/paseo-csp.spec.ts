import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
const cspUrl = process.env.PASEO_CSP_URL;
const pairingFile = process.env.PASEO_PAIRING_FILE;
const relayLog = process.env.PASEO_RELAY_LOG;
if (cspUrl && !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(cspUrl))
  throw new Error('CSP experiment must use a local Worker.');
if (pairingFile && !resolve(pairingFile).startsWith(resolve('.scratch') + '/'))
  throw new Error('Pairing fixture must remain private under .scratch/.');
if (relayLog && !resolve(relayLog).startsWith(resolve('.scratch') + '/'))
  throw new Error('Relay log must belong to the private local experiment.');
function activeRelayChannels() {
  const active = new Set<string>();
  for (const line of readFileSync(relayLog!, 'utf8').split('\n')) {
    try {
      const row = JSON.parse(line);
      if (typeof row.connectionId !== 'string') continue;
      if (row.msg === 'relay_data_connected') active.add(row.connectionId);
      if (row.msg === 'relay_data_disconnected') active.delete(row.connectionId);
    } catch {
      /* Incomplete trailing log writes are retried by the poll. */
    }
  }
  return active;
}
test.skip(
  !cspUrl || !pairingFile || !relayLog,
  'Requires a local H Worker and private pairing offer for the isolated same-version daemon.',
);
// Pairing inputs must never appear in trace, screenshot-on-failure or error-context artifacts.
// The manually owned context is closed in finally before the test runner records failure.
test.use({ trace: 'off', screenshot: 'off', video: 'off' });
test('real relay pairing, restored history and least-privilege CSP survive navigation and refresh', async ({
  browser,
}, testInfo) => {
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
  let primaryFailure: unknown;
  const sockets = new Set<object>();
  const baselineChannels = activeRelayChannels();
  let createdSockets = 0;
  const origins = new Set<string>();
  const responses: { path: string; status: number; mime: string; cache: string }[] = [];
  let cspErrors = 0;
  page.on('websocket', (socket) => {
    sockets.add(socket);
    createdSockets++;
    origins.add(new URL(socket.url()).origin);
    socket.on('close', () => sockets.delete(socket));
  });
  page.on('console', (message) => {
    if (/Content Security Policy|Content-Security-Policy/i.test(message.text())) cspErrors++;
  });
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname;
    if (path.startsWith('/vendor/paseo/'))
      responses.push({
        path,
        status: response.status(),
        mime: response.headers()['content-type'] || '',
        cache: response.headers()['cache-control'] || '',
      });
  });
  try {
    const response = await page.goto(cspUrl + '/zh/');
    expect(response?.headers()['content-security-policy']).toContain(
      "connect-src 'self' wss://relay.paseo.sh;",
    );
    expect(sockets.size).toBe(0);
    expect(responses.length).toBe(0);
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
    try {
      await page
        .getByText(/^这是直接挂载界面的受控审批测试。仅在当前 compat 目录/)
        .first()
        .click();
    } catch (error) {
      // Pairing has completed and its form is gone; retain only the history UI.
      await page.screenshot({
        path: resolve(
          'resources/evidence/012-paseo-webui-loading/host',
          `history-${testInfo.project.name}.png`,
        ),
      });
      const state = await page.evaluate(() => {
        const runtime = (
          window as unknown as {
            __paseoHostRuntimeStore: {
              getHosts(): { serverId: string }[];
              getSnapshot(id: string): {
                connectionStatus: string;
                agentDirectoryStatus: string;
                hasEverLoadedAgentDirectory: boolean;
                clientGeneration: number;
                connectionEpoch: number;
                lastError: string | null;
              } | null;
            };
          }
        ).__paseoHostRuntimeStore;
        return runtime.getHosts().map(({ serverId }) => {
          const snapshot = runtime.getSnapshot(serverId);
          return (
            snapshot && {
              connectionStatus: snapshot.connectionStatus,
              agentDirectoryStatus: snapshot.agentDirectoryStatus,
              hasEverLoadedAgentDirectory: snapshot.hasEverLoadedAgentDirectory,
              clientGeneration: snapshot.clientGeneration,
              connectionEpoch: snapshot.connectionEpoch,
              errorCategories: ['timeout', 'closed', 'abort', 'network', 'handshake'].filter(
                (word) => snapshot.lastError?.toLowerCase().includes(word),
              ),
            }
          );
        });
      });
      writeFileSync(
        resolve(
          'resources/evidence/012-paseo-webui-loading/host',
          `history-${testInfo.project.name}.json`,
        ),
        JSON.stringify({ state, createdSockets, observedSockets: sockets.size }, null, 2),
      );
      throw error;
    }
    await expect(page.locator('#root').getByText('PASEO_RELAY_OK', { exact: true })).toBeVisible({
      timeout: 30000,
    });
    expect([...origins]).toEqual(['wss://relay.paseo.sh']);
    await expect.poll(() => sockets.size).toBe(1);
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    await page.locator('[data-paseo-close]').click();
    await page.getByRole('link', { name: 'English', exact: true }).click();
    await expect(page).toHaveURL(/\/en\/$/);
    await page.locator('[data-paseo-open]').click();
    await expect(page.locator('#root').getByText('PASEO_RELAY_OK', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
    expect(sockets.size).toBe(1);
    const ownedChannels = [...activeRelayChannels()].filter((id) => !baselineChannels.has(id));
    expect(ownedChannels.length).toBe(1);
    const createdBeforeReload = createdSockets;
    await page.reload();
    await expect(page.locator('#local-assistant')).toBeHidden();
    // Chromium may discard the old document without emitting WebSocket.close to
    // Playwright. Require the corresponding daemon-side channels to close instead.
    await expect.poll(() => ownedChannels.some((id) => activeRelayChannels().has(id))).toBe(false);
    expect(createdSockets).toBe(createdBeforeReload);
    sockets.clear();
    await page.locator('[data-paseo-open]').click();
    await expect(page.locator('#root').getByText('PASEO_RELAY_OK', { exact: true })).toBeVisible({
      timeout: 30000,
    });
    expect(cspErrors).toBe(0);
    for (const resource of responses) {
      expect(resource.status).toBe(200);
      expect(resource.mime).toMatch(
        resource.path.endsWith('.css') ? /text\/css/ : /(?:text|application)\/javascript/,
      );
      expect(resource.cache).toContain('immutable');
    }
    expect(responses.some((resource) => resource.path.endsWith('.css'))).toBe(true);
    const denied = await page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          let socket: WebSocket | undefined;
          const listener = (event: SecurityPolicyViolationEvent) => {
            if (
              event.violatedDirective === 'connect-src' &&
              event.blockedURI.includes('blocked.invalid')
            )
              finish(true);
          };
          const finish = (value: boolean) => {
            clearTimeout(timer);
            document.removeEventListener('securitypolicyviolation', listener);
            socket?.close();
            resolve(value);
          };
          const timer = setTimeout(() => finish(false), 1000);
          document.addEventListener('securitypolicyviolation', listener);
          try {
            socket = new WebSocket('wss://blocked.invalid/ws');
            socket.onerror = () => {};
          } catch {
            // CSP may throw synchronously; the violation event remains the assertion.
          }
        }),
    );
    expect(denied).toBe(true);
    const directory = resolve('resources/evidence/012-paseo-webui-loading/host/relay');
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      join(directory, testInfo.project.name + '.json'),
      JSON.stringify(
        {
          recordedAt: new Date().toISOString(),
          viewport: page.viewportSize(),
          isMobile: Boolean(isMobile),
          origins: [...origins],
          responses,
          blockedUnlistedOrigin: denied,
          restoredMarker: true,
          daemonConfirmedOldChannelClosed: true,
          scope: 'Local H Worker, existing controlled relay session; not the full recovery matrix',
        },
        null,
        2,
      ),
    );
  } catch (error) {
    primaryFailure = error;
  } finally {
    try {
      await context.close();
    } catch (error) {
      // Preserve the original timeout/action failure if the runner already disposed it.
      primaryFailure ??= error;
    }
  }
  if (primaryFailure) throw primaryFailure;
});
