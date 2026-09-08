import { test, expect } from './browser-test.ts';
import type { Page } from '@playwright/test';
import { AssistantDaemon } from './fixtures/assistant-daemon.ts';
async function pair(page: Page, daemon: AssistantDaemon) {
  await page.getByRole('button', { name: '本地助手', exact: true }).click();
  await page.getByLabel('Paseo 配对链接或 JSON').fill(daemon.offer);
  await page.getByRole('button', { name: '连接电脑', exact: true }).click();
  await expect(page.locator('#assistant-dialog header [role=status]')).toContainText('已连接');
}
async function choose(page: Page, id = 'alpha') {
  await page.locator('[data-slot=sidebar-trigger]').click();
  await page
    .locator('[data-slot=aui_thread-list-item-trigger]')
    .filter({ hasText: id === 'alpha' ? '作品讨论' : '另一会话' })
    .click();
  await expect(page.locator('#assistant-dialog header h2')).toHaveText(
    id === 'alpha' ? '作品讨论' : '另一会话',
  );
  const sidebar = page.locator('[data-slot=sidebar-container]');
  if (await sidebar.isVisible()) await page.locator('[data-slot=sidebar-trigger]').click();
  await expect(page.locator('[data-mobile=true]')).toHaveCount(0);
  await expect(page.getByLabel('发送给本地 Agent')).toBeEnabled();
}
test('assistant loads only on demand and sends public work context through the encrypted SDK', async ({
  page,
}) => {
  const daemon = new AssistantDaemon();
  await daemon.install(page);
  const scripts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.goto('/zh/works/attention-is-all-you-need/');
  expect(scripts.some((url) => /\/assistant\.[\w-]+\.js/.test(url))).toBe(false);
  await pair(page, daemon);
  await choose(page);
  expect(scripts.some((url) => /\/assistant\.[\w-]+\.js/.test(url))).toBe(true);
  await page.getByRole('button', { name: '查看作品上下文', exact: true }).click();
  await expect(page.getByRole('link', { name: '打开原作', exact: true })).toHaveAttribute(
    'href',
    'https://arxiv.org/abs/1706.03762',
  );
  await page.keyboard.press('Escape');
  await page.getByLabel('发送给本地 Agent').fill('解释它的核心思路');
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByText('正在分析这件作品。', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '停止', exact: true })).toBeEnabled();
  const send = daemon.requests.find((message) => message.type === 'send_agent_message_request');
  expect(send?.type === 'send_agent_message_request' && send.text).toContain(
    'Attention Is All You Need',
  );
  await daemon.complete();
  await expect(page.locator('#assistant-dialog header [role=status]')).toContainText('任务已完成');
  await page.locator('[data-slot=tool-group-trigger]').click();
  await expect(page.locator('[data-slot=tool-fallback-root]')).toHaveCount(1);
  await expect(page.getByLabel('发送给本地 Agent')).toBeEnabled();
  await page.getByRole('button', { name: '移除作品上下文', exact: true }).click();
  await page.getByLabel('发送给本地 Agent').fill('再给一个例子');
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect
    .poll(() => daemon.requests.filter((m) => m.type === 'send_agent_message_request').length)
    .toBe(2);
  const last = daemon.requests.filter((m) => m.type === 'send_agent_message_request').at(-1)!;
  expect(last.text).toBe('再给一个例子');
  await page.getByRole('button', { name: '停止', exact: true }).click();
  await expect(page.locator('#assistant-dialog header [role=status]')).toContainText('任务已停止');
  expect(daemon.failures).toEqual([]);
});

