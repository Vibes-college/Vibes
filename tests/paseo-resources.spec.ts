import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMockSession } from './fixtures/paseo-webui/mock-session.ts';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('terminal hidden state is retained and document exit preserves the remote process', async ({
  browser,
}, info) => {
  test.skip(process.env.PASEO_MOCK_PROFILE !== 'A2', 'Requires the A2 production fixture host.');
  test.setTimeout(90000);
  await withMockSession(browser, info, async ({ page, open, client, cwd, agentId }) => {
    const messages: { type: string; terminalId?: string }[] = [];
    page.on('websocket', (socket) =>
      socket.on('framesent', (frame) => {
        if (typeof frame.payload !== 'string') return;
        try {
          const envelope = JSON.parse(frame.payload);
          const message = envelope.message ?? envelope;
          if (
            [
              'subscribe_terminal_request',
              'unsubscribe_terminal_request',
              'kill_terminal_request',
            ].includes(message.type)
          )
            messages.push({ type: message.type, terminalId: message.terminalId });
        } catch {
          /* Binary terminal output is not part of this request inventory. */
        }
      }),
    );
    await open();
    expect(messages).toEqual([]);
    await page.getByTestId('workspace-header-menu-trigger').click();
    await page.getByTestId('workspace-header-new-terminal').click();
    await expect(page.getByTestId('terminal-surface')).toBeVisible();
    await expect(page.getByTestId('terminal-attach-loading')).toBeHidden();
    const { terminals } = await client.listTerminals(cwd);
    expect(terminals).toHaveLength(1);
    const id = terminals[0].id;
    await expect
      .poll(() =>
        messages.some((m) => m.type === 'subscribe_terminal_request' && m.terminalId === id),
      )
      .toBe(true);
    await page.locator('[data-paseo-close]').click();
    await expect(page.getByTestId('terminal-surface')).toHaveCount(1);
    await expect(page.getByTestId('terminal-surface')).toBeHidden();
    // Hidden terminal retains its renderer and stream; this is not an unmount.
    expect((await client.listTerminals(cwd)).terminals.map((t) => t.id)).toContain(id);
    await page.locator('[data-paseo-open]').click();
    await expect(page.getByTestId('terminal-attach-loading')).toBeHidden();
    await expect(page.getByTestId('terminal-surface')).toBeVisible();
    await page.getByRole('button', { name: '退出并刷新', exact: true }).click();
    await expect(page.getByTestId('terminal-surface')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => Boolean(Reflect.get(globalThis, '__vibesPaseo'))))
      .toBe(false);
    expect((await client.listTerminals(cwd)).terminals.map((t) => t.id)).toContain(id);
    expect((await client.fetchAgent(agentId))?.agent.id).toBe(agentId);
    expect(messages.some((m) => m.type === 'kill_terminal_request')).toBe(false);
    await page.locator('[data-paseo-open]').click();
    await expect(page.getByTestId('terminal-surface')).toBeVisible({ timeout: 45000 });
    await expect(page.getByTestId('terminal-attach-loading')).toBeHidden();
    await info.attach('terminal-resource-lifecycle', {
      body: JSON.stringify({ messages }),
      contentType: 'application/json',
    });
  });
});

test('unsaved file content and caret survive hidden and switched workspace views', async ({
  browser,
}, info) => {
  test.skip(process.env.PASEO_MOCK_PROFILE !== 'A2', 'Requires the A2 production fixture host.');
  test.setTimeout(90000);
  await withMockSession(browser, info, async (fixture) => {
    const { page, open, createSession, cwd } = fixture;
    const other = await createSession();
    writeFileSync(resolve(cwd, 'fixture.txt'), 'Original file\nSecond line\n');
    let writes = 0;
    await page.routeWebSocket('ws://localhost:4393/ws', (socket) => {
      const upstream = socket.connectToServer();
      socket.onMessage((data) => {
        let message;
        try {
          message = JSON.parse(String(data)).message;
        } catch {
          /* Binary traffic is unchanged. */
        }
        if (message?.type === 'fs.file.write.request') {
          writes++;
          return;
        }
        upstream.send(data);
      });
      upstream.onMessage((data) => socket.send(data));
    });
    await open();
    const openFile = async () => {
      await page.getByRole('button', { name: '打开侧边面板', exact: true }).click();
      await page.getByText('文件', { exact: true }).click();
      await page.getByText('fixture.txt', { exact: true }).click();
    };
    await openFile();
    const editor = page.locator('[contenteditable=true]:visible');
    await expect(editor).toContainText('Original file');
    await editor.fill('Unsaved fixture\nCaret on second line\n');
    await editor.press('ControlOrMeta+Home');
    await editor.press('ArrowDown');
    await expect.poll(() => writes).toBeGreaterThan(0);
    await page.locator('[data-paseo-close]').click();
    await page.locator('[data-paseo-open]').click();
    await expect(editor).toContainText('Unsaved fixture');
    await expect(page.getByLabel('第 2 行，第 1 列', { exact: true })).toBeVisible();
    await open(other);
    const hiddenEditors = await page.getByTestId('file-source-editor').count();
    await info.attach('file-retention-state', {
      body: JSON.stringify({ hiddenEditors, writes }),
      contentType: 'application/json',
    });
    await open(fixture);
    await openFile();
    await expect(editor).toContainText('Unsaved fixture');
    await expect(page.getByLabel('第 2 行，第 1 列', { exact: true })).toBeVisible();
    expect(readFileSync(resolve(cwd, 'fixture.txt'), 'utf8')).toBe('Original file\nSecond line\n');
  });
});
