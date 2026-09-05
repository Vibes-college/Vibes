# 常量、规则表与正则

这些是项目已经使用的固定选择、限制和校验规则。修改规则时，先改来源文件，再同步本页与相应测试；本页不会自动改变代码。

## 产品规则

| 名称 / 规则       | 当前含义                                                                                       | 原来在哪个文件                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| formats 分类表    | all All；code Code；paper Papers；website Websites；video Video；audio Audio；article Articles | src/data/works.ts                                                           |
| slug 格式与唯一性 | 仅小写英文字母、数字和单个短横线分段；不能重复                                                 | src/data/works.ts；tests/unit/content.test.ts                               |
| 内容完整性        | 标题、summary、description 非空；分类存在且不是 all；来源必须 HTTPS                            | src/data/works.ts                                                           |
| 同名 Markdown     | 每条作品必须有同 slug 的文章文件，缺失则构建失败                                               | src/pages/works/[slug].astro                                                |
| 搜索长度          | 输入与从 URL 恢复时均限制为 160 字符                                                           | src/layouts/Layout.astro；src/scripts/explore.ts                            |
| 搜索范围          | 标题、作者、summary、description 合并后搜索；不包含文章全文                                    | src/components/Explore.astro                                                |
| 搜索方式          | 去首尾空格、忽略大小写、按空白分词；所有词必须同时命中                                         | src/scripts/explore.ts                                                      |
| 分类与查询参数    | format 单选分类；URL 的 q、type 记录条件；无效分类回到 all                                     | src/scripts/explore.ts                                                      |
| 清空规则          | 搜索框 × 只清词；空结果按钮同时清词与分类                                                      | src/scripts/explore.ts                                                      |
| 默认内容数量      | 当前 24 条，其中论文 4 条，LoRA 搜索结果 1 条                                                  | src/data/works.json；scripts/ego-e2e.sh；tests/explore.spec.ts              |
| 内容顺序          | 数组顺序决定显示顺序；没有自动排序                                                             | src/data/works.json；src/components/Explore.astro                           |
| 详情路径          | /works/{slug}/；所有静态路径尾斜杠                                                             | src/data/works.ts；astro.config.mjs                                         |
| 标准 URL          | /explore/ 标准地址为 /；站点地图使用既有 Sites 域名                                            | src/layouts/Layout.astro；src/pages/sitemap.xml.ts；public/robots.txt       |
| 默认文字          | 页面默认标题、description、页头、页脚和错误提示                                                | src/layouts/Layout.astro；src/pages/404.astro；src/components/Explore.astro |
| 外部链接规则      | HTTPS 来源，新标签打开且 noopener noreferrer                                                   | src/data/works.ts；src/components/WorkDetail.astro                          |

## 检查与运行规则

