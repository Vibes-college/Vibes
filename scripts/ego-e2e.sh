#!/usr/bin/env bash
set -euo pipefail

# 用真实 ego-browser 页面操作完成测试；缺少浏览器或断言失败均返回失败。
ego-browser nodejs <<'EGO'
const task = await useOrCreateTaskSpace('Vibes CLI end-to-end tests');
await openOrReuseTab('http://127.0.0.1:4322/', { wait: true, timeout: 20 });
cliLog((await snapshotText()).slice(0, 1200));

// 等待页面满足断言；超时抛出错误，不能把未完成算成通过。
async function expectPage(expression, message) {
  for (let attempt = 0; attempt < 40; attempt++) {
    if (await js(expression)) { cliLog('PASS: ' + message); return; }
    await wait(0.1);
  }
  throw new Error('FAIL: ' + message);
}

await expectPage("document.querySelectorAll('.work-card:not([hidden])').length === 24", '首页显示 24 张卡片');
await click('label:has(input[value="paper"])');
await expectPage("document.querySelectorAll('.work-card:not([hidden])').length === 4", '论文分类筛选');
await fillInput('#search', 'LoRA');
await expectPage("document.querySelectorAll('.work-card:not([hidden])').length === 1", '搜索 LoRA');
const filteredUrl = (await pageInfo()).url;
await gotoAndWait(filteredUrl);
await expectPage("document.querySelector('#search').value === 'LoRA' && document.querySelectorAll('.work-card:not([hidden])').length === 1", '刷新保留搜索条件');
await fillInput('#search', 'not-in-the-collection');
await expectPage("document.querySelector('.empty-state').hidden === false", '无结果提示');
await click('#reset-filters');
await expectPage("document.querySelectorAll('.work-card:not([hidden])').length === 24", '清除筛选恢复列表');
await click('label:has(input[value="paper"])');
await click('a[data-work="lora"]');
await expectPage("location.pathname === '/works/lora/' && document.querySelector('h1').textContent.includes('LoRA') && document.querySelector('.prose table') !== null", '卡片进入完整文章');
cliLog((await snapshotText()).slice(0, 1200));
await gotoAndWait((await pageInfo()).url);
await expectPage("document.querySelector('.prose').textContent.includes('低秩矩阵')", '详情页刷新仍可阅读');
await cdp('Runtime.evaluate', { expression: 'history.back()' });
await expectPage("location.search.includes('type=paper') && document.querySelectorAll('.work-card:not([hidden])').length === 4", '浏览器返回恢复分类');
await cdp('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
await expectPage('document.documentElement.scrollWidth <= innerWidth', '手机列表不横向溢出');
await click('a[data-work="lora"]');
await expectPage("location.pathname === '/works/lora/' && document.documentElement.scrollWidth <= innerWidth", '手机文章不横向溢出');
await expectPage("document.querySelectorAll('details[open]').length === 0", '正文章节默认折叠');
await click('.read-down');
await click('details:nth-child(2) summary');
await expectPage("document.querySelectorAll('details[open]').length === 1", '章节可展开');
await click('details:nth-child(2) summary');
await expectPage("document.querySelectorAll('details[open]').length === 0", '章节可收起');
await gotoAndWait('http://127.0.0.1:4322/works/transformers-js/');
await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 270, y: 430 }] });
await cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 431 }] });
await cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 80, y: 432 }] });
await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await expectPage("location.pathname === '/works/neural-networks/'", '真实横向触摸切换下一作品');
await click('[data-direction="previous"]');
await expectPage("location.pathname === '/works/transformers-js/'", '按钮切回上一作品');
await cdp('Emulation.clearDeviceMetricsOverride');
await cdp('Emulation.setScriptExecutionDisabled', { value: true });
try {
  await gotoAndWait('http://127.0.0.1:4322/works/attention-is-all-you-need/');
  const snapshot = await snapshotText();
  if (!snapshot.includes('Attention Is All You Need')) throw new Error('关闭 JavaScript 后文章不可读');
  cliLog('PASS: 关闭 JavaScript 后文章仍可读');
} finally {
  await cdp('Emulation.setScriptExecutionDisabled', { value: false });
}
await gotoAndWait('http://127.0.0.1:4322/not-a-real-page');
await expectPage("document.querySelector('.not-found').textContent.includes('404')", '不存在的页面显示 404');
cliLog('EGO_E2E_ALL_PASSED');
EGO

# 上一轮全部断言通过后，单独关闭本次测试的浏览器空间。
ego-browser nodejs <<'EGO'
cliLog(await completeTaskSpace('Vibes CLI end-to-end tests', { keep: false }));
EGO
