---
tense: 'frozen'
describes: 'Paseo接入的需求澄清与分阶段交付清单'
status: 'draft'
amended-by: []
---

# 先确认需求，再展开实施

本清单保留用户明确要求的讨论顺序。实现任务在目的、必要功能和代价确认后细化；当前没有已授权的完整实施计划，不能直接进入implement或声称已完成tasks生成。

## 需求与取舍

- [x] T001 核对main、PR #10/#11和旧complete-root固定源码，把可复用经验与证据限度写入research.md。
- [ ] T002 在spec.md记录用户举出的核心例子：看到什么、想让助手做什么、最终得到什么，以及为什么需要本地Agent。
- [ ] T003 在spec.md澄清Chat/Build原本解决的问题、必要权限和目录设置负担，区分真实需求与旧实现手段。
- [ ] T004 在spec.md澄清compact/full/standalone各自场景，标记必需、可选、不需要的功能，补成功与失败路径。
- [ ] T005 基于回答修订plan.md，向用户解释候选在使用体验、稳定性、维护、安装和费用上的收益与代价，再确定接入路径与依赖范围。
- [ ] T006 按确认结果重写spec.md/plan.md及checklists/requirements.md，敲定有依据的验收门槛与边界。
- [ ] T007 在tasks.md生成按US1—US4和真实文件路径排序的实施任务；先独立审阅需求/计划/任务一致性，再进入实施。

## 实施与交付关卡（确认后细化）

- [ ] T008 [US1] 在确认的宿主与构建路径完成最小原生接入、安装引导与准备/失败重试，tests/paseo.spec.ts验证首次与回访路径。
- [ ] T009 [US2] 按确认后的模式/表面范围完成原生会话、草稿、公开资料、工具与审批，测试与真实运行证据保存resources/evidence/013-paseo-web-integration/。
- [ ] T010 [US3] 在确认的宿主活动适配与tests/paseo.spec.ts验证收起、重开、导航、刷新、断线及未知操作边界。
- [ ] T011 [US4] 以plan.md冻结的同设备负载完成六阶段对照，证据保存resources/evidence/013-paseo-web-integration/；只按实际体验瓶颈决定修正。
- [ ] T012 在docs/features/local-assistant.md及受影响features/system说明中同步最终行为、源码对应和有效验收；更新两个索引与PROJECT_ANALYSIS.md。
- [ ] T013 按整个PR实际范围完成verify与budget、同SHA预览与真实浏览器验收，PR记录环境、范围和未测项。
- [ ] T014 由独立工作区的另一Agent审查整个PR及最终SHA，修复并复核后才转Ready；全部任务完成时同步spec/plan/tasks与索引为complete。

## 依赖与并行

T002—T004随用户回答逐轮收敛，不一次提出所有问题。T005依赖核心用途和必要功能；T006—T007确认后才开展T008。T009、T010在同一个原生接入上验证，T011依赖正确性；不能让性能优化抢在用途与稳定性前面。可独立并行来源核查与规格审阅，不并行编造多个产品架构。

## PR工作台与经验复核

本PR保持Draft并保存进度，PR描述区分已确认、待讨论、验证与下一步；旧分支保持原状。docs/LESSONS.md中导航、真实设备与媒体回归经验继续适用。用户选择方案后同一PR推进，代码与文档一起交付；合并另由用户明确决定，合并后核对文档、部署验收、同步与清理结果记在PR。