| 名称 / 规则     | 当前值或行为                                                                                        | 原来在哪个文件                                                               |
| --------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 体积预算        | JS gzip 总量 < 10000 字节；首页 gzip < 40000；交互源码 < 12000                                      | scripts/budget-policy.ts；被 scripts/budget.ts 和 tests/explore.spec.ts 复用 |
| 空产物          | 没有 JS 文件时失败；不能把空包算通过                                                                | scripts/budget.ts；tests/explore.spec.ts                                     |
| 行数上限        | 单个 JS/TS/Astro 文件最多 300 行                                                                    | eslint.config.mjs；AGENTS.md                                                 |
| 格式            | 单引号、100 字符目标行宽、Astro parser；完整检查范围见忽略文件                                      | .prettierrc.json；.prettierignore                                            |
| Node 与工具版本 | Node >=22.20.0；具体依赖版本由锁文件决定                                                            | package.json；package-lock.json                                              |
| 类型规则        | 网站 strict；工具 NodeNext/ES2023/strict/noEmit                                                     | tsconfig.json；tsconfig.tools.json                                           |
| CI              | push、PR、手动触发；verify 最多 15 分钟，budget 最多 10 分钟；只读 contents                         | .github/workflows/check.yml                                                  |
| 浏览器选择      | GITHUB_ACTIONS 和 CI 都为 true 时使用 Playwright；其他情况 ego-browser                              | scripts/test-e2e.ts                                                          |
| 预览端口        | 本机 4322；E2E 要求端口空闲；开发默认端口以 Astro 打印为准                                          | package.json；scripts/test-e2e.ts；playwright.config.ts；scripts/ego-e2e.sh  |
| 服务等待        | 60 次，每次 fetch 超时 500ms，重试间隔 500ms                                                        | scripts/test-e2e.ts                                                          |
| 整体浏览器超时  | 180000ms                                                                                            | scripts/test-e2e.ts                                                          |
| 页面断言等待    | 最多 40 次，每次等待 0.1 秒；打开初始页 timeout 为 20 秒                                            | scripts/ego-e2e.sh                                                           |
| 手机验收尺寸    | ego 320×700；Playwright Desktop Chrome / iPhone 13，另有 320 宽度检查                               | scripts/ego-e2e.sh；playwright.config.ts；tests/explore.spec.ts              |
| 阅读验收        | LoRA 正文 >700 字、包含低秩矩阵、表格与来源标题；禁止 dialog                                        | tests/explore.spec.ts                                                        |
| 嵌入和卡片      | 不包含 iframe/video/audio；简介最多两行                                                             | tests/explore.spec.ts；src/styles/base.css                                   |
| 本地数据库限制  | reset/migrate 是唯一入口，不接受额外参数；固定 --local                                              | scripts/local-tools.ts；scripts/database.ts                                  |
| 数据位置        | .wrangler/project-local；重建只删其 v3/d1                                                           | scripts/local-tools.ts；scripts/database.ts                                  |
| 测试数据        | local_test_records 的两个固定记录；name 唯一且必填                                                  | db/migrations/0001_local_test_records.sql；db/seed.sql                       |
| Cloudflare 配置 | 兼容日期 2026-09-04；静态 dist；404-page；本地绑定 remote:false                                     | wrangler.jsonc；wrangler.local.jsonc                                         |
| 缓存与安全      | 构建文件缓存 31536000 秒；nosniff、strict-origin-when-cross-origin、DENY、CSP                       | public/_headers（完整原文见下方）                                            |
| 图形类型        | network/earth 使用 dark 标志；network/plot/wave/audio/earth/field/shapes 绘制 SVG；paper 用模拟横线 | src/components/Preview.astro                                                 |

## 正则完整清单

下方按来源保留代码中的正则原文；规则不集中重写，避免文档改变行为。

| 正则                           | 原来在哪个文件              | 用途                      |
| ------------------------------ | --------------------------- | ------------------------- |
| `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` | src/data/works.ts           | 检查作品地址的格式        |
| `/\s+/`                        | src/scripts/explore.ts      | 按空白拆分搜索词          |
| `/\/works\/lora\//`            | tests/explore.spec.ts       | 测试中检查预期 URL 或提示 |
| `/type=paper/`                 | tests/explore.spec.ts       | 测试中检查预期 URL 或提示 |
| `/bytes/`                      | tests/unit/budget.test.ts   | 断言体积检查失败消息      |
| `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` | tests/unit/content.test.ts  | 检查作品地址的格式        |
| `/UNIQUE/`                     | tests/unit/database.test.ts | 断言数据库拒绝重复名称    |
| `/不接受/`                     | tests/unit/database.test.ts | 断言拒绝非法命令参数      |

## Explore 手机布局和详情规则

| 规则                                  | 用途                                                                                                      | 来源                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 分类字号 12px、纵向内边距 10px        | 紧凑英文分类；首页卡片保持原样                                                                            | src/styles/base.css；src/styles/responsive.css         |
| 详情最大宽 780px；首屏最小高度 100svh | 手机首屏展示概览，桌面限制阅读宽度                                                                        | src/styles/detail.css                                  |
| 每条内容的作者、类型、主题信息        | 作者查同作者；类型查同类；主题进入正文，不编造不存在的 Prompt                                             | src/data/work-facts.ts                                 |
| 相邻作品按 works 顺序；首尾不循环     | 左右滑动、按钮、键盘切换；浏览器返回仍可用                                                                | src/components/WorkDetail.astro；src/scripts/detail.ts |
| 横移至少 70px 且超过纵移的 1.4 倍     | 区分切换与上下滚动；多指、表格、输入等不触发                                                              | src/scripts/detail.ts                                  |
| `<h2(?:\s[^>]*)?>[\s\S]*?<\/h2>`      | 对本地已编译可信 Markdown 按二级标题切分，原生 details 默认关闭，保留完整内容和锚点；不是任意 HTML 清洗器 | src/data/article-sections.ts                           |
| 正文 16px/24px；表格 14px/24px        | 沿用现有 Arena 风格正文，章节目录标题单独使用 19–20px                                                     | src/styles/article.css；src/styles/detail.css          |
