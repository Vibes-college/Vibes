import { test, expect } from './browser-test.ts';

const url = '/zh/works/beui-motion-lab/';
test('ten source-faithful beUI previews hydrate on visibility and keep their interactions', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  const scripts: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(new URL(request.url()).pathname);
  });
  await page.goto(url);
  const islands = page.locator('astro-island[component-url]');
  await expect(islands).toHaveCount(10);
  const renderer = (await islands.first().getAttribute('renderer-url'))!;
  const components = await islands.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('component-url')),
  );
  expect(new Set(components).size).toBe(10);
  await page.waitForLoadState('networkidle');
  expect(scripts).not.toContain(renderer);
  await page.locator('.read-down').click();
  async function demo(name: string) {
    const element = page.locator(`[data-beui="${name}Demo"]`);
    await element.scrollIntoViewIfNeeded();
    await expect(element.locator('xpath=..')).not.toHaveAttribute('ssr');
    return element;
  }
  const tilt = await demo('Tilt');
  await expect(tilt.getByRole('heading', { name: 'Tilt me' })).toBeVisible();
  if (!testInfo.project.name.startsWith('mobile')) {
    const card = tilt.locator('.will-change-transform').first();
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + 10, box.y + 10);
    await expect
      .poll(() => card.getAttribute('style'))
      .not.toContain('rotateX(0deg) rotateY(0deg)');
  }
  const button = await demo('Button');
  await expect(button.getByRole('button')).toHaveCount(3);
  const currentUrl = page.url();
  await button.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page).toHaveURL(currentUrl);
  // The metallic variant has actual layered rim and reflection elements, not a recolored base button.
  expect(
    await button
      .getByRole('button', { name: 'Continue', exact: true })
      .locator('[aria-hidden]')
      .count(),
  ).toBeGreaterThanOrEqual(4);
  const tabs = await demo('Tabs');
  await expect(tabs.getByRole('tablist')).toHaveCount(3);
  await tabs.getByRole('tab', { name: 'Activity', exact: true }).click();
  await expect(tabs.getByRole('tabpanel')).toHaveText('Recent events.');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: 'Settings', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(tabs.getByRole('tab', { name: 'Day', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const toggle = await demo('Switch');
  await toggle.getByRole('switch', { name: 'Enable notifications', exact: true }).click();
  await expect(
    toggle.getByRole('switch', { name: 'Enable notifications', exact: true }),
  ).not.toBeChecked();
  await expect(toggle.getByRole('switch', { name: 'Disabled', exact: true })).toBeDisabled();
  const checkbox = await demo('Checkbox');
  await checkbox.getByRole('checkbox', { name: 'Email me product updates', exact: true }).click();
  await expect(
    checkbox.getByRole('checkbox', { name: 'Email me product updates', exact: true }),
  ).toBeChecked();
  await expect(
    checkbox.getByRole('checkbox', { name: 'Select all (partial)', exact: true }),
  ).toHaveAttribute('aria-checked', 'mixed');
  const radio = await demo('Radio');
  await radio.getByRole('radio', { name: 'Starter — free', exact: true }).click();
  await page.keyboard.press('ArrowRight');
  await expect(radio.getByRole('radio', { name: 'Pro — $12/mo', exact: true })).toBeChecked();
  await expect(radio.getByRole('radio', { name: 'Legacy plan', exact: true })).toBeDisabled();
  const range = await demo('Range');
  const slider = range.getByRole('slider', { name: 'Value', exact: true });
  await slider.focus();
  const before = page.url();
  await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuenow', '100');
  await expect(page).toHaveURL(before);
  const track = range.locator('.touch-none');
  const box = (await track.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect(slider).toHaveAttribute('aria-valuenow', '20');
  await expect(page).toHaveURL(before);
  const accordion = await demo('Accordion');
  await accordion.getByRole('button', { name: 'Release Brief', exact: true }).click();
  await expect(accordion.getByRole('region')).toContainText('Collect launch notes');
  await accordion.getByRole('button', { name: 'Launch Checklist', exact: true }).click();
  await expect(
    accordion.getByRole('button', { name: 'Release Brief', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false');
  const badge = await demo('Badge');
  const automatic = badge.locator('[aria-live="polite"]');
  const initial = await automatic.textContent();
  await expect(automatic).not.toHaveText(initial!);
  await expect(badge.getByText('Verified', { exact: true })).toBeVisible();
  const marquee = await demo('Marquee');
  await expect(marquee.locator('[aria-hidden="true"]')).toHaveAttribute('inert');
  if (!testInfo.project.name.startsWith('mobile')) {
    await marquee.hover();
    await expect(marquee.locator('.animate-marquee').first()).toHaveCSS(
      'animation-play-state',
      'paused',
    );
    await page.mouse.move(0, 0);
    await expect(marquee.locator('.animate-marquee').first()).toHaveCSS(
      'animation-play-state',
      'running',
    );
  }
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
  expect(scripts.filter((path) => path === renderer)).toHaveLength(1);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reduced motion keeps the original controls usable at 320px and stops marquee motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(url + '#reading');
  const marquee = page.locator('[data-beui="MarqueeDemo"]');
  await marquee.scrollIntoViewIfNeeded();
  await expect(marquee.locator('.animate-marquee').first()).toHaveCSS('animation-name', 'none');
  const range = page.locator('[data-beui="RangeDemo"]');
  await range.scrollIntoViewIfNeeded();
  await expect(range.locator('xpath=..')).not.toHaveAttribute('ssr');
  await range.getByRole('slider').focus();
  await page.keyboard.press('ArrowRight');
  await expect(range.getByRole('slider')).toHaveAttribute('aria-valuenow', '45');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
