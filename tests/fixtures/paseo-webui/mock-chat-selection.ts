import { test, expect } from '@playwright/test';
import { basename } from 'node:path';
import { withMockSession } from './mock-session.ts';

export function registerMockSelectionTests() {
  test('native models, workspace sessions and successful or failed tool details remain usable', async ({
    browser,
  }, info) => {
    test.setTimeout(120000);
    await withMockSession(
      browser,
      info,
      async ({ page, open, client, agentId, workspaceId, cwd, title, serverId, createSession }) => {
        let injectToolFailure = false;
        let injectedFailures = 0;
        await page.routeWebSocket('ws://localhost:4396/ws', (socket) => {
          const upstream = socket.connectToServer();
          socket.onMessage((message) => upstream.send(message));
          upstream.onMessage((message) => {
            if (injectToolFailure) {
              let frame;
              try {
                frame = JSON.parse(String(message));
              } catch {
                /* Pass non-JSON frames unchanged. */
              }
              const payload = frame?.message?.payload;
              const item = payload?.event?.item;
              if (
                frame?.message?.type === 'agent_stream' &&
                payload.agentId === agentId &&
                item?.type === 'tool_call' &&
                item.status === 'completed' &&
                item.detail?.type === 'read'
              ) {
                // Like upstream tool-call UI fixtures, alter one synthetic timeline
                // event while retaining its real sequence and identity. This is
                // presentation coverage, not proof that a real command failed.
                item.status = 'failed';
                item.error = 'VIBES_CONTROLLED_TOOL_FAILURE';
                injectToolFailure = false;
                injectedFailures++;
                socket.send(JSON.stringify(frame));
                return;
              }
            }
            socket.send(message);
          });
        });
        const other = await createSession();
        await open();
        const workspace = page.getByTestId(`workspace-deck-entry-${serverId}:${workspaceId}`);
        await expect(workspace).toBeVisible();
        const modelSelector = workspace.getByTestId('combined-model-selector');
        await modelSelector.click();
        // Native layout follows the embedded panel width, including compact on desktop.
        const narrowModelControls = page.getByTestId('agent-controls-model');
        await expect(narrowModelControls).toBeVisible();
        await narrowModelControls.click();
        await page.getByTestId('model-row-mock-one-minute-stream').click();
        await expect(page.getByTestId('agent-controls-model-browser-sheet')).toBeHidden();
        await page
          .getByTestId('agent-controls-model-sheet')
          .getByRole('button', { name: '关闭', exact: true })
          .click();
        await expect(page.getByTestId('agent-controls-model-sheet')).toBeHidden();
        await expect
          .poll(async () => (await client.fetchAgent(agentId))?.agent.model)
          .toBe('one-minute-stream');
        await expect(modelSelector).toContainText('One minute stream');
        await modelSelector.click();
        await expect(narrowModelControls).toBeVisible();
        await narrowModelControls.click();
        await page.getByTestId('model-row-mock-ten-second-stream').click();
        await expect(page.getByTestId('agent-controls-model-browser-sheet')).toBeHidden();
        await page
          .getByTestId('agent-controls-model-sheet')
          .getByRole('button', { name: '关闭', exact: true })
          .click();
        await expect(page.getByTestId('agent-controls-model-sheet')).toBeHidden();
        await expect
          .poll(async () => (await client.fetchAgent(agentId))?.agent.model)
          .toBe('ten-second-stream');
        const input = page.locator('#root textarea:visible');
        if (info.project.use.hasTouch) await expect(input).not.toBeFocused();
        await input.fill('FIRST_WORKSPACE_UNSENT_DRAFT');
        await open(other);
        await expect(input).toHaveValue('');
        await input.fill('SECOND_WORKSPACE_UNSENT_DRAFT');
        const row = page.getByTestId(`sidebar-workspace-row-${serverId}:${workspaceId}`);
        await page.locator('[data-paseo-expand]').click();
        if (!(await row.isVisible())) await page.getByTestId('menu-button').click();
        await row.click();
        await expect(input).toHaveValue('FIRST_WORKSPACE_UNSENT_DRAFT');
        await expect(page.locator('#root')).toContainText(basename(cwd));
        await page.locator('[data-paseo-compact]').click();
        expect((await client.fetchAgent(agentId))?.agent.workspaceId).toBe(workspaceId);
        await open(other);
        await expect(input).toHaveValue('SECOND_WORKSPACE_UNSENT_DRAFT');
        await open({ agentId, workspaceId, cwd, title });
        await expect(input).toHaveValue('FIRST_WORKSPACE_UNSENT_DRAFT');
        const send = async () => {
          await input.fill('Emit 512 byte file agent stream payload.');
          await page.getByRole('button', { name: '发送消息', exact: true }).click();
        };
        await send();
        const tool = page.getByTestId('tool-call-badge').filter({ hasText: 'large-file.txt' });
        const toggleTool = async () => {
          const disclosure = tool.last().getByRole('button').first();
          // The separate open-file control can appear on hover. Activate the
          // disclosure icon, not that nested file-navigation action.
          if (info.project.use.hasTouch) await disclosure.tap({ position: { x: 8, y: 8 } });
          else await disclosure.click({ position: { x: 8, y: 8 } });
        };
        await expect(tool.last()).toBeVisible();
        await toggleTool();
        await expect(
          page.getByText('file ' + 'x'.repeat(96), { exact: false }).first(),
        ).toBeVisible();
        const close = page.getByTestId('tool-call-sheet-close');
        if (await close.isVisible()) await close.click();
        else await toggleTool();
        injectToolFailure = true;
        await send();
        await expect.poll(() => injectedFailures).toBe(1);
        await expect(tool).toHaveCount(2);
        await toggleTool();
        await expect(
          page.getByText('VIBES_CONTROLLED_TOOL_FAILURE', { exact: false }).first(),
        ).toBeVisible();
      },
    );
  });
}
