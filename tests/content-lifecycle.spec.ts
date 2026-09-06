import { test, expect } from '@playwright/test';
import { verifyContentLifecycle } from '../scripts/content-lifecycle.ts';

test('isolated builds preserve original-first publication and translation review lifecycle', ({
  browserName,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', '构建生命周期不随设备变化');
  test.setTimeout(120000);
  expect(browserName).toBe('chromium');
  expect(verifyContentLifecycle()).toEqual([
    'original-only',
    'draft',
    'published',
    'stale',
    'reviewed',
    'all-draft',
    'empty',
  ]);
});
