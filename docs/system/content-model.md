---
tense: 'living'
describes: '数据和内容结构'
status: 'current'
shaped-by: ['001', '003', '009', '010']
code-sources:
  [
    'src/lib/content/',
    'src/lib/media/',
    'src/config/media.ts',
    'src/content.config.ts',
    'src/data/',
    'db/',
    'scripts/database.ts',
    'scripts/validate-content.ts',
    'scripts/migrate-content.ts',
  ]
code-revision: 'c0b57a495afae26ac876c3f69ae97d663b979ff403c52cb103d7dbf29b074703'
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

需要交互时用`zh.mdx`或`en.mdx`替代对应文件，同一语言同时存在.md和.mdx会报错。正文后缀不进入作品ID或路由。组件源码放src/components，作品目录仍只放work.json和语言正文。

`en.md`（或`en.mdx`）也可以不存在，或存在但仍是 `draft`；只有 `published` 才会生成英文页面。

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

## 多媒体资料与展示

旧preview与previewText继续必填；未配置媒体时渲染原有封面。media、presentation同时提供才启用富媒体，已发布语言必须为所有素材提供mediaText。

| 位置/字段               | 作用                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| work.json的media[]      | 带稳定id和provenance（HTTPS来源、credit、license）的素材联合结构                                                        |
| image                   | src、实际width/height、bytes、variants；focalPoint为0–1坐标；动画需animated和静态posterId                               |
| video                   | sources（src/type/bytes）、宽高、duration、hasAudio、posterId、loop；可附captions和chapters                             |
| audio                   | sources、duration、artworkId、从实际PCM提取的waveform；可附captions和chapters                                           |
| embed                   | provider与resourceId、posterId；YouTube/B站视频ID、Spotify track/album/episode/playlist路径、site登记键                 |
| demo                    | 仅已登记componentId=orbit及有界config；原站/骨骼动画使用site嵌入，2048登记键加载MIT源码沙盒版                           |
| chart                   | dataset、columns（key/unit）、chart（line/scatter/bar、x、series）、controls、dataAsOf、sourceLocator、posterId         |
| presentation            | card（mediaId、image/motion/audio/embed模式、cover/contain）、detail.items顺序、静态fallbackId                          |
| 语言文件的mediaText[id] | title、图像alt、caption/hint、chapters标签、transcript（可带start）、columns标签、context与keyResults（值/标签/上下文） |

字幕使用zh/en WebVTT；章节ID唯一且时间递增，不能超出duration。图表dataset只接受随站发布的`/media/*.json`或`/media/*.csv`本地文件；外部原始数据先核对并保存本地，浏览器不直连远端数据源，保持connect-src self。图表只接受有界的纯数值JSON行数组或CSV（不支持带引号单元格），列名必须与映射一致，拒绝空值、非有限数字、超行数和超体积；keyResults是带上下文的编辑摘要，不能用装饰图替代数值。来源更新日期dataAsOf与原始采集时间分别说明。

本地路径仅允许public下的/media和/images，校验符号链接越界、缺文件、实际字节、字幕头和数值；外站仅允许登记HTTPS来源，远端内容及真实尺寸需编辑实查。搜索只投影卡片所需海报、短源、时长、试听波形或嵌入ID，不投影完整录音、字幕、图表数据、演示配置和全文媒体说明。媒体资料、展示和原文mediaText纳入原文摘要，旧的无媒体作品摘要保持原规则。

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
- `anchor`：站内正文锚点，例如跳到“阅读正文”。构建时会检查这个锚点真实存在。MDX事实目标限静态Markdown生成的锚点或reading，组件运行时生成的ID不能作为此目标。

## 4 Markdown 语言版本的 front matter

每份`zh.md`、`en.md`或对应`.mdx`文件头使用同一schema：

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

普通Markdown正文编译为HTML；MDX原生渲染Content，在构建时输出正文及islands初始HTML。MDX的静态主标题形成章节元数据，import和JSX保留在编译树；两种格式都保留表格、来源与锚点。原文摘要包含正文中的import/参数文字，不包含被导入组件文件的内容；组件变化需额外复核译文。

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

`heading`、`body`。普通Markdown保存章节HTML；MDX给目录提供转义后的标题与空body，实际正文由Content渲染，不转成字符串。

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
