import { test, expect } from '@playwright/test';
import { readFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

interface FixtureClient {
  connect(): Promise<void>;
  close(): Promise<void>;
  createWorkspace(input: unknown): Promise<{ workspace: { id: string } | null; error?: string }>;
  createAgent(input: unknown): Promise<{ id: string }>;
  cancelAgent(id: string): Promise<void>;
  archiveAgent(id: string): Promise<unknown>;
  archiveWorkspace(id: string): Promise<unknown>;
}

export function registerMockOperationTests() {
  test('native stop and approval distinguish acknowledgement from interrupted requests', async ({
    browser,
  }, testInfo) => {
    test.skip(
      process.env.PASEO_MOCK_URL !== 'http://localhost:4393',
      'Requires the isolated mock-only daemon and same-origin protocol fixture host.',
    );
    test.setTimeout(120000);
    const home = resolve('.scratch/paseo-webui/mock-daemon-home');
    const config = JSON.parse(readFileSync(resolve(home, 'config.json'), 'utf8'));
    for (const provider of ['claude', 'codex', 'copilot', 'opencode', 'pi', 'omp'])
      expect(config.agents.providers[provider].enabled).toBe(false);
    // The SDK comes only from the fixed, already approved isolated source build.
    const sdk = await import(
      pathToFileURL(resolve('.scratch/paseo-webui/upstream/packages/client/dist/daemon-client.js'))
        .href
    );
    const client: FixtureClient = new sdk.DaemonClient({
      url: 'ws://127.0.0.1:6793/ws',
      clientId: 'vibes-operations-' + randomUUID(),
      clientType: 'cli',
      appVersion: '0.7.2',
    });
    const root = resolve('.scratch/paseo-webui/mock-operation-fixtures');
    mkdirSync(root, { recursive: true });
    const cwd = mkdtempSync(root + '/run-');
    // A repository boundary prevents native project discovery from reaching the parent checkout.
    execFileSync('git', ['init'], { cwd, stdio: 'ignore' });
    const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = testInfo.project.use;
    const context = await browser.newContext({
      viewport,
      userAgent,
      deviceScaleFactor,
      isMobile,
      hasTouch,
    });
    let failure: unknown;
    let agentId: string | undefined;
    let workspaceId: string | undefined;
    try {
      await client.connect();
      const created = await client.createWorkspace({ source: { kind: 'directory', path: cwd } });
      if (!created.workspace) throw new Error(created.error || 'Fixture workspace creation failed');
      workspaceId = created.workspace.id;
      const title = 'VIBES_OPERATION_' + randomUUID().slice(0, 8);
      const agent = await client.createAgent({
        provider: 'mock',
        model: 'ten-second-stream',
        modeId: 'load-test',
        cwd,
        workspaceId,
        title,
      });
      agentId = agent.id;
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      let dropType: string | null = null;
      const counts: Record<string, number> = {};
      await page.routeWebSocket('ws://localhost:4393/ws', (socket) => {
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
      await page.addInitScript(
        ({ serverId }) => {
          const id = 'direct:127.0.0.1:4393',
            now = new Date().toISOString();
          localStorage.setItem(
            '@paseo:daemon-registry',
            JSON.stringify([
              {
                serverId,
                label: 'Mock operation fixture',
                connections: [{ id, type: 'directTcp', endpoint: '127.0.0.1:4393' }],
                preferredConnectionId: id,
                createdAt: now,
                updatedAt: now,
              },
            ]),
          );
        },
        { serverId: readFileSync(resolve(home, 'server-id'), 'utf8').trim() },
      );
      await page.goto('http://localhost:4393/zh/');
      await page.locator('[data-paseo-open]').click();
      await page.locator('#root #menu-button').waitFor({ timeout: 45000 });
      await page.locator('#root #menu-button').click();
      await page.getByRole('button', { name: '历史', exact: true }).click();
      await page.getByText(title, { exact: true }).click();
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
      await page.locator('[data-paseo-open]').click();
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
    } catch (error) {
      failure = error;
    } finally {
      for (const cleanup of [
        () => context.close(),
        async () => {
          if (agentId) {
            await client.cancelAgent(agentId);
            await client.archiveAgent(agentId);
          }
        },
        async () => {
          if (workspaceId) await client.archiveWorkspace(workspaceId);
        },
        () => client.close(),
      ]) {
        try {
          await cleanup();
        } catch (error) {
          failure ??= error;
        }
      }
    }
    if (failure) throw failure;
  });
}
