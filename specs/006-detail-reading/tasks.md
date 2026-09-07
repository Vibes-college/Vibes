---
tense: 'frozen'
describes: '详情交互执行清单'
status: 'complete'
amended-by: []
---

# 详情交互任务

## 基础

- [x] T001 核对参考视频与现有详情，建立spec.md、plan.md、research.md及PR #6。

## 用户故事

- [x] T002 [US1] 在WorkDetail.astro和detail.css移除语言控件并重排顶部导航；tests/explore.spec.ts验证位置与链接。
- [x] T003 [US2] 在detail.css与detail-paging.ts实现独立页面、门槛切页与短幅位移淡入；tests/explore.spec.ts验证轻滑不翻、明确翻页、反向返回、取消、进入正文后稳定、视口变化、长正文底部与减少动画。
- [x] T004 [US3] 在src/scripts/detail-gestures.ts实现长按、跟手、锁方向和取消；tests/explore.spec.ts验证真实触摸与排除区域。
- [x] T005 [US4] 在作品路由、ReadingProgress.astro与reading-progress.ts实现常显正文、弹性进度目录、长标题适配和完整键盘/锚点；tests/explore.spec.ts验证快速切换、目录关闭与进度。

## 验证与现状同步

- [x] T006 完成tests/navigation.spec.ts回归与verify、budget，保存resources/evidence/006-detail-reading证据。
- [x] T007 内置浏览器验证桌面、手机和展开效果，将视觉报告放resources/evidence/006-detail-reading/design-qa.md。
- [x] T008 同步docs/features/article-read.md、功能索引及受影响docs/system说明；复核源码摘要、spec状态与索引，推送PR进度及预览。

依赖顺序：T001→T002→T003→T004→T005→T006/T007→T008。实现按单一写入者执行，检查与只读材料读取可并行。每条US通过对应行为验收，不能用首屏完成替代全体验。
