import { expect, test } from '../../browser-test.ts';

export function registerJourneyTests(basePath: string) {
  test('a failed example module keeps a return path and can recover after reload', async ({
    page,
  }) => {
    let blocked = true;
    await page.route(/\/Journey[.-][^/]+\.js(?:\?.*)?$/, (route) =>
      blocked ? route.fulfill({ status: 503, body: 'temporarily unavailable' }) : route.continue(),
    );
    await page.goto(basePath + '?case=accordion&journey=portfolio');
    await expect(page.getByRole('alert')).toContainText('组合示例暂时无法打开');
    await page.getByRole('button', { name: '返回设计说明', exact: true }).click();
    await expect(page.getByRole('heading', { name: '折叠问答', exact: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('alert')).toContainText('组合示例暂时无法打开');
    blocked = false;
    await page.getByRole('button', { name: '重新加载页面', exact: true }).click();
    await expect(page.getByRole('heading', { name: '让每一步都有理由。' })).toBeVisible();
  });

  test('a direct navigation stays direct when reduced motion is turned off during a slow request', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/journeys/field-notes.json', async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(basePath + '?journey=portfolio');
    await page.getByRole('link', { name: '编辑设计 山野手记' }).click();
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-phase', 'covered');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('.journey-transition')).toHaveCount(0);
    release();
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-project', 'field-notes');
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-phase', 'idle');
    await expect(page.locator('.journey-transition, .great-ui [inert]')).toHaveCount(0);
    await page.getByRole('button', { name: '← 全部项目' }).click();
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-phase', 'covering');
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-phase', 'idle');
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-project', 'list');
  });

  for (const phase of ['idle', 'covering', 'covered', 'revealing']) {
    test(`live motion preference during ${phase} preserves navigation and updates the exported context`, async ({
      page,
    }) => {
      let release: () => void = () => {};
      if (phase === 'covering' || phase === 'covered') {
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        await page.route('**/journeys/field-notes.json', async (route) => {
          await gate;
          await route.continue().catch(() => {});
        });
      }
      await page.goto(basePath + '?journey=portfolio');
      const portfolio = page.locator('.journey-portfolio');
      if (phase !== 'idle') {
        await page.getByRole('link', { name: '编辑设计 山野手记' }).click();
        await expect(portfolio).toHaveAttribute('data-phase', phase);
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.locator('.journey-transition')).toHaveCount(0);
      release();
      if (phase === 'idle') await page.getByRole('link', { name: '编辑设计 山野手记' }).click();
      await expect(portfolio).toHaveAttribute('data-project', 'field-notes');
      await expect(portfolio).toHaveAttribute('data-phase', 'idle');
      await expect(page.locator('.great-ui [inert]')).toHaveCount(0);
      await expect(page.locator('[data-effect="static"]')).toBeVisible();
      await page.getByRole('button', { name: '复制这条示例的任务', exact: true }).click();
      await page.getByText('查看同一任务的 JSON', { exact: true }).click();
      expect(
        JSON.parse(await page.getByLabel('结构化任务', { exact: true }).inputValue()).plan
          .contextKey,
      ).toContain('motion=reduced');
      await page.getByRole('button', { name: '关闭复制材料' }).click();
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await expect(page.locator('[data-effect="scroll-reveal"]')).toBeVisible();
      await page.getByRole('button', { name: '← 全部项目' }).click();
      await expect(portfolio).toHaveAttribute('data-project', 'list');
      await expect(portfolio).toHaveAttribute('data-phase', 'idle');
      await expect(page.locator('.great-ui [inert]')).toHaveCount(0);
    });
  }

  test('portfolio waits for both cover and real content, then reveals and restores navigation', async ({
    page,
  }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/journeys/field-notes.json', async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(basePath + '?case=accordion&journey=portfolio');
    await page.getByRole('link', { name: '编辑设计 山野手记' }).click();
    try {
      await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-phase', 'covered');
      await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-project', 'list');
      await expect(page.getByRole('status')).toContainText('正在打开项目');
      await expect(page.locator('.journey-portfolio > div[inert]')).toHaveCount(1);
    } finally {
      release();
    }
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-phase', 'idle');
    await expect(page.getByRole('heading', { name: '山野手记', exact: true })).toBeFocused();
    await expect(page.locator('.journey-transition')).toHaveCount(0);
    await expect(page.locator('[data-effect="scroll-reveal"]')).toBeVisible();
    await page.getByRole('button', { name: '为什么没有给每个区块加动画？' }).click();
    await expect(page.getByRole('region', { name: '为什么没有给每个区块加动画？' })).toBeVisible();
    await page.getByRole('button', { name: '查看联系信息' }).click();
    await expect(page.getByRole('status')).toContainText('hello@example.test');
    await page.goBack();
    await expect(page.getByRole('heading', { name: '让每一步都有理由。' })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole('heading', { name: '山野手记', exact: true })).toBeVisible();
  });

  test('failed requests leave an operable page and no overlay', async ({ page }) => {
    await page.route('**/journeys/field-notes.json', (route) =>
      route.fulfill({ status: 503, body: 'unavailable' }),
    );
    await page.goto(basePath + '?journey=portfolio');
    await page.getByRole('link', { name: '编辑设计 山野手记' }).click();
    await expect(page.getByRole('alert')).toContainText('请重试');
    await expect(page.locator('.journey-transition')).toHaveCount(0);
    await expect(page.locator('.great-ui [inert]')).toHaveCount(0);
    await page.getByRole('link', { name: '产品设计 专注时刻' }).click();
    await expect(page.getByRole('heading', { name: '专注时刻', exact: true })).toBeVisible();
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-phase', 'idle');
  });

  test('reduced motion keeps content, keyboard, and question results available', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(basePath + '?journey=portfolio');
    await page.getByRole('link', { name: '编辑设计 山野手记' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-effect="static"]')).toBeVisible();
    await expect(page.locator('.journey-transition')).toHaveCount(0);
    await page.getByRole('button', { name: '这个项目解决了什么问题？' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: '这个项目解决了什么问题？' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
  });

  test('product comparison deliberately supports multiple answers and a real local selection', async ({
    page,
  }) => {
    await page.goto(basePath + '?journey=product');
    await page.getByRole('button', { name: '个人整理适合谁？' }).click();
    await page.getByRole('button', { name: '共同整理适合谁？' }).click();
    await expect(page.getByRole('region', { name: '个人整理适合谁？' })).toBeVisible();
    await expect(page.getByRole('region', { name: '共同整理适合谁？' })).toBeVisible();
    await page.getByRole('button', { name: '选择共同整理' }).click();
    await page.getByRole('button', { name: '确认选择' }).click();
    await expect(page.getByRole('status')).toContainText('已确认：共同整理');
    await page.getByRole('button', { name: '选择个人整理' }).click();
    await expect(page.getByRole('status')).toHaveCount(0);
    await page.getByRole('button', { name: '确认选择' }).click();
    await expect(page.getByRole('status')).toContainText('已确认：个人整理');
  });

  test('tool status follows input and data checks rather than a fixed demonstration result', async ({
    page,
  }) => {
    await page.goto(basePath + '?journey=tool');
    await page.getByRole('button', { name: '检查资料' }).click();
    await expect(page.getByRole('status')).toHaveText('有2项需要完善。');
    await page.getByRole('button', { name: '修改后重新检查' }).click();
    await page.getByLabel('作品标题').fill('我的作品集首页');
    await page.getByLabel('来源地址').fill('https://example.com/project');
    await page.getByRole('button', { name: '检查资料' }).click();
    await expect(page.getByRole('status')).toHaveText('3项检查通过，可以继续整理作品。');
    await page.route('**/journeys/field-notes.json', (route) =>
      route.fulfill({ status: 500, body: 'failed' }),
    );
    await page.getByRole('button', { name: '检查资料' }).click();
    await expect(page.getByRole('status')).toHaveText('有1项需要完善。');
    await expect(page.locator('[data-state="failed"]')).toContainText('本地示例');
  });

  test('cancellation ignores a late response and reduced motion never covers a slow request', async ({
    page,
  }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route('**/journeys/field-notes.json', async (route) => {
      await gate;
      await route.continue().catch(() => {});
    });
    await page.goto(basePath + '?journey=portfolio');
    await page.getByRole('link', { name: '编辑设计 山野手记' }).click();
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-phase', 'covered');
    await page.getByRole('button', { name: '取消', exact: true }).click();
    await expect(page.locator('.journey-transition')).toHaveCount(0);
    await page.getByRole('link', { name: '产品设计 专注时刻' }).click();
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-project', 'quiet-work');
    release();
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-phase', 'idle');
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-project', 'quiet-work');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let releaseReduced: () => void = () => {};
    const reducedGate = new Promise<void>((resolve) => {
      releaseReduced = resolve;
    });
    await page.route('**/journeys/field-notes.json', async (route) => {
      await reducedGate;
      await route.continue().catch(() => {});
    });
    await page.goto(basePath + '?journey=portfolio');
    await page.getByRole('link', { name: '编辑设计 山野手记' }).click();
    await expect(page.getByRole('button', { name: '取消', exact: true })).toBeVisible();
    await expect(page.locator('.journey-transition')).toHaveCount(0);
    releaseReduced();
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-project', 'field-notes');
  });

  test('rapid history navigation restores only the latest requested project', async ({ page }) => {
    await page.goto(basePath + '?journey=portfolio');
    await page.getByRole('link', { name: '编辑设计 山野手记' }).click();
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-phase', 'idle');
    await page.getByRole('button', { name: '← 全部项目' }).click();
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-project', 'list');
    await page.goBack();
    await page.goForward();
    await page.goBack();
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-phase', 'idle');
    await expect(page.locator('.journey-portfolio')).toHaveAttribute('data-project', 'field-notes');
    await expect(page.locator('.journey-transition')).toHaveCount(0);
  });

  test('fixed demo task uses the displayed path and preserves reduced-motion results', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const kind of ['portfolio', 'product', 'tool']) {
      await page.goto(basePath + '?journey=' + kind);
      await page.getByRole('button', { name: '复制这条示例的任务', exact: true }).click();
      await page.getByText('查看同一任务的 JSON', { exact: true }).click();
      const task = JSON.parse(await page.getByLabel('结构化任务', { exact: true }).inputValue());
      expect(task.plan.id).toBe(await page.locator('.demo-task').getAttribute('data-plan-id'));
      expect(task.plan.templateId).toBe(kind);
      expect(task.plan.contextKey).toContain('motion=reduced');
      expect(task.plan.steps).toHaveLength(5);
      await page.getByRole('button', { name: '关闭复制材料' }).click();
      if (kind === 'portfolio') {
        await page.getByRole('link', { name: '编辑设计 山野手记' }).click();
        await expect(page.locator('[data-effect="static"]')).toBeVisible();
      }
      if (kind === 'product') {
        await page.getByRole('button', { name: '选择共同整理' }).click();
        await page.getByRole('button', { name: '确认选择' }).click();
        await expect(page.locator('.journey-product [role="status"]')).toContainText(
          '已确认：共同整理',
        );
      }
      if (kind === 'tool') {
        await page.getByRole('button', { name: '检查资料' }).click();
        await expect(page.locator('.journey-tool [role="status"]')).toContainText(
          '有2项需要完善。',
        );
      }
    }
  });
}
