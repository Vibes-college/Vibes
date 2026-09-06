---
tense: 'frozen'
describes: '功能文档整理任务'
status: 'in-progress'
amended-by: []
---

# 执行清单

- [x] T001 按用户模板重写docs/features/_TEMPLATE.md及五条用户操作路径文档，移除已归并的七篇。
- [x] T002 在scripts/docs-index.ts支持legacy-feature-ids，并在tests/unit/docs-policy.test.ts验证合法归并、冲突和缺失失败。
- [x] T003 同步AGENTS、宪章、docs/README、功能/spec索引、配置/规则/操作文档及模板引用，保留历史规格正文。
- [x] T004 核对文档栏目、文件路径、测试名称、冻结正文，运行npm run check，记录真实结果。

验收：2026-09-06本机隔离工作树npm run check通过，36项单元测试全绿；五篇文档栏目、引用路径和测试名称人工/脚本核对，001/002正文与origin/main一致。共享工作区另有未跟踪docs/PROJECT_ANALYSIS.md触发白名单错误，未修改或纳入本次变更；本次未执行网页E2E或部署。
