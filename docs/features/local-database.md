# 功能名：本地测试库重建与迁移

## 状态

✅ 已完成（当前本地实现范围）

## 一句话说明

维护者能恢复一份干净的本机测试库，或只应用新的数据库结构。

## 用户操作路径

1. 关闭正在运行的本地预览。
2. 需要干净测试环境时运行 `npm run db:reset`，它会删除本地测试数据并重新填入两条记录。
3. 只更新数据库结构时运行 `npm run db:migrate`。
4. 看到命令成功提示；详细用法见 [CLI](../CLI.md)。

## 涉及的文件

- [scripts/database.ts](../../scripts/database.ts)
- [scripts/local-tools.ts](../../scripts/local-tools.ts)
- [db/migrations/0001_local_test_records.sql](../../db/migrations/0001_local_test_records.sql)
- [db/seed.sql](../../db/seed.sql)
- [wrangler.local.jsonc](../../wrangler.local.jsonc)

数据库：本地 `local_test_records` 表，定义见上方迁移文件。

## 验收标准

- [ ] 重建后 `local_test_records` 有两条固定测试记录。
- [ ] 重复执行迁移，不重复应用已完成的迁移。
- [ ] 命令带上 `--remote` 或其他额外参数时失败，不执行数据库操作。
- [ ] 操作仅限本项目 `.wrangler/project-local/` 下的本地 D1。

## 对应的自动化测试

`tests/unit/database.test.ts`：`migrations and seed create usable records with unique names`、`database commands reject remote and unexpected arguments`；运行 `npm run test:unit`。

`npm run verify` 实际执行重建；迁移重复执行和完整命令边界需要运行对应命令核对。

## 依赖的其他功能

无。

## 已知问题 / 待办

只有本地命令验收表，没有线上 D1 或产品业务表。网站卡片不读取这个数据库。重建会删除本地测试数据；结构说明和建表 SQL 见 [DATABASE.md](../DATABASE.md)，迁移文件是执行来源。

## 最近核对

- 日期：2026-09-05。
- 依据：当前本地源码、命令配置及真实测试文件；本次为文档核对，没有重跑浏览器或线上验收。
- 验收框留空，供下一次实际验收逐项勾选；已有代码不等于所有边界都有自动测试。
