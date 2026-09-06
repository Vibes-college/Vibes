---
tense: 'living'
describes: '数据库结构'
status: 'current'
shaped-by: []
---

# 数据库结构

目前只有一个**本机测试库**，用于验证重建和迁移命令；线上 D1 尚未创建，网站内容仍来自 `src/content/works/`，不是从数据库读取。

## 表：local_test_records

| 字段          | 类型    | 规则                | 用途             |
| ------------- | ------- | ------------------- | ---------------- |
| `id`          | INTEGER | 主键；SQLite 行标识 | 区分测试记录     |
| `name`        | TEXT    | 必填、唯一          | 测试记录名称     |
| `description` | TEXT    | 必填                | 给人看的测试说明 |

没有外键、用户、密码、订单或文章业务表。唯一名称约束由数据库执行；没有另建重复的索引。

## 建表 SQL

来源：`db/migrations/0001_local_test_records.sql`。下面是当前文件原文；变更后同步更新本页。

```sql
-- 命令验收专用表；网站目前仍从 src/data/works.json 读取内容。
CREATE TABLE local_test_records (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);
```

## 测试数据 SQL

来源：`db/seed.sql`，仅供本地重建。

```sql
-- 固定测试数据，仅由本地 db:reset 使用。
INSERT INTO local_test_records (id, name, description) VALUES
  (1, 'first-example', '第一条本地测试记录'),
  (2, 'second-example', '第二条本地测试记录');
```

## 怎样变更和验证

1. 新结构写成 `db/migrations/` 下的新编号 SQL；不要重写已经应用的历史迁移。
2. `npm run db:migrate` 只应用本地未完成迁移；不自动填测试数据。
3. `npm run db:reset` 删除本项目专用本地 D1 数据，重放迁移，再执行测试数据 SQL。它会删除本机测试数据，运行前关闭预览。
4. `npm run test:unit` 用内存 SQLite 检查建表、测试数据、唯一约束，以及本地命令拒绝额外参数。

Wrangler 还会维护迁移记录等内部表；它们不是产品业务表，交给工具管理。实际 D1 状态位于 `.wrangler/project-local/v3/d1`，不提交、不部署。

本地绑定定义在 `wrangler.local.jsonc`；数据库 ID 是本地模拟标识，不能当作真实线上资源 ID。命令固定带 `--local`，额外的 `--remote` 会被拒绝。

当前没有线上迁移、备份恢复、数据同步或业务 API；需要这些能力时单独设计并在功能地图登记。

迁移文件中的旧内容路径注释保留原样；当前网站内容源为src/content/works/，未改写已应用迁移。
