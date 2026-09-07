import { test, expect } from './browser-test.ts';

test('reactions wait for reading idle, save independently and clean up on navigation', async ({
  page,
}) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/section-reactions.')) requests.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/zh/works/transformers-js/');
  await page.waitForTimeout(1800);
  expect(requests).toHaveLength(0);
  const first = page.locator('[data-reaction]').first();
  await page.locator('.read-down').click();
  await expect.poll(() => requests.length).toBe(1);
  await expect(page.locator('.reaction-menu')).toHaveCount(0);
  await first.click();
  const menu = page.getByRole('menu', { name: '选择表情' });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('data-direction', 'down');
  await page.getByRole('menuitemradio', { name: '惊喜' }).click();
  await expect(first.locator('[data-reaction-value]')).toHaveText('🤩');
  await expect.poll(() => page.locator('.reaction-particle').count()).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(page.locator('.reaction-particle')).toHaveCount(0);
  await page.reload();
  await expect(first.locator('[data-reaction-value]')).toHaveText('🤩');
  const second = page.locator('[data-reaction]').nth(1);
  await expect(second.locator('[data-reaction-value]')).toHaveText('');
  await second.click();
  await page.getByRole('menuitemradio', { name: '喜爱' }).click();
  await expect(second.locator('[data-reaction-value]')).toHaveText('🥰');
  await expect(first.locator('[data-reaction-value]')).toHaveText('🤩');
  await page.keyboard.press('Escape');
  await page.goBack();
  await page.locator('.detail-navigation a').first().click();
  await expect(page.locator('.reaction-menu')).toHaveCount(0);
  await expect(page.locator('.reaction-particles')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('early click and save-data load on demand, small viewport and reduced motion stay usable', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'connection', { value: { saveData: true } }),
  );
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/section-reactions.')) requests.push(request.url());
  });
  await page.goto('/zh/works/transformers-js/#reading');
  await page.waitForTimeout(1800);
  expect(requests).toHaveLength(0);
  const first = page.locator('[data-reaction]').first();
  await first.click();
  await expect(page.getByRole('menu')).toBeVisible();
  expect(requests).toHaveLength(1);
  await page.keyboard.press('End');
  await expect(page.getByRole('menuitemradio', { name: '开心' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(first.locator('[data-reaction-value]')).toHaveText('😄');
  await expect(page.locator('.reaction-particle')).toHaveCount(0);
  const bounds = await page.getByRole('menu').boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.section-content p').first().click();
  await expect(page.getByRole('menu')).toBeHidden();
});

test('blocked storage and long hold never prevent reading or leak particles', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('storage blocked');
    };
    Storage.prototype.setItem = () => {
      throw new Error('storage blocked');
    };
  });
  await page.goto('/zh/works/transformers-js/#reading');
  await page.locator('[data-reaction]').first().click();
  const choice = page.getByRole('menuitemradio', { name: '感动' });
  await choice.dispatchEvent('pointerdown', { pointerId: 1 });
  await page.waitForTimeout(700);
  await expect.poll(() => page.locator('.reaction-particle').count()).toBeGreaterThan(5);
  expect(await page.locator('.reaction-particle').count()).toBeLessThanOrEqual(40);
  await choice.dispatchEvent('pointercancel', { pointerId: 1 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  await expect(page.locator('.reaction-particle')).toHaveCount(0);
  await expect(page.locator('.section-content').first()).toBeVisible();
});

test('pressing the trigger then dragging to an emoji selects once and leaves the menu open', async ({
  page,
}) => {
  await page.goto('/zh/works/transformers-js/#reading');
  const trigger = page.locator('[data-reaction]').first();
  await trigger.click();
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toBeHidden();
  await trigger.dispatchEvent('pointerdown', { pointerId: 3 });
  await expect(page.getByRole('menu')).toBeVisible();
  const choice = page.getByRole('menuitemradio', { name: '惊喜' });
  await expect(choice).toBeVisible();
  await page.waitForTimeout(400);
  const box = (await choice.boundingBox())!;
  await trigger.dispatchEvent('pointerup', {
    pointerId: 3,
    clientX: box.x + box.width / 2,
    clientY: box.y + box.height / 2,
  });
  await expect(trigger.locator('[data-reaction-value]')).toHaveText('🤩');
  await expect(page.getByRole('menu')).toBeVisible();
  await trigger.click();
  await expect(page.getByRole('menu')).toBeHidden();
});
