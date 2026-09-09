import { test, expect, type Page } from '@playwright/test';
import { withMockSession } from './mock-session.ts';

async function openArticle(page: Page) {
  await page.locator('[data-paseo-close]').click();
  await page.locator('a[href="/zh/works/attention-is-all-you-need/"]').first().click();
  await expect(page).toHaveURL(/\/zh\/works\/attention-is-all-you-need\/$/);
  // The article bubble expires; keyboard focus can reveal it again without opening chat.
  await page.keyboard.press('Tab');
  await page.locator('[data-paseo-open]:not([data-paseo-article-open])').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('[data-paseo-article-open]')).toBeFocused();
  await page.locator('[data-paseo-article-open]').click();
}

export function registerArticleReferenceTests() {
  test('article launch preserves the draft and removed context stays removed through resize and reload', async ({
    browser,
  }, info) => {
    test.setTimeout(90_000);
    await withMockSession(browser, info, async ({ page, open }) => {
      await open();
      const input = page.locator('#root textarea:visible');
      await input.fill('Existing unsent question');
      await openArticle(page);
      const reference = page.getByTestId('composer-public-work-attachment-pill');
      await expect(reference).toContainText('Attention Is All You Need');
      await expect(input).toHaveValue('Existing unsent question');
      await page.getByRole('button', { name: '移除文章引用', exact: true }).click();
      await expect(reference).toHaveCount(0);
      await page.locator('[data-paseo-expand]').click();
      await page.locator('[data-paseo-compact]').click();
      await page.locator('[data-paseo-close]').click();
      await page.locator('[data-paseo-open]:not([data-paseo-article-open])').click();
      await expect(reference).toHaveCount(0);
      await expect(input).toHaveValue('Existing unsent question');
      await page.reload();
      await page.locator('[data-paseo-open]:not([data-paseo-article-open])').click();
      await expect(input).toHaveValue('Existing unsent question', { timeout: 45_000 });
      await expect(reference).toHaveCount(0);
    });
  });

  test('empty article launch adds one native attachment and sends only after user submit', async ({
    browser,
  }, info) => {
    test.setTimeout(90_000);
    await withMockSession(browser, info, async ({ page, open }) => {
      const sent: { text: string; attachments?: { type: string; text?: string }[] }[] = [];
      await page.routeWebSocket('ws://localhost:4396/ws', (socket) => {
        const upstream = socket.connectToServer();
        socket.onMessage((data) => {
          let message;
          try {
            message = JSON.parse(String(data)).message;
          } catch {
            /* Binary passes unchanged. */
          }
          if (message?.type === 'send_agent_message_request') sent.push(message);
          upstream.send(data);
        });
        upstream.onMessage((data) => socket.send(data));
      });
      await open();
      const input = page.locator('#root textarea:visible');
      await expect(input).toHaveValue('');
      await openArticle(page);
      const reference = page.getByTestId('composer-public-work-attachment-pill');
      await expect(reference).toHaveCount(1);
      await expect(input).toHaveValue('');
      await expect(page.getByTestId('paseo-compact-dictation-start')).toBeVisible();
      expect(sent).toHaveLength(0);
      await input.fill('Explain the linked article.');
      await page.getByRole('button', { name: '发送消息', exact: true }).click();
      await expect.poll(() => sent.length).toBe(1);
      expect(sent[0].text).toBe('Explain the linked article.');
      expect(sent[0].attachments).toHaveLength(1);
      expect(sent[0].attachments![0].type).toBe('text');
      expect(sent[0].attachments![0].text).toContain('untrusted');
      expect(sent[0].attachments![0].text).toContain(
        'https://vibes.college/zh/works/attention-is-all-you-need/',
      );
      expect(sent[0].attachments![0].text).not.toContain('requestId');
      expect(sent[0].attachments![0].text).not.toContain('summary');
      await expect(reference).toHaveCount(0);
    });
  });
}
