import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type TestInfo,
} from '@playwright/test';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
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
  // Fixed SDK returns response.payload; text is present on user/assistant items,
  // while tool and other timeline items share only the type discriminator.
  fetchAgentTimeline(
    agentId: string,
    options?: { direction?: 'tail'; limit?: number },
  ): Promise<{ entries: { item: { type: string; text?: string } }[] }>;
  cancelAgent(id: string): Promise<void>;
  captureTerminal(id: string, options?: { stripAnsi?: boolean }): Promise<{ lines: string[] }>;
  archiveAgent(id: string): Promise<unknown>;
  archiveWorkspace(id: string): Promise<{ archivedAt: string | null; error: string | null }>;
  listTerminals(
    cwd?: string,
    requestId?: string,
    options?: { workspaceId?: string },
  ): Promise<{ terminals: { id: string }[] }>;
  killTerminal(id: string): Promise<{ success: boolean }>;
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
  options: { persistentProfile?: boolean } = {},
) {
  const response = await fetch('http://localhost:4396/__paseo-fixture');
  if (!response.ok) throw new Error('Owned protocol fixture is unavailable.');
  const { serverId, providers } = (await response.json()) as {
    serverId: string;
    providers: string;
  };
  expect(providers).toBe('mock-only');
  const sdk = await import(
    pathToFileURL(resolve('.scratch/paseo-webui/upstream/packages/client/dist/daemon-client.js'))
      .href
  );
  const client: FixtureClient = new sdk.DaemonClient({
    url: 'ws://127.0.0.1:6796/ws',
    clientId: 'vibes-fixture-' + randomUUID(),
    clientType: 'cli',
    appVersion: '0.7.2',
  });
  const root = resolve('.scratch/paseo-webui/mock-operation-fixtures');
  mkdirSync(root, { recursive: true });
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = info.project.use;
  const connectionId = 'direct:127.0.0.1:4396';
  const now = new Date().toISOString();
  const contextOptions = {
    viewport,
    userAgent,
    deviceScaleFactor,
    isMobile,
    hasTouch,
  };
  // Seed one returning-browser state. Reloads, forgetting a device and child
  // frames must use actual browser persistence, never an init script reseed.
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:4396',
        localStorage: [
          { name: 'vibes:paseo:setup-dismissed', value: '1' },
          {
            name: '@paseo:daemon-registry',
            value: JSON.stringify([
              {
                serverId,
                label: 'Mock operation fixture',
                connections: [{ id: connectionId, type: 'directTcp', endpoint: '127.0.0.1:4396' }],
                preferredConnectionId: connectionId,
                createdAt: now,
                updatedAt: now,
              },
            ]),
          },
        ],
      },
    ],
  };
  const profile = options.persistentProfile ? mkdtempSync(root + '/browser-profile-') : undefined;
  let context: BrowserContext | undefined;
  const agents: string[] = [];
  const workspaces: string[] = [];
  const directories: string[] = [];
  let failure: unknown;
  try {
    if (profile) {
      // WebKit's ephemeral contexts cannot persist Blob/File values in IndexedDB.
      // Opt-in cases use a fresh normal profile, never a user's browser profile.
      context = await browser.browserType().launchPersistentContext(profile, contextOptions);
      await context.setStorageState(storageState);
    } else {
      context = await browser.newContext({ ...contextOptions, storageState });
    }
    await client.connect();
    const createSession = async (
      options: { model?: string; featureValues?: Record<string, unknown> } = {},
    ): Promise<MockSession> => {
      const cwd = mkdtempSync(root + '/run-');
      directories.push(cwd);
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
    const open = async (selected = session) => {
      if (page.url() === 'about:blank') {
        await page.goto('http://localhost:4396/zh/');
        await page.locator('[data-paseo-open]:not([data-paseo-article-open])').click();
      }
      if (await page.locator('[data-paseo-expand]').isVisible())
        await page.locator('[data-paseo-expand]').click();
      await page.getByTestId('menu-button').waitFor({ timeout: 45000 });
      if ((await page.getByTestId('menu-button').getAttribute('aria-expanded')) !== 'true')
        await page.getByTestId('menu-button').click();
      await page.getByRole('button', { name: '历史', exact: true }).click();
      await page.getByTestId(`agent-row-${serverId}-${selected.agentId}`).click();
      await expect(page.locator('#root textarea:visible')).toBeVisible();
      await page.locator('[data-paseo-compact]').click();
    };
    await body({ ...session, page, client, serverId, createSession, open });
  } catch (error) {
    failure = error;
  } finally {
    const cleanups = [
      () => context?.close(),
      () => {
        if (profile) rmSync(profile, { recursive: true, force: true });
      },
      ...agents.map((id) => () => client.cancelAgent(id)),
      ...agents.map((id) => () => client.archiveAgent(id)),
      ...directories.map((cwd) => async () => {
        // Every directory is created by this fixture; never inspect or kill unrelated terminals.
        const { terminals } = await client.listTerminals(cwd);
        for (const terminal of terminals) {
          const result = await client.killTerminal(terminal.id);
          if (!result.success) throw new Error('Fixture terminal cleanup failed: ' + terminal.id);
        }
      }),
      ...workspaces.map((id) => async () => {
        const result = await client.archiveWorkspace(id);
        if (result.error || !result.archivedAt)
          throw new Error(result.error || 'Fixture workspace cleanup failed: ' + id);
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
