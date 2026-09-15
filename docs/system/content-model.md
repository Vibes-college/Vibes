---
tense: 'living'
describes: '数据和内容结构'
status: 'current'
shaped-by: ['001', '003', '009', '010', '018']
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
code-revision: '59964ae81b35a963f0175a29f1b9a4b3a6c1280477bb40bc0646d9175fc0fcb9'
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

## 交互学习材料

Great UI学习页沿用work.json加每语言一份Markdown，ID为great-ui-<slug>。普通目录只列合集，所有已发布子项仍生成页面和全文索引。学习页使用共享交互模板，不能把正文换成MDX。

| 位置                   | 内容与校验                                                                                                                                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| work.json的learning    | slug、collectionId、english、revision、implementation、previewSource、media、capability                                                                                                                                                                         |
| 固定来源               | revision是40位提交摘要；implementation和previewSource分别为components/ui与components/site/previews中的TSX路径                                                                                                                                                   |
| media                  | video或image二选一，加必填poster；仅/great-ui/media下的MP4、PNG、JPG、WebP或AVIF，校验文件存在、非空、符号链接边界；高清视频最大2MiB，图片最大200KiB；mobile/card可选，含video/poster/width/height/duration，card最大150KiB且≤12秒，高清≤60秒；尺寸为1–3840整数 |
| capability             | family、roles、provides、requires、resources、adaptations、reducedMotion、decorativeTransition，供组合规则判定                                                                                                                                                  |
| 语言文件头learning     | category、classification、placementHint、changesHint、preserve、checks、goals、adjustments、glossary                                                                                                                                                            |
| goals                  | 非空列表，每项id、title、action、judge，ID不得重复；三个面板与任务引用同一组目标                                                                                                                                                                                |
| adjustments / glossary | 三列调整表；术语以局部ID映射term（共享词条ID）、context、parameter、judgment；不接受本地重复definition                                                                                                                                                          |
| 正文                   | 按顺序保留拆解设计、改造设计、串联设计三个二级标题；第一节保留适合用在哪里、什么时候不用、试一次，就会更懂三级标题                                                                                                                                              |

正文编译为可供React安全渲染的结构树，支持段落、强调、列表、链接、代码和术语按钮；拒绝原始HTML、未知术语及不支持的元素。原始文字同时进入任务文本/JSON与全文索引。文件头、正文及引用词条的完整内容都纳入原文摘要。写作示例与修改步骤见[维护同一份材料](../features/great-ui-learning.md#维护同一份材料)。录制依据见[录制演示](../features/recording-previews.md)，素材路径以public/great-ui/media和来源登记为准。

合集封面由同语言已发布成员的media.card投影生成，保存ID、标题及轻量素材索引，HTML只渲染当前一件。搜索输出使用同一结构并校验成员唯一性、来源和禁止嵌套合集；gzip上限6KiB由当前48件的单元测试约束。任务的media.url为桌面绝对地址，只有手机素材不同才另提供mobileUrl，页面预览与Agent引用保持同一来源。

### 共享术语文件

src/content/glossary/terms/<id>.md包含id、title、english、aliases、category、provenance和sources。分类为基础概念、技术工具、触发方式、动效类型、UX规则；来源方式为原文摘录与补充、原文概述整理、案例整理。每个来源包含title、author、HTTPS url及section，不能夹带账号密码。ID须匹配文件名，名称及别名规范化后不得跨词条冲突。

正文一级标题与中英文名称一致，第一段纯文本为统一definition，其后依次为常见变体、适合用在哪里、什么时候不用、提示词例子四节。sources目录保留原始文章；索引与模板不作为词条加载。读取器只为作品保留其引用的词条，浏览器及任务只导出名称、分类、解释、出处和本例说明，不携带整库或完整长文。模板与收录步骤见[共享词库](../../src/content/glossary/README.md)。

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
