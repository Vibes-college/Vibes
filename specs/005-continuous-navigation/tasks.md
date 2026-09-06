---
tense: 'frozen'
describes: '连续阅读实施清单'
status: 'in-progress'
amended-by: []
---

# 连续阅读实施清单

## 基础

- [x] T001 建立spec.md、质量检查与Draft PR #4；隔离现有未提交工作。
- [x] T002 核对Astro和roadmap流程，在research.md、plan.md确定缓存、预算及生命周期选择。
- [ ] T003 在tests/navigation.spec.ts建立同文档切换和预取有效失败证据。

## US1 连续阅读（P1）

独立验收：目录、搜索、详情、相邻、返回、语言全链路保持文档身份，搜索和手势仍可用。

- [ ] T004 [US1] src/layouts/Layout.astro启用路由；src/scripts/page-lifecycle.ts、explore.ts、detail.ts支持重复初始化与清理。
- [ ] T005 [US1] src/scripts/search.ts隔离跨语言索引；tests/navigation.spec.ts验证反复切换及滚动/历史/语言。

## US2 提前准备（P1，依赖US1）

独立验收：可见候选预取、搜索结果预取、触摸/键盘意图、完成缓存命中和60秒过期后的正常读取。

- [ ] T006 [US2] src/scripts/reading-prefetch.ts和astro.config.mjs接入有界预取；public/_headers启用60秒公开HTML缓存。
- [ ] T007 [US2] tests/navigation.spec.ts覆盖候选上限、慢网降级、缓存/失败边界。

## US3 稳定回退（P1，依赖US1）

独立验收：最后一次点击生效，异步旧搜索不污染新页面，无法获取路由时退回普通导航，无脚本可阅读。

- [ ] T008 [US3] tests/navigation.spec.ts验证慢响应连续点击、失败回退、修饰键/外站及无脚本；修复实际失败。

## 验证与交付

- [ ] T009 按最终gzip实测修改scripts/budget-policy.ts门槛及docs/system/rules.md说明，运行verify与budget。
- [ ] T010 更新docs/features/article-read.md、explore-browse.md及对应系统说明、功能和spec索引、源码摘要。
- [ ] T011 Playwright Chromium/手机/WebKit及ego-browser体验，证据存resources/evidence/005-continuous-navigation；不把模拟写成真机。
- [ ] T012 保存推送进度，更新PR #4清单/验证/预览，spec/plan/tasks据实同步完成状态。

本任务单写者依依赖顺序执行；独立研究已完成，实施不并行改同一文件。当前没有相关失败经验需要追加。
