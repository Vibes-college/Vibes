import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMockSession } from './fixtures/paseo-webui/mock-session.ts';
import { highlightResources } from './fixtures/paseo-webui/highlight-resources.ts';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

for (const failFirst of [false, true]) {
  test(`Mermaid waits for explicit expansion and retains native isolation${failFirst ? ' after a failed chunk and retry' : ''}`, async ({
    browser,
  }, info) => {
    test.skip(
      !['A1', 'A2', 'A3', 'A4'].includes(process.env.PASEO_MOCK_PROFILE || ''),
      'Requires an A1/A2/A3/A4 production fixture host.',
    );
    test.setTimeout(90000);
    const receipt = JSON.parse(
      readFileSync(
        resolve(
          '.scratch/paseo-webui/artifacts',
          process.env.PASEO_MOCK_PROFILE!,
          'build-receipt.json',
        ),
        'utf8',
      ),
    );
    const chunks = receipt.files.filter((file: { path: string }) =>
      /\/host-[a-f0-9]+\.js$/.test(file.path),
    );
    expect(chunks).toHaveLength(1);
    const chunkPath = receipt.publicPath + '/' + chunks[0].path;
    await withMockSession(browser, info, async ({ page, createSession, open }) => {
      const session = await createSession({
        featureValues: {
          mockAssistantResponse:
            'Diagram fixture\n\n```mermaid\nflowchart LR\n  Start[Fixture start] --> Middle[Fixture middle] --> Finish[Fixture finish]\n```',
        },
      });
      const downloads: string[] = [];
      const errors: string[] = [];
      let attempts = 0;
      page.on('request', (request) => downloads.push(new URL(request.url()).pathname));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.route('**' + chunkPath, async (route) => {
        attempts++;
        if (failFirst && attempts === 1) await route.abort('failed');
        else await route.continue();
      });
      try {
        await open(session);
        expect(downloads).not.toContain(chunkPath);
        await page.locator('#root textarea:visible').fill('Render the configured diagram fixture.');
        await page.getByRole('button', { name: '发送消息', exact: true }).click();
        const expand = page.getByTestId('paseo-mermaid-expand');
        await expect(expand).toBeVisible();
        expect(downloads).not.toContain(chunkPath);
        await expect(page.getByTestId('paseo-mermaid-lazy-fence')).toContainText('Fixture start');
        await expand.click();
        if (failFirst) {
          await expect(page.getByTestId('paseo-mermaid-load-error')).toBeVisible();
          expect(attempts).toBe(1);
          await expect(expand).toBeEnabled();
          await expand.click();
        }
        const frame = page.locator('#root iframe[sandbox="allow-scripts"]').last();
        await expect(frame).toBeAttached();
        await expect(frame.contentFrame().locator('svg')).toBeVisible({ timeout: 20000 });
        expect(await frame.getAttribute('sandbox')).toBe('allow-scripts');
        expect(
          await frame
            .contentFrame()
            .locator('body')
            .evaluate(() => {
              try {
                void window.parent.document;
                return true;
              } catch {
                return false;
              }
            }),
        ).toBe(false);
        const canvas = page.getByTestId('mermaid-viewport-canvas');
        if (info.project.use.hasTouch) await canvas.tap({ position: { x: 8, y: 8 } });
        else await canvas.hover({ position: { x: 8, y: 8 } });
        const viewportBox = await page.getByTestId('mermaid-viewport').boundingBox();
        const actionBox = await page
          .getByRole('button', { name: '查看源码', exact: true })
          .boundingBox();
        expect(viewportBox).not.toBeNull();
        expect(actionBox).not.toBeNull();
        expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(
          viewportBox!.y + viewportBox!.height,
        );
        await page.getByRole('button', { name: '查看源码', exact: true }).click();
        await page.getByRole('button', { name: '查看图表', exact: true }).click();
        await expect(frame.contentFrame().locator('svg')).toBeVisible();
        expect(attempts).toBe(failFirst ? 2 : 1);
        await page.locator('[data-paseo-close]').click();
        await page.locator('[data-paseo-open]').click();
        await expect(frame.contentFrame().locator('svg')).toBeVisible();
        expect(attempts).toBe(failFirst ? 2 : 1);
        expect(errors.filter((error) => /Content Security Policy|Refused to/i.test(error))).toEqual(
          [],
        );
      } finally {
        console.log(
          JSON.stringify({ attempts, errors: errors.map((error) => error.slice(0, 1200)) }),
        );
        await info.attach('mermaid-production-requests', {
          body: JSON.stringify({ chunkPath, attempts, downloads, errors }),
          contentType: 'application/json',
        });
      }
    });
  });
}

