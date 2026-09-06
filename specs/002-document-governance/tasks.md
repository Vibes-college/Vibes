---
tense: 'frozen'
describes: '文档治理任务'
status: 'in-progress'
amended-by: []
---

# 文档治理任务

- [x] T001 在 `.specify/memory/constitution.md`、`AGENTS.md` 定义时态、冻结、导航、篇幅指南和同步义务。
- [x] T002 在 `.specify/templates/overrides/` 裁剪模板，在 `specs/001-multilingual-explore/` 保留必要决定并删除重复说明。
- [x] T003 在 `scripts/docs-frontmatter.ts`、`scripts/docs-policy.ts`、`scripts/docs-index.ts`、`scripts/docs-check.ts` 实现标签、白名单、索引、关系、冻结检查及篇幅提示。
- [x] T004 在 `tests/unit/docs-policy.test.ts`、`tests/unit/docs-check.test.ts` 验证有效输入和篡改/删除/基线缺失拒绝路径及长文档不误报。
- [x] T005 在 `package.json`、`.github/workflows/check.yml` 接入check/verify和每周体检，同步 `docs/operations/CLI.md`、`CI.md` 与 `docs/technical/`。
- [x] T006 在实际仓库完成check/verify/budget及模板解析，检查结果在交付中报告，供PR审阅使用；不合并或发布。
- [x] T007 在 `scripts/check-scope.ts`、`.github/workflows/check.yml` 和单元测试实现按影响检查及失败保护。
- [x] T008 在 `scripts/test-e2e.ts`、`playwright.config.ts`、`tests/explore.spec.ts` 统一自动化E2E并验证触摸与320px覆盖，移除重复ego脚本。
- [x] T009 全面审阅 `AGENTS.md`、宪章、模板、治理检查器与CI规则，完成实际check/verify/budget及文档一致性检查。
- [x] T010 更新 `docs/features/document-governance.md`、`project-commands.md`、`spec-kit-workflow.md`、`delivery-setup.md` 为合并后的最终行为，更新shaped-by；更新 `docs/features/README.md` 与 `specs/README.md` 状态，未完成则converge不通过。
