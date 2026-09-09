import { test, expect, type Locator } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMockSession } from './fixtures/paseo-webui/mock-session.ts';

test('native image attachment thumbnail and lightbox decode blob images under production CSP', async ({
  browser,
}, info) => {
  test.setTimeout(90_000);
  // Reuse the fixed upstream's 1.7 KB PNG; no generated image or external fetch.
  const imagePath = resolve('.scratch/paseo-webui/upstream/packages/app/assets/images/favicon.png');
  const png = readFileSync(imagePath);
  const expectedSize = { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
  await withMockSession(
    browser,
    info,
    async ({ page, open }) => {
      const navigation = page.waitForResponse(
        (response) =>
          response.request().isNavigationRequest() &&
          response.url() === 'http://localhost:4396/zh/',
      );
      await open();
      const policy = await (await navigation).headerValue('content-security-policy');
      expect(policy).toBe(
        readFileSync('dist/_headers', 'utf8').match(/^ {2}Content-Security-Policy: (.+)$/m)?.[1],
      );
      await page.getByRole('button', { name: '添加附件', exact: true }).click();
      const chooser = page.waitForEvent('filechooser');
      await page.getByText('添加图片', { exact: true }).click();
      await (await chooser).setFiles(imagePath);

      const expectDecodedImage = async (surface: Locator) => {
        await expect(surface).toBeVisible();
        const image = surface.locator('img');
        await expect(image).toHaveAttribute('src', /^blob:/);
        // React Native Web also paints a CSS background. Require its real image
        // element to decode the selected file, not merely a visible placeholder.
        await expect
          .poll(() =>
            image.evaluate((element: HTMLImageElement) => ({
              complete: element.complete,
              width: element.naturalWidth,
              height: element.naturalHeight,
            })),
          )
          .toEqual({ complete: true, ...expectedSize });
      };
      const thumbnail = page.getByTestId('composer-image-attachment-pill');
      await expectDecodedImage(thumbnail);
      await thumbnail.click();
      await expectDecodedImage(page.getByTestId('attachment-lightbox-image'));
      if (info.project.use.isMobile) {
        // Native touch controls appear after touching the image canvas.
        await page.getByTestId('attachment-lightbox-canvas').tap();
        await expect(page.getByTestId('attachment-lightbox-close')).toHaveCSS('opacity', '1');
      }
      await page.getByTestId('attachment-lightbox-close').click();
      await expect(page.getByTestId('attachment-lightbox')).toHaveCount(0);
      await expect(thumbnail).toBeVisible();
    },
    { persistentProfile: browser.browserType().name() === 'webkit' },
  );
});

test('native file links open text at the requested line under production CSP', async ({
  browser,
}, info) => {
  test.setTimeout(90_000);
  await withMockSession(browser, info, async ({ page, createSession, open }) => {
    const session = await createSession({
      featureValues: { mockAssistantResponse: '[Open fixture line](fixture.txt#L18)' },
    });
    writeFileSync(
      resolve(session.cwd, 'fixture.txt'),
      Array.from({ length: 30 }, (_, index) => `Fixture line ${index + 1}`).join('\n'),
    );
    await open(session);
    await page.locator('#root textarea:visible').fill('Show the configured file link.');
    await page.getByRole('button', { name: '发送消息', exact: true }).click();
    await page.getByText('Open fixture line', { exact: true }).click();
    await expect(page.getByTestId('workspace-file-pane')).toBeVisible();
    await expect(page.getByLabel('第 18 行，第 1 列', { exact: true })).toBeVisible();
    await expect(page.locator('[contenteditable=true]:visible')).toContainText('Fixture line 18');
    expect(readFileSync(resolve(session.cwd, 'fixture.txt'), 'utf8')).toContain('Fixture line 18');
  });
});

test('native HTML preview keeps its sandbox and can run a local interaction', async ({
  browser,
}, info) => {
  test.setTimeout(90_000);
  await withMockSession(browser, info, async ({ page, createSession, open }) => {
    const session = await createSession({
      featureValues: { mockAssistantResponse: '[Open HTML result](fixture.html)' },
    });
    writeFileSync(
      resolve(session.cwd, 'fixture.html'),
      '<!doctype html><h1>Native preview fixture</h1><button id="action">Run local action</button><output id="result">Waiting</output><script>document.getElementById("action").onclick=()=>document.getElementById("result").textContent="Local action worked"</script>',
    );
    await open(session);
    await page.locator('#root textarea:visible').fill('Show the configured HTML result.');
    await page.getByRole('button', { name: '发送消息', exact: true }).click();
    await page.getByText('Open HTML result', { exact: true }).click();
    await expect(page.getByTestId('workspace-file-pane')).toBeVisible();
    const iframe = page.locator('#root iframe[title="预览"]');
    await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');
    const preview = iframe.contentFrame();
    await expect(preview.getByRole('heading', { name: 'Native preview fixture' })).toBeVisible();
    await preview.getByRole('button', { name: 'Run local action' }).click();
    await expect(preview.locator('#result')).toHaveText('Local action worked');
    const csp = readFileSync('dist/_headers', 'utf8').match(
      /^ {2}Content-Security-Policy: (.+)$/m,
    )?.[1];
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });
});
