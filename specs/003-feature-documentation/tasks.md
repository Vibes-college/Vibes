---
tense: 'frozen'
describes: '功能文档整理任务'
status: 'complete'
amended-by: []
---

# 执行清单

- [x] T001 按用户模板重写docs/features/_TEMPLATE.md及五条用户操作路径文档，移除已归并的七篇。
- [x] T002 在scripts/docs-index.ts支持legacy-feature-ids，并在tests/unit/docs-policy.test.ts验证合法归并、冲突和缺失失败。
- [x] T003 同步AGENTS、宪章、docs/README、功能/spec索引、配置/规则/操作文档及模板引用，保留历史规格正文。
- [x] T004 核对文档栏目、文件路径、测试名称、冻结正文，运行npm run check，记录真实结果。

- [x] T005 整合PROJECT_ANALYSIS与PRODUCT_OVERVIEW，归并system说明并删除指定清单与参考图，核对当前实现与旧描述。
- [x] T006 增加源码对应和本地链接检查、只读摘要输出、complete实现状态及有效验收保留规则，更新自动测试与制度。
- [x] T007 运行完整check并验证源码变化、缺失映射、失效链接与状态遗漏的失败场景；恢复测试修改并收尾。

验收：2026-09-06实际工作区npm run check通过（类型、lint、格式、文档对应检查及43项单元测试）；临时Git用例验证源码漂移和未覆盖新增代码失败、complete基线冻结、只读摘要不修改文档。当前文档无失效本地链接，指定文件已移除，001/002历史正文未改；产品源码相对be9dd7a无变化，保留此前仍有效的产品验收，不重复声称发布。
