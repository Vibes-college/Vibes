---
tense: 'frozen'
describes: 'PR交付工作台执行清单'
status: 'in-progress'
amended-by: []
---

# PR交付工作台执行清单

## 基础

- [x] T001 建立specs/004-pr-delivery-workbench/spec.md与Draft PR，保留003相关文档成果；用户已确认计划及正式域名。
- [x] T002 在specs/004-pr-delivery-workbench/research.md记录实际域名、凭据与检查触发研究及回滚边界。

## US1 PR工作台与节约检查

- [x] T003 [US1] 实现.github/workflows/check.yml及scripts/ci-policy.ts，测试Draft、Ready、main和手动预览触发门槛。
- [x] T004 [US1] 更新AGENTS.md、宪章、PR模板与.specify/templates/overrides，规范首版PR、阶段推送及handoff。

## US2 预览、正式发布与清理

- [x] T005 [US2] 实现scripts/release*.ts的同SHA产物发布、预览、过时提交拒绝及失败检查；更新wrangler.jsonc与src/config/site.ts。
- [x] T006 [US2] 核对Cloudflare正式域名绑定与回滚路径，配置最小必要的GitHub部署身份，不输出秘密。
- [x] T007 [US2] 实现scripts/cleanup*.ts的已合并、已部署且无未保存工作的清理保护与测试。
- [ ] T008 [US2] 验证远端阶段预览与PR可见清单，检查合并后发布/清理入口和拒绝路径；真实首次上线与收尾由PR合并后跟进，不在合并前虚假勾选。

## US3 原则与经验

- [x] T009 [US3] 迁移docs/DECISIONS.md，建立docs/LESSONS.md三行记录及30条上限，测试历史保护与经验格式。

## 验证与现状同步

- [x] T010 同步docs/features/document-governance.md、project-commands.md与索引、docs/system配置/规则/接口/交付及源码摘要。
- [ ] T011 运行npm run verify、npm run budget、git diff --check，更新PR实际验收结果；不把合并前工作写成上线成功。

依赖：T001→T002→T003/T009→T004/T005→T006/T007→T008→T010→T011；独立只读研究可并行，实现保持单一写入者。

## 合并后运行验收（PR持续跟进）

用户决定合并后，核对main部署与vibes.college线上版本、实际浏览搜索详情，再执行满足条件的清理。此项是运行状态，记录在PR评论和发布证据，不通过改写已冻结tasks来补记；失败保留资源并修复。首次正式上线尚未发生。
