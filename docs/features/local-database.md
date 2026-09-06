---
tense: 'living'
describes: '功能名：本地测试库重建与迁移'
status: 'current'
shaped-by: []
---

# 本地测试库重建与迁移

## 当前行为

关闭本地预览后，npm run db:reset删除本项目本地测试数据、重建结构并填两条记录；db:migrate只应用新迁移，不重复应用。带--remote或任何额外参数均失败；操作固定.wrangler/project-local，不接线上库，网站不读取此库。

## 文件与依赖

scripts/database.ts、scripts/local-tools.ts、db/migrations/0001_local_test_records.sql、db/seed.sql、wrangler.local.jsonc。local_test_records表结构见 [DATABASE](../technical/DATABASE.md)，操作见 [CLI](../operations/CLI.md)。

## 验收与测试

重建后两条数据、重复迁移不重复、非法参数不执行。tests/unit/database.test.ts验证唯一性和拒绝远程参数；verify执行真实重建。重复迁移完整命令需实际运行验证。
