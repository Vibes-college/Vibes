---
tense: 'frozen'
describes: '验收复用与生产检查执行清单'
status: 'complete'
amended-by: []
---

# 执行清单

## 基础

- [x] T001 在spec.md/checklists/requirements.md明确范围、边界与验收，建立Draft PR #13。
- [x] T002 在plan.md/research.md记录GitHub模拟合并、最新run/attempt、tree证明与单次准备设计。

## US1与US2：可信复用和完整回退

独立验收：相同树和可信成功记录允许复用；不完整或冲突证据回退full，不掩盖新的失败。

- [x] T003 [US1] 在tests/unit/ci-acceptance.test.ts覆盖证明成功、squash同树及身份/树差异。
- [x] T004 [US2] 在同一测试覆盖Draft、fork、跳过、旧attempt、最新失败、直接push、过期与API/下载异常回退。
- [x] T005 [US1] 在scripts/ci-acceptance-policy.ts实现小型记录校验与纯复用判定。
- [x] T006 [US2] 在scripts/ci-acceptance.ts实现记录生成和有界GitHub证据解析，输出复用来源或回退原因。

## US3：单次准备和生产路径

独立验收：完整路径只有一次paseo:ci，verify与budget均明确成功；快速路径重建生产产物但不重复完整回归。

- [x] T007 [US3] 在scripts/paseo-webui-build.ts及package.json增加受限生产准备入口，保留完整入口测试。
- [x] T008 [US3] 在.github/workflows/check.yml共享准备环境，接入复用/回退及同名budget gate，保留生产产物与权限边界。
- [x] T009 [US3] 在tests/unit/ci-workflow.test.ts验证快速/完整/Draft/失败依赖和产物提交边界。

## US1：产物与线上核验

独立验收：正确生产产物/响应通过，错误版本、安全策略或资源内容失败。

- [x] T010 [US1] 在tests/unit/release-smoke.test.ts覆盖双语页面、CSP、版本、Paseo SRI和预览载体成功/失败。
- [x] T011 [US1] 在scripts/release-preflight.ts与scripts/release-smoke.ts实现受限资源及响应核验，接入release-ci.ts与生产构建流程。

## 验证与现状同步

- [x] T012 更新docs/features/project-commands.md、local-assistant.md、docs/system/checks-and-release.md、local-assistant.md等实际受影响说明及code-revision，必要时澄清宪章/AGENTS与模板；索引和旧规格修订关系一致。
- [x] T013 按实际基础设施差异完成本地完整verify、budget、生产产物检查及失败回退测试，保存证据到resources/evidence/014-ci-release-reuse/；正式CI与首次main快速部署结果在PR验收，不由本地结果推断。
- [x] T014 由独立Agent审查整个PR及固定修复SHA，处理问题后复核；同步实现状态、验收范围和PR交付清单。最终文档SHA再次确认审查适用性，Ready正式CI成功后才通知用户合并，实际合并与上线由Git/PR记录。

## 顺序与执行策略

T001→T002→T003/T004→T005/T006→T007/T008/T009→T010/T011→T012→T013→T014。US1/US2共用证明边界，作为同一实现单元；US3在证明接口确定后接入。产物核验的测试设计可与证明实现分别研究，不并行改同一工作流。先使回退始终安全，再开放复用，不提供无证据快捷开关。

## PR工作台与经验复核

spec编号014，Draft PR #13；完整范围同一个PR交付，无新UI预览。保留既有浏览器串行和资源释放策略。合并/部署及PR12清理记录留对应PR，不写入living流水账；用户决定合并，新PR合并后再检查真实快速发布与清理。
