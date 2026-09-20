---
tense: 'frozen'
describes: '开源UI指南接入任务'
status: 'in-progress'
amended-by: []
---

# 开源UI指南任务

## 实现与用户路径

- [ ] T001 [US4] 核对包内源码blob、来源和许可，将有效资产及记录接入src/features/ui-topic与public/ui-topic、public/media/ui-topic、public/licenses。
- [ ] T002 [US1] 在scripts中适配固定预览构建与局部CSP，保持父页策略，增加tests/unit中的安全边界验证。
- [ ] T003 [US1] 接入TopicSection.astro与原zh.mdx，适配ui-topic.css的宽度、弹窗、移动端和助手占位，保持目录/翻页。
- [ ] T004 [US2] 完成选择编辑、任务与代码复制、失败退路及既有助手入口，并修复client.ts生命周期清理。
- [ ] T005 [US3] 验证图片比较、格式/大小/解码失败、替换与URL清理，不上传文件。
- [ ] T006 [US4] 将旧beUI回归移到tests/fixtures的测试构建载体；tests/ui-topic.spec.ts覆盖新版实际操作、无JS、减少动画和导航。

## 验证与现状同步

- [ ] T007 运行完整verify、budget与部署预检，在内置浏览器核对桌面、手机及助手入口，保存证据。
- [ ] T008 复核并更新docs/features/article-read.md、content-maintenance.md、project-commands.md及受影响docs/system文件，同步源码摘要和索引。
- [ ] T009 完成独立审查和最终提交复核，更新PR、spec/plan/tasks与索引中的真实完成状态。

## 交付引用

PR、发布与收尾遵循docs/system/checks-and-release.md；动态进度只写PR。生产部署和页面核验据实际结果记录，不提前勾选或预测。
