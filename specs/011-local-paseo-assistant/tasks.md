---
tense: 'frozen'
describes: 'Explore本地助手执行清单'
status: 'in-progress'
amended-by: []
---

# 本地助手任务

## 基础与用户故事

- [x] T001 建立spec/plan/research、质量清单与Draft PR，核对发布SDK和宪章边界。
- [x] T002 在package.json固定获授权依赖，astro.config.mjs修复精确relay入口，验证浏览器构建。
- [x] T003 [US1] 在tests/unit/assistant.test.ts先覆盖合法/非法配对、存储清除和过期连接隔离。
- [x] T004 [US1] 实现src/lib/assistant/pairing.ts、paseo-client.ts、store.ts及设备/会话选择界面，验证可连、失败、断开和忘记。
- [x] T005 [US2] 在tests/unit/assistant.test.ts覆盖文本片段、工具生命周期、重复事件与上下文边界。
- [x] T006 [US2] 实现timeline.ts、安全消息与assistant-ui runtime，WorkDetail.astro输出公开上下文，完成发送与流展示。
- [x] T007 [US3] 覆盖并实现真实权限actions/question、确认后更新、取消、运行禁发与结果未知错误，绑定原会话。
- [x] T008 [US4] 覆盖并实现权威历史分页、重连重订阅、刷新恢复、切换会话与generation隔离。
- [x] T009 [US4] 实现AssistantHost.astro、assistant-boot.ts、assistant.ts、assistant-app.tsx及官方作用域样式，验证持久导航、320px、焦点及中英文。
- [x] T010 更新CSP及scripts/script-budget.ts、budget-policy.ts与单元测试，确保显式加载和独立硬预算。

US1独立验收：配对后列出真实设备会话/provider，新建或选择并显示目录；失败可重试与忘记。
US2独立验收：选择作品资料并发送，连续回复与工具更新不重复，可不附带资料。
US3独立验收：真实允许/拒绝/回答和停止等待远端确认；断线不伪造成功。
US4独立验收：刷新、断线、跨页、换会话后无串流/重发，恢复历史可向前翻页。

## 验证与现状同步

- [x] T011 在tests/assistant.spec.ts及受控协议夹具覆盖完整成功/失败/恢复，运行完整verify与budget。
- [x] T012 用官方daemon完成真实配对、会话与受控任务，保存去秘密的版本/结果证据；内置浏览器审阅桌面和手机布局，真机待测单列。
- [x] T013 更新docs/features/local-assistant.md、article-read.md、explore-browse.md、project-commands.md、docs/system/local-assistant.md及受影响检查/配置说明与索引，逐项复核文字再更新源码摘要。
- [x] T014 按speckit-converge核对spec/plan/tasks与实现，全部完成后状态及索引同步complete，提交推送并更新PR预览/证据。
- [x] T015 新会话独立Agent审查整个PR，修复并复核最终SHA，必要检查通过后转Ready并交付用户合并入口。
- [x] T016 在Cloudflare预览分别记录点击后加载、同页模块复用、压缩响应与重启浏览器后的缓存，区分本地gzip预算、实际传输和代码执行；同步结果及限制。

## 手机实测后的研究与待确认边界

既有通过项保留其原环境和范围，不当作Safari长期恢复已通过。用户要求先盘点，本阶段不继续产品编码；US4/FR008的真机恢复问题尚未解决，规格恢复in-progress。

- [x] T017 拉取Lody iOS/Cindy固定源码快照，对比旧Paseo与当前的功能、加载、恢复、权限和维护成本，将结论与证据边界写入research并建立长期索引。
- [ ] T018 取得Safari失败工具/连接阶段的去秘密证据，定位失败层并确认下一步实施范围；研究建议不直接视作获准的新功能任务。
- [ ] T019 后续修复后补真机后台、断网、锁屏、电脑唤醒及待审批恢复验收，再按实际差异复核完整PR的Ready条件。

- [x] T020 按用户要求拆解旧complete-root，建立逐模块源码映射、功能成本表、约7KB恢复核心试件及模拟验证；明确接入与真机验收仍未完成。
- [x] T021 评估源码移植与重写边界、Cindy/Lody采用时机、本地可观测性、成本约束及分层E2E/真机矩阵，写入research；方案未实施，不把建议当作验证通过。

## PR工作台与经验复核

依赖顺序T001→T002→US1→US2→US3→US4→预算和浏览器验收→文档/收敛→独立审查。相同文件由主Agent维护，不并行编辑。阶段完成更新PR #10的清单、进度、阻塞与对应预览SHA，落实异步导航、串行E2E及iOS手势经验；合并后的文档核对、部署与清理写PR收尾评论，不提前勾选未完成项。