for (const failFirst of [false, true]) {
  test(`terminal body loads on activation${failFirst ? ' with retry' : ''}`, async ({
    browser,
  }, info) => {
    test.skip(
      !['A2', 'A3', 'A4'].includes(process.env.PASEO_MOCK_PROFILE || ''),
      'Requires an A2/A3/A4 production fixture host.',
    );
    test.setTimeout(90000);
    const receipt = JSON.parse(
      readFileSync(
        resolve(
          '.scratch/paseo-webui/artifacts',
          process.env.PASEO_MOCK_PROFILE!,
          'build-receipt.json',
        ),
        'utf8',
      ),
    );
    const chunk = receipt.files.filter((file: { path: string }) =>
      /\/terminal-pane-[a-f0-9]+\.js$/.test(file.path),
    );
    expect(chunk).toHaveLength(1);
    const chunkPath = receipt.publicPath + '/' + chunk[0].path;
    await withMockSession(browser, info, async ({ page, open, client, cwd }) => {
      let attempts = 0;
      await page.route('**' + chunkPath, async (route) => {
        attempts++;
        if (failFirst && attempts === 1) await route.abort('failed');
        else await route.continue();
      });
      await open();
      expect(attempts).toBe(0);
      await page.getByTestId('workspace-header-menu-trigger').click();
      await page.getByTestId('workspace-header-new-terminal').click();
      if (failFirst) {
        await expect(page.getByTestId('paseo-lazy-terminal-retry')).toBeVisible();
        await page.getByTestId('paseo-lazy-terminal-retry').click();
      }
      await expect(page.getByTestId('terminal-surface')).toBeVisible();
      await expect(page.getByTestId('terminal-attach-loading')).toBeHidden();
      expect(attempts).toBe(failFirst ? 2 : 1);
      const before = await client.listTerminals(cwd);
      expect(before.terminals).toHaveLength(1);
      await page.locator('[data-paseo-close]').click();
      expect((await client.listTerminals(cwd)).terminals.map((terminal) => terminal.id)).toEqual(
        before.terminals.map((terminal) => terminal.id),
      );
      await page.locator('[data-paseo-open]').click();
      await expect(page.getByTestId('terminal-surface')).toBeVisible();
      expect(attempts).toBe(failFirst ? 2 : 1);
      await page.reload();
      await page.locator('[data-paseo-open]').click();
      await expect(page.getByTestId('terminal-surface')).toBeVisible({ timeout: 45000 });
      await expect(page.getByTestId('terminal-attach-loading')).toBeHidden();
      expect((await client.listTerminals(cwd)).terminals.map((terminal) => terminal.id)).toEqual(
        before.terminals.map((terminal) => terminal.id),
      );
      await info.attach('terminal-production-boundary', {
        body: JSON.stringify({ chunkPath, attempts }),
        contentType: 'application/json',
      });
    });
  });
}

for (const failFirst of [false, true]) {
  test(`file editor body loads on activation${failFirst ? ' with retry' : ''}`, async ({
    browser,
  }, info) => {
    test.skip(
      !['A2', 'A3', 'A4'].includes(process.env.PASEO_MOCK_PROFILE || ''),
      'Requires an A2/A3/A4 production fixture host.',
    );
    test.setTimeout(90000);
    const receipt = JSON.parse(
      readFileSync(
        resolve(
          '.scratch/paseo-webui/artifacts',
          process.env.PASEO_MOCK_PROFILE!,
          'build-receipt.json',
        ),
        'utf8',
      ),
    );
    const chunk = receipt.files.filter((file: { path: string }) =>
      /\/pane-[a-f0-9]+\.js$/.test(file.path),
    );
    expect(chunk).toHaveLength(1);
    const chunkPath = receipt.publicPath + '/' + chunk[0].path;
    await withMockSession(browser, info, async ({ page, open, cwd }) => {
      writeFileSync(resolve(cwd, 'fixture.txt'), 'Paseo native editor fixture\nSecond line\n');
      let attempts = 0;
      await page.route('**' + chunkPath, async (route) => {
        attempts++;
        if (failFirst && attempts === 1) await route.abort('failed');
        else await route.continue();
      });
      await open();
      expect(attempts).toBe(0);
      await page.getByRole('button', { name: '打开侧边面板', exact: true }).click();
      await page.getByText('文件', { exact: true }).click();
      await page.getByText('fixture.txt', { exact: true }).click();
      if (failFirst) {
        await expect(page.getByTestId('paseo-lazy-file-retry')).toBeVisible();
        await page.getByTestId('paseo-lazy-file-retry').click();
      }
      const editor = page.locator('[contenteditable=true]:visible');
      await expect(editor).toContainText('Paseo native editor fixture');
      expect(attempts).toBe(failFirst ? 2 : 1);
      await editor.fill('Paseo editor saved fixture\nSecond line\n');
      await expect
        .poll(() => readFileSync(resolve(cwd, 'fixture.txt'), 'utf8'))
        .toBe('Paseo editor saved fixture\nSecond line\n');
      await page.locator('[data-paseo-close]').click();
      await page.locator('[data-paseo-open]').click();
      await expect(editor).toContainText('Paseo editor saved fixture');
      expect(attempts).toBe(failFirst ? 2 : 1);
      await page.reload();
      await page.locator('[data-paseo-open]').click();
      await expect(editor).toContainText('Paseo editor saved fixture', { timeout: 45000 });
      await info.attach('file-production-boundary', {
        body: JSON.stringify({ chunkPath, attempts }),
        contentType: 'application/json',
      });
    });
  });
}

