import { test, expect, type Page, type TestInfo } from '@playwright/test';
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMockSession } from './fixtures/paseo-webui/mock-session.ts';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('terminal hidden state is retained and document exit preserves the remote process', async ({
  browser,
}, info) => {
  test.skip(
    !['A2', 'A3', 'A4'].includes(process.env.PASEO_MOCK_PROFILE || ''),
    'Requires an A2/A3/A4 production fixture host.',
  );
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
    const terminalInput = page.locator('.xterm-helper-textarea');
    await terminalInput.pressSequentially("printf 'PASEO_RESOURCE_OK\\n'");
    await terminalInput.press('Enter');
    await expect
      .poll(async () =>
        (await client.captureTerminal(id, { stripAnsi: true })).lines.some(
          (line) => line.trim() === 'PASEO_RESOURCE_OK',
        ),
      )
      .toBe(true);
    await captureTerminalPixels(page, info, 'before');
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
    await expect
      .poll(async () =>
        (await client.captureTerminal(id, { stripAnsi: true })).lines.some(
          (line) => line.trim() === 'PASEO_RESOURCE_OK',
        ),
      )
      .toBe(true);
    await captureTerminalPixels(page, info, 'after');
    await info.attach('terminal-resource-lifecycle', {
      body: JSON.stringify({ messages }),
      contentType: 'application/json',
    });
  });
});

test('unsaved file content and caret survive hidden and switched workspace views', async ({
  browser,
}, info) => {
  test.skip(
    !['A2', 'A3', 'A4'].includes(process.env.PASEO_MOCK_PROFILE || ''),
    'Requires an A2/A3/A4 production fixture host.',
  );
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

test('editor renderer unmount preserves the draft, caret and scroll position', async ({
  browser,
}, info) => {
  test.skip(
    !['A2', 'A3', 'A4'].includes(process.env.PASEO_MOCK_PROFILE || ''),
    'Requires an A2/A3/A4 production fixture host.',
  );
  test.setTimeout(90000);
  await withMockSession(browser, info, async ({ page, open, cwd }) => {
    const original = '# Original document\n';
    writeFileSync(resolve(cwd, 'fixture.md'), original);
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
    await page.getByRole('button', { name: '打开侧边面板', exact: true }).click();
    await page.getByText('文件', { exact: true }).click();
    await page.getByText('fixture.md', { exact: true }).click();
    await page.getByTestId('file-mode-source').click();
    const editor = page.locator('[contenteditable=true]:visible');
    await expect(editor).toContainText('Original document');
    const draft = Array.from({ length: 80 }, (_, i) => `Unsaved fixture line ${i + 1}`).join('\n');
    await editor.fill(draft);
    await editor.press('ControlOrMeta+Home');
    for (let i = 0; i < 44; i++) await editor.press('ArrowDown');
    await expect(page.getByLabel('第 45 行，第 1 列', { exact: true })).toBeVisible();
    await expect.poll(() => writes).toBeGreaterThan(0);
    const scroller = page.locator('.cm-scroller:visible');
    await expect.poll(() => scroller.evaluate((n) => n.scrollTop)).toBeGreaterThan(0);
    const before = await scroller.evaluate((n) => n.scrollTop);
    const originalNode = await page.getByTestId('file-source-editor').elementHandle();
    await page.getByTestId('file-mode-preview').click();
    await expect(page.getByTestId('file-source-editor')).toHaveCount(0);
    expect(await originalNode!.evaluate((n) => n.isConnected)).toBe(false);
    await page.getByTestId('file-mode-source').click();
    await expect(editor).toContainText('Unsaved fixture line 45');
    await expect(page.getByLabel('第 45 行，第 1 列', { exact: true })).toBeVisible();
    await expect
      .poll(async () => Math.abs((await scroller.evaluate((n) => n.scrollTop)) - before))
      .toBeLessThanOrEqual(2);
    expect(readFileSync(resolve(cwd, 'fixture.md'), 'utf8')).toBe(original);
    await info.attach('editor-renderer-unmount', {
      body: JSON.stringify({ before, writes }),
      contentType: 'application/json',
    });
  });
});

async function captureTerminalPixels(page: Page, info: TestInfo, phase: string) {
  const surface = page.getByTestId('terminal-surface');
  const pixels = await surface
    .locator('canvas')
    .first()
    .evaluate(
      (canvas) =>
        new Promise<{ cssWidth: number; deviceWidth: number | null; dpr: number }>((resolve) => {
          const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            resolve({
              cssWidth: entry.contentRect.width,
              deviceWidth: entry.devicePixelContentBoxSize?.[0]?.inlineSize ?? null,
              dpr: devicePixelRatio,
            });
            observer.disconnect();
          });
          observer.observe(canvas);
        }),
    );
  if (pixels.deviceWidth !== null)
    expect(pixels.deviceWidth).toBeCloseTo(pixels.cssWidth * pixels.dpr, 0);
  const path = resolve(
    'resources/evidence/012-paseo-webui-loading/probe-mermaid',
    `${process.env.PASEO_MOCK_PROFILE!.toLowerCase()}-terminal-${phase}-${info.project.name}.png`,
  );
  // Daemon output alone cannot prove that the GPU painted it. The first text
  // rows must have visible contrast; a blank terminal used to pass this test.
  await expect
    .poll(async () => {
      const buffer = await surface.screenshot();
      writeFileSync(path, buffer);
      const metadata = await sharp(buffer).metadata();
      const stats = await sharp(buffer)
        .extract({
          left: 0,
          top: 0,
          width: metadata.width!,
          height: Math.min(metadata.height!, Math.round(60 * pixels.dpr)),
        })
        .stats();
      return Math.max(...stats.channels.slice(0, 3).map((channel) => channel.stdev));
    })
    .toBeGreaterThan(10);
  await info.attach(`terminal-pixel-calibration-${phase}`, {
    body: JSON.stringify(pixels),
    contentType: 'application/json',
  });
}
