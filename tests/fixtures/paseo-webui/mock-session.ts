import { test, expect, type Browser, type Page, type TestInfo } from '@playwright/test';
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
  fetchAgent(id: string): Promise<{
    agent: { id: string; model: string; cwd: string; workspaceId: string; status: string };
  } | null>;
  cancelAgent(id: string): Promise<void>;
  archiveAgent(id: string): Promise<unknown>;
  archiveWorkspace(id: string): Promise<unknown>;
}
export interface MockSession {
  agentId: string;
  workspaceId: string;
  cwd: string;
  title: string;
}
export interface MockFixture extends MockSession {
  page: Page;
  client: FixtureClient;
  serverId: string;
  createSession(options?: {
    model?: string;
    featureValues?: Record<string, unknown>;
  }): Promise<MockSession>;
  open(session?: MockSession): Promise<void>;
}

/** Real fixed-version mock-provider protocol; no credentials or real provider calls. */
export async function withMockSession(
  browser: Browser,
  info: TestInfo,
  body: (fixture: MockFixture) => Promise<void>,
) {
  test.skip(
    process.env.PASEO_MOCK_URL !== 'http://localhost:4393',
    'Requires the isolated mock-only daemon and same-origin protocol fixture host.',
  );
  const home = resolve('.scratch/paseo-webui/mock-daemon-home');
  const config = JSON.parse(readFileSync(resolve(home, 'config.json'), 'utf8'));
  for (const provider of ['claude', 'codex', 'copilot', 'opencode', 'pi', 'omp'])
    expect(config.agents.providers[provider].enabled).toBe(false);
  const sdk = await import(
    pathToFileURL(resolve('.scratch/paseo-webui/upstream/packages/client/dist/daemon-client.js'))
      .href
  );
  const client: FixtureClient = new sdk.DaemonClient({
    url: 'ws://127.0.0.1:6793/ws',
    clientId: 'vibes-fixture-' + randomUUID(),
    clientType: 'cli',
    appVersion: '0.7.2',
  });
  const root = resolve('.scratch/paseo-webui/mock-operation-fixtures');
  mkdirSync(root, { recursive: true });
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = info.project.use;
  const context = await browser.newContext({
    viewport,
    userAgent,
    deviceScaleFactor,
    isMobile,
    hasTouch,
  });
  const agents: string[] = [];
  const workspaces: string[] = [];
  let failure: unknown;
  try {
    await client.connect();
    const createSession = async (
      options: { model?: string; featureValues?: Record<string, unknown> } = {},
    ): Promise<MockSession> => {
      const cwd = mkdtempSync(root + '/run-');
      // Native directory discovery must stop here rather than reaching the parent checkout.
      execFileSync('git', ['init'], { cwd, stdio: 'ignore' });
      const created = await client.createWorkspace({ source: { kind: 'directory', path: cwd } });
      if (!created.workspace) throw new Error(created.error || 'Fixture workspace creation failed');
      const workspaceId = created.workspace.id;
      workspaces.push(workspaceId);
      const title = 'VIBES_FIXTURE_' + randomUUID().slice(0, 8);
      const agent = await client.createAgent({
        provider: 'mock',
        model: options.model || 'ten-second-stream',
        featureValues: options.featureValues,
        modeId: 'load-test',
        cwd,
        workspaceId,
        title,
      });
      agents.push(agent.id);
      return { agentId: agent.id, workspaceId, cwd, title };
    };
    const session = await createSession();
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const serverId = readFileSync(resolve(home, 'server-id'), 'utf8').trim();
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
      { serverId },
    );
    const open = async (selected = session) => {
      if (page.url() === 'about:blank') {
        await page.goto('http://localhost:4393/zh/');
        await page.locator('[data-paseo-open]').click();
      }
      await page.locator('#root #menu-button:visible').first().waitFor({ timeout: 45000 });
      await page.locator('#root #menu-button:visible').first().click();
      await page.getByRole('button', { name: '历史', exact: true }).click();
      await page.getByTestId(`agent-row-${serverId}-${selected.agentId}`).click();
      await expect(page.locator('#root textarea:visible')).toBeVisible();
    };
    await body({ ...session, page, client, serverId, createSession, open });
  } catch (error) {
    failure = error;
  } finally {
    const cleanups = [
      () => context.close(),
      ...agents.map((id) => async () => {
        await client.cancelAgent(id);
        await client.archiveAgent(id);
      }),
      ...workspaces.map((id) => async () => {
        await client.archiveWorkspace(id);
      }),
      () => client.close(),
    ];
    for (const cleanup of cleanups) {
      try {
        await cleanup();
      } catch (error) {
        failure ??= error;
      }
    }
  }
  if (failure) throw failure;
}