test('native assistant file deep link activates the lazy editor at its target line', async ({
  browser,
}, info) => {
  test.skip(
    !['A2', 'A3', 'A4'].includes(process.env.PASEO_MOCK_PROFILE || ''),
    'Requires an A2/A3/A4 production fixture host.',
  );
  test.setTimeout(90000);
  await withMockSession(browser, info, async ({ page, createSession, open }) => {
    const session = await createSession({
      featureValues: { mockAssistantResponse: '[Open fixture line](fixture.txt#L18)' },
    });
    writeFileSync(
      resolve(session.cwd, 'fixture.txt'),
      Array.from({ length: 30 }, (_, i) => `Fixture line ${i + 1}`).join('\n'),
    );
    await open(session);
    await page.locator('#root textarea:visible').fill('Show the configured file link.');
    await page.getByRole('button', { name: '发送消息', exact: true }).click();
    const fileLink = page.getByText('Open fixture line', { exact: true });
    if (info.project.use.hasTouch) await fileLink.tap();
    else await fileLink.click();
    await expect(page.getByTestId('workspace-file-pane')).toBeVisible();
    await expect(page.getByLabel('第 18 行，第 1 列', { exact: true })).toBeVisible();
    await expect(page.locator('[contenteditable=true]:visible')).toContainText('Fixture line 18');
  });
});

for (const failFirst of [false, true]) {
  test(`shared highlighter keeps raw code readable${failFirst ? ' through failure and retry' : ' while loading'}`, async ({
    browser,
  }, info) => {
    test.skip(
      !['A3', 'A4'].includes(process.env.PASEO_MOCK_PROFILE || ''),
      'Requires an A3/A4 production fixture host.',
    );
    test.setTimeout(90000);
    const [shared, runtime] = highlightResources();
    const code = 'const fixtureColor = 42;';
    await withMockSession(browser, info, async ({ page, open, createSession }) => {
      const session = await createSession({
        featureValues: { mockAssistantResponse: '```javascript\n' + code + '\n```' },
      });
      const downloads: string[] = [];
      page.on('request', (r) => downloads.push(new URL(r.url()).pathname));
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let attempts = 0;
      await page.route('**' + shared, async (route) => {
        attempts++;
        if (attempts === 1) {
          if (failFirst) return route.abort('failed');
          await gate;
        }
        await route.continue();
      });
      try {
        await open(session);
        expect(downloads).not.toContain(shared);
        expect(downloads).not.toContain(runtime);
        await page.locator('#root textarea:visible').fill('Return the configured code.');
        await page.getByRole('button', { name: '发送消息', exact: true }).click();
        const block = page.locator(
          '[data-paseo-markdown-tag=pre][data-paseo-markdown-language=javascript]',
        );
        const raw = block.locator('[data-paseo-markdown-tag=code]');
        await expect(raw).toHaveText(code);
        await expect.poll(() => attempts).toBe(1);
        await expect(raw.locator('span')).toHaveCount(0);
        if (failFirst) {
          await expect(page.getByTestId('paseo-highlight-error')).toBeVisible();
          await expect(raw).toHaveText(code);
          await page.getByTestId('paseo-highlight-retry').click();
        } else release();
        await expect.poll(() => raw.locator('span').count()).toBeGreaterThan(0);
        await expect(raw).toHaveText(code);
        expect(attempts).toBe(failFirst ? 2 : 1);
        await info.attach('shared-highlight-loading', {
          body: JSON.stringify({ shared, runtime, attempts, downloads }),
          contentType: 'application/json',
        });
      } finally {
        release();
      }
    });
  });
}
