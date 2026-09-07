---
tense: 'living'
describes: '数据和内容结构'
status: 'current'
shaped-by: ['001', '003']
code-sources:
  [
    'src/lib/content/',
    'src/content.config.ts',
    'src/data/',
    'db/',
    'scripts/database.ts',
    'scripts/validate-content.ts',
    'scripts/migrate-content.ts',
  ]
code-revision: 'fc416b4990131b6c36ce905eba9d2ae358806dcabab37f1265301121f7df796e'
---

# 数据和内容结构

网站内容保存为作品文件，本地D1只测试命令。编辑步骤见[维护作品内容](../features/content-maintenance.md)。

## 1 内容文件结构

每个作品通常是：

```text
src/content/works/<id>/
├── work.json   # 作品不随语言变化的资料
├── zh.md       # 中文版本
└── en.md       # 可选英文版本
```

`en.md` 也可以不存在，或存在但仍是 `draft`；只有 `published` 才会生成英文页面。

## 2 `work.json`：作品共享资料

| 字段             | 类型                               | 给人的含义                                 |
| ---------------- | ---------------------------------- | ------------------------------------------ |
| `id`             | 小写字母、数字和短横线组成的字符串 | 作品的稳定身份，也用于网址                 |
| `originalLocale` | `zh` 或 `en`                       | 这件作品最初用哪种语言维护                 |
| `order`          | 非负整数                           | 目录中显示的顺序                           |
| `sourceUrl`      | 不带账号密码的 HTTPS 地址          | 原始作品的网址                             |
| `typeId`         | 标签 ID                            | 内容类型，例如 `paper`、`code`             |
| `tagIds`         | 标签 ID 数组                       | 额外分类，例如创作者                       |
| `preview`        | `kind` + `color`                   | 卡片上的抽象预览图类型和背景色             |
| `facts`          | `Fact[]`                           | 详情页的作者、类型、主题等事实             |
| `related`        | `RelatedWork[]`                    | 已实现校验与双向读取；当前详情未展示关系区 |

## 相关作品记录

每条related包含目标作品ID `targetId` 与可分别提供zh/en文字的 `reason`。校验拒绝缺失目标、自关联及正反向重复，读取函数可从任意一方查到关系；数据模型不意味着页面已经展示关系区。当前WorkDetail没有相关作品区。

## 3 `Fact`：详情页事实信息

| 字段     | 类型                                                                     | 给人的含义                         |
| -------- | ------------------------------------------------------------------------ | ---------------------------------- |
| `key`    | 稳定 ID                                                                  | 事实的内部名称，例如 `author`      |
| `kind`   | `text`、`author`、`type`、`topic`、`date`、`source`、`prompt` 或 `skill` | 事实的类别                         |
| `label`  | 可分别提供 `zh`、`en` 的文字                                             | 事实名称，例如“作者”               |
| `value`  | 可分别提供 `zh`、`en` 的文字                                             | 事实内容                           |
| `target` | 可选的目标                                                               | 点击后去外部链接、标签页或正文锚点 |

`target` 有三种形式：

- `link`：一个 HTTPS 外部链接。
- `tag`：站内标签 ID，跳到对应语言的筛选页。
- `anchor`：站内正文锚点，例如跳到“阅读正文”。构建时会检查这个锚点真实存在。

## 4 Markdown 语言版本的 front matter

每份 `zh.md` 或 `en.md` 的文件头包括：

| 字段                  | 类型                            | 给人的含义                     |
| --------------------- | ------------------------------- | ------------------------------ |
| `locale`              | `zh` 或 `en`                    | 文件语言，必须和文件名一致     |
| `status`              | `draft` 或 `published`          | 是否对访客公开                 |
| `title`               | 非空字符串                      | 标题                           |
| `summary`             | 非空字符串                      | 列表卡片上的短摘要             |
| `description`         | 非空字符串                      | 详情页简介                     |
| `previewText.eyebrow` | 字符串                          | 预览图上的小标签               |
| `previewText.display` | 非空字符串                      | 预览图上的主文字               |
| `previewText.note`    | 字符串                          | 预览图上的补充文字             |
| `sourceRevision`      | 可选的 64 位小写 SHA-256 字符串 | 译文最后一次核对的原文版本摘要 |

front matter 后面的 Markdown 正文会被编译成 HTML；代码会保留表格、来源、标题和锚点。

## 5 `taxonomy.json`：标签字典

每条标签有：

- `id`：稳定标签 ID。
- `kind`：`type`、`topic`、`creator`、`person`、`company` 或 `paper`。
- `labels.zh`、`labels.en`：中英文显示名。
- `aliases.zh`、`aliases.en`：中英文搜索别名。

当前标签以src/data/taxonomy.json为准，不手工维护数量。类型标签包括：`code`、`paper`、`website`、`video`、`audio`、`article`。

## 6 程序运行时的主要对象

这些不是数据库表，而是页面生成期间在内存中使用的对象：

### `WorkView`

一个“当前语言下、可以展示给访客的作品”：

`slug`、`locale`、`originalLocale`、`type`、`creator`、`url`、`title`、`summary`、`description`、`preview`、`color`、`eyebrow`、`display`、`note`、`meta`、`needsReview`。

### `BrowsePage`

一个列表页：

`locale`、可选的 `tag`、`page`、`total`、`pages`、`works`、`path`。

### `WorkFact`

详情页显示后的事实：

`label`、`value`、可选 `href`、`external`、可选 `fallbackLocale`。

### `ArticleSection`

正文章节（始终展开）：

`heading`、`body`。

### `PreviewData`

卡片预览：

`preview`、`color`、`eyebrow`、`display`、`note`。

## 7 数据库表

网站运行时不读取数据库。仓库只有一个本机 D1 测试表 `local_test_records`，用于验证迁移和重建命令：

| 字段          | 类型和规则             | 用途                   |
| ------------- | ---------------------- | ---------------------- |
| `id`          | `INTEGER PRIMARY KEY`  | 测试记录编号           |
| `name`        | `TEXT NOT NULL UNIQUE` | 测试记录名称，不能重复 |
| `description` | `TEXT NOT NULL`        | 测试说明               |

`db/seed.sql` 只插入两条固定测试数据。没有用户、文章、权限、订单、支付或业务内容表，也没有线上 D1 业务库。

## 本地数据库迁移与重建

1. 新结构写成 `db/migrations/` 下的新编号 SQL；不要重写已经应用的历史迁移。
2. `npm run db:migrate` 只应用本地未完成迁移；不自动填测试数据。
3. `npm run db:reset` 删除本项目专用本地 D1 数据，重放迁移，再执行测试数据 SQL。它会删除本机测试数据，运行前关闭预览。
4. `npm run test:unit` 用内存 SQLite 检查建表、测试数据、唯一约束，以及本地命令拒绝额外参数。

Wrangler 还会维护迁移记录等内部表；它们不是产品业务表，交给工具管理。实际 D1 状态位于 `.wrangler/project-local/v3/d1`，不提交、不部署。

本地绑定定义在 `wrangler.local.jsonc`；数据库 ID 是本地模拟标识，不能当作真实线上资源 ID。命令固定带 `--local`，额外的 `--remote` 会被拒绝。

当前没有线上迁移、备份恢复、数据同步或业务 API；需要这些能力时单独设计并在功能地图登记。

迁移文件中的旧内容路径注释保留原样；当前网站内容源为src/content/works/，未改写已应用迁移。