test('loading feedback, module reuse and assistant keyboard focus stay separate from article navigation', async ({
  page,
}) => {
  let release!: () => void;
  const downloaded = new Promise<void>((resolve) => {
    release = resolve;
  });
  let loads = 0;
  await page.route(/\/assistant\.[\w-]+\.js$/, async (route) => {
    loads++;
    await downloaded;
    await route.continue();
  });
  await page.goto('/zh/works/attention-is-all-you-need/');
  expect(loads).toBe(0);
  await page.getByRole('button', { name: '本地助手', exact: true }).click();
  try {
    await expect(page.locator('#assistant-loading')).toBeVisible();
    await expect(page.locator('#assistant-open')).toBeDisabled();
  } finally {
    release();
  }
  const panel = page.locator('#assistant-dialog');
  await expect(panel).toBeVisible();
  await expect(page.locator('#assistant-loading')).not.toBeVisible();
  await panel.locator('form h2').click();
  const url = page.url();
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'PageDown', 'Space']) {
    await page.keyboard.press(key);
    expect(page.url()).toBe(url);
    await expect(page.locator('[data-detail-page]')).toHaveAttribute('data-detail-page', 'cover');
  }
  await panel.locator('header').getByRole('button', { name: '收起助手', exact: true }).click();
  await page.getByRole('button', { name: '打开本地助手', exact: true }).click();
  await expect(panel).toBeVisible();
  expect(loads).toBe(1);
});
test('real permission IDs support allow, deny, multiple choice and stop without duplicate submission', async ({
  page,
}) => {
  const daemon = new AssistantDaemon();
  await daemon.install(page);
  await page.goto('/zh/');
  await pair(page, daemon);
  await choose(page);
  await daemon.permission();
  await expect(page.getByText('允许读取文件？', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '允许本次', exact: true }).click();
  await expect(page.locator('[data-slot=tool-fallback-approval]')).toHaveCount(0);
  await daemon.permission();
  await page.getByRole('button', { name: '拒绝', exact: true }).click();
  await expect(page.locator('[data-slot=tool-fallback-approval]')).toHaveCount(0);
  await daemon.permission('alpha', 'question');
  await page.getByLabel('界面', { exact: true }).check();
  await page.getByLabel('实现', { exact: true }).check();
  await expect(page.getByRole('button', { name: '提交回答', exact: true })).toBeDisabled();
  await page.getByLabel('简短说明', { exact: true }).check();
  await page.getByRole('button', { name: '提交回答', exact: true }).click();
  await expect(page.locator('[data-slot=tool-fallback-approval]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '提交回答', exact: true })).toHaveCount(0);
  const responses = daemon.requests.filter((m) => m.type === 'agent_permission_response');
  expect(responses.map((m) => m.response.behavior)).toEqual(['allow', 'deny', 'allow']);
  expect(responses[2].requestId).toBe('permission-1');
  expect(
    responses[2].response.behavior === 'allow' && responses[2].response.updatedInput,
  ).toMatchObject({ answers: { 范围: '界面, 实现', 输出: '简短说明' } });
  await page.getByRole('button', { name: '停止', exact: true }).click();
  await expect(page.locator('#assistant-dialog header [role=status]')).toContainText('任务已停止');
  expect(daemon.failures).toEqual([]);
});
test('refresh, reconnect and navigation restore authoritative history and preserve session isolation', async ({
  page,
}) => {
  const daemon = new AssistantDaemon();
  await daemon.install(page);
  await page.goto('/zh/');
  await pair(page, daemon);
  await choose(page);
  await daemon.append('alpha', {
    type: 'assistant_message',
    text: '持续的回复',
    messageId: 'persist',
  });
  await expect(page.getByText('持续的回复', { exact: true })).toBeVisible();
  await choose(page, 'beta');
  await expect(page.getByText('持续的回复', { exact: true })).toHaveCount(0);
  await choose(page);
  await expect(page.getByText('持续的回复', { exact: true })).toHaveCount(1);
  const count = daemon.requests.filter(
    (m) => m.type === 'agent.timeline.set_subscription.request',
  ).length;
  await daemon.drop();
  await expect
    .poll(
      () =>
        daemon.requests.filter((m) => m.type === 'agent.timeline.set_subscription.request').length,
      { timeout: 20000 },
    )
    .toBeGreaterThan(count);
  await expect(page.getByText('持续的回复', { exact: true })).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: '本地助手', exact: true }).click();
  await expect(page.getByText('持续的回复', { exact: true })).toBeVisible();
  await page
    .locator('#assistant-dialog header')
    .getByRole('button', { name: '收起助手', exact: true })
    .click();
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: 'Open local assistant', exact: true }).click();
  await expect(page.locator('#assistant-dialog header [role=status]')).toContainText('Connected');
  await expect(page.getByText('持续的回复', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Session options', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Forget computer', exact: true }).click();
  await expect(page.getByLabel('Paseo pairing link or JSON')).toBeVisible();
  expect(
    await page.evaluate(() => ({
      tab: sessionStorage.getItem('vibes.local-assistant.v1'),
      local: localStorage.getItem('vibes.local-assistant.v1'),
    })),
  ).toEqual({ tab: null, local: null });
  expect(daemon.failures).toEqual([]);
});
test('new session uses the selected local directory, provider and actual model catalog', async ({
  page,
}) => {
  const daemon = new AssistantDaemon();
  await daemon.install(page);
  await page.goto('/zh/');
  await pair(page, daemon);
  await page
    .locator('#assistant-dialog main')
    .getByRole('button', { name: '新建会话', exact: true })
    .click();
  await page.getByRole('combobox', { name: 'Agent', exact: true }).click();
  await page.getByRole('option', { name: 'codex', exact: true }).click();
  await page.getByLabel('本地工作目录', { exact: true }).fill('/tmp/vibes-fixture');
  await page.getByRole('button', { name: '读取可用模型', exact: true }).click();
  await expect(page.locator('[data-slot=model-selector-trigger]')).toContainText('Test model');
  await page.getByRole('button', { name: '创建会话', exact: true }).click();
  await expect(page.getByLabel('发送给本地 Agent')).toBeEnabled();
  expect(
    daemon.requests.some(
      (m) =>
        m.type === 'create_agent_request' &&
        m.config.cwd === '/tmp/vibes-fixture' &&
        m.config.provider === 'codex' &&
        m.config.model === 'test-model',
    ),
  ).toBe(true);
  expect(daemon.failures).toEqual([]);
});
test('invalid pairing stays offline; rejected sends require refresh before retry', async ({
  page,
}) => {
  const daemon = new AssistantDaemon();
  await daemon.install(page);
  await page.goto('/zh/');
  await page.getByRole('button', { name: '本地助手', exact: true }).click();
  await page.getByLabel('Paseo 配对链接或 JSON').fill('invalid');
  await page.getByRole('button', { name: '连接电脑', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('配对信息无效');
  expect(daemon.requests).toHaveLength(0);
  await page.getByLabel('Paseo 配对链接或 JSON').fill(daemon.offer);
  await page.getByRole('button', { name: '连接电脑', exact: true }).click();
  await expect(page.locator('#assistant-dialog header [role=status]')).toContainText('已连接');
  await choose(page);
  daemon.acceptSends = false;
  await page.getByLabel('发送给本地 Agent').fill('测试拒绝');
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('发送结果未确认');
  await expect(page.getByRole('button', { name: '发送', exact: true })).not.toBeEnabled();
  await page.getByRole('button', { name: '会话选项', exact: true }).click();
  await page.getByRole('menuitem', { name: '刷新状态', exact: true }).click();
  await expect(page.getByLabel('发送给本地 Agent')).toBeEnabled();
  expect(daemon.requests.filter((m) => m.type === 'send_agent_message_request')).toHaveLength(1);
});
test('320px dialog keeps focus, fits viewport and closes back to its launcher', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/zh/works/attention-is-all-you-need/');
  await page.getByRole('button', { name: '本地助手', exact: true }).click();
  await expect(page.getByLabel('Paseo 配对链接或 JSON')).toBeVisible();
  expect(
    await page
      .locator('#assistant-dialog')
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  await page.getByLabel('Paseo 配对链接或 JSON').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#assistant-dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: '打开本地助手', exact: true })).toBeFocused();
});
