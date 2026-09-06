---
tense: 'living'
describes: '常量、规则表与正则'
status: 'current'
shaped-by: ['001']
---

# 常量、规则表与正则

这些是项目已经使用的固定选择、限制和校验规则。修改规则时，先改来源文件，再同步本页与相应测试；本页不会自动改变代码。

## 产品规则

- `src/lib/content/schema.ts`限定zh/en、稳定小写ID、非空语言字段、无凭据HTTPS来源、预览枚举/颜色、可选事实及单一关联；`validate.ts`校验目录身份、ID/顺序唯一、引用与发布关系。
- `src/data/taxonomy.json`是类型/标签名称及别名唯一源；原文语言、排序、事实顺序和关系属于各作品work.json。目录只包含当前语言published版本，每页24件；路径函数在`src/lib/i18n/routes.ts`。
- `src/lib/content/revision.ts`对规范化原文与影响理解的字段计算SHA256；排序和其他语言变化不影响摘要。已发布译文摘要不一致时标待复核，不自动撤回或更新。
- 搜索为Pagefind语言全文索引，与tag分类取交集；构建限定[data-pagefind-body]根，零发布时不生成索引并移除旧索引；不再用卡片文本过滤。q最长160字符、输入延迟150ms、请求15秒超时、每批24项；索引/分片重试释放失败实例；程序下载失败重试刷新页面保留q，清除模块失败缓存；结果序号隔离旧请求。规则在src/scripts/explore.ts与search.ts。
- 目录路径`/{locale}/`、分类`/{locale}/tags/{tagId}/`、分页`page/{n}/`、详情`/{locale}/works/{id}/`；旧根路径转中文，旧type转分类。UI文案在src/lib/i18n/messages.ts。
- `src/config/site.ts`统一来源；发布要求独立HTTPS SITE_URL，拒绝localhost、vibes.college和非纯origin地址。canonical去查询，语言替代链接仅含实际版本，sitemap不含搜索或草稿。
- 外部目标HTTPS且新标签noopener noreferrer；事实无有效目标显示纯文本。正文锚点在构建时核对，翻译缺失值显示原文标注。
- CSP只为Pagefind WebAssembly加入`wasm-unsafe-eval`，普通eval仍禁用；定义public/_headers。

## 检查与运行规则

| 名称 / 规则     | 当前值或行为                                                                                        | 定义位置                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 体积预算        | JS gzip 总量 < 10000 字节；首页 gzip < 40000；交互源码 < 12000                                      | scripts/budget-policy.ts；被 scripts/budget.ts 和 tests/explore.spec.ts 复用 |
| 空产物          | 没有 JS 文件时失败；不能把空包算通过                                                                | scripts/budget.ts；tests/explore.spec.ts                                     |
| 篇幅提示        | 代码文件超过300行提示审阅职责，不阻断检查                                                           | scripts/docs-check.ts；AGENTS.md                                             |
| 格式            | 单引号、100 字符目标行宽、Astro parser；完整检查范围见忽略文件                                      | .prettierrc.json；.prettierignore                                            |
| Node 与工具版本 | Node >=22.20.0；具体依赖版本由锁文件决定                                                            | package.json；package-lock.json                                              |
| 类型规则        | 网站 strict；工具 NodeNext/ES2023/strict/noEmit                                                     | tsconfig.json；tsconfig.tools.json                                           |
| CI              | push、PR、手动触发；verify 最多 15 分钟，budget 最多 10 分钟；只读 contents                         | .github/workflows/check.yml                                                  |
| 浏览器选择      | 本地与CI统一Playwright Chromium                                                                     | playwright.config.ts                                                         |
| 预览端口        | 本机 4322；E2E 要求端口空闲；开发默认端口以 Astro 打印为准                                          | package.json；scripts/test-e2e.ts；playwright.config.ts                      |
| 服务等待        | Playwright webServer最多60000ms                                                                     | playwright.config.ts                                                         |
| 单项测试超时    | 单项测试使用Playwright默认30000ms                                                                   | playwright.config.ts                                                         |
| 页面断言等待    | Playwright自动等待，expect默认5000ms                                                                | playwright.config.ts                                                         |
| 手机验收尺寸    | desktop-chromium / mobile-chromium，另有320×700检查；不是Safari                                     | playwright.config.ts；tests/explore.spec.ts                                  |
| 阅读验收        | LoRA 正文 >700 字、包含低秩矩阵、表格与来源标题；禁止 dialog                                        | tests/explore.spec.ts                                                        |
| 嵌入和卡片      | 不包含 iframe/video/audio；简介最多两行                                                             | tests/explore.spec.ts；src/styles/base.css                                   |
| 本地数据库限制  | reset/migrate 是唯一入口，不接受额外参数；固定 --local                                              | scripts/local-tools.ts；scripts/database.ts                                  |
| 数据位置        | .wrangler/project-local；重建只删其 v3/d1                                                           | scripts/local-tools.ts；scripts/database.ts                                  |
| 测试数据        | local_test_records 的两个固定记录；name 唯一且必填                                                  | db/migrations/0001_local_test_records.sql；db/seed.sql                       |
| Cloudflare 配置 | 兼容日期 2026-09-04；静态 dist；404-page；本地绑定 remote:false                                     | wrangler.jsonc；wrangler.local.jsonc                                         |
| 缓存与安全      | 构建文件缓存 31536000 秒；nosniff、strict-origin-when-cross-origin、DENY、CSP                       | public/_headers（完整原文见下方）                                            |
| 图形类型        | network/earth 使用 dark 标志；network/plot/wave/audio/earth/field/shapes 绘制 SVG；paper 用模拟横线 | src/components/Preview.astro                                                 |

## 关键正则示例

下方列关键规则及测试示例，完整表达式以源文件为准，不复制所有内部实现增加同步负担。

| 正则                           | 定义位置                    | 用途                      |
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

## 文档治理检查与篇幅提示

scripts/docs-policy.ts定义白名单与篇幅指南：功能说明120行、宪章100行、AGENTS150行、代码300行、LESSONS30条只提示人工审阅，不使CI失败。spec目录没有总行数上限；文档/代码比例只报告、不告警。

裁剪依据是重复、过期、时态混杂和导航不清，不按代码量删必要说明。文档计数包含空行和元数据；代码计数覆盖src/scripts/tests下的TS/JS/Astro/CSS/Shell，排除产品文章与上游资产；网站资源体积预算独立且仍严格执行。

治理Markdown必须在白名单，附加产物须spec声明并说明用途；front matter支持简单YAML字符串与flow字符串数组。缺标签、错误索引/关系、冻结篡改等正确性错误阻断CI。

CI范围路径白名单在scripts/check-scope.ts，默认未知路径full；tests/unit/check-scope.test.ts覆盖删除/改名/新增。元数据只检查确定性规则，自然语言不设禁词，任务不要求固定位置和措辞；research-trigger接受非空的技术未知或重要取舍理由。frozen-at可省略，提供时校验有效日期，冻结后仅允许首次补记。

开发阶段允许暂缺plan/tasks与未来功能文档；合并状态才要求文件完整及功能来源同步。

## 搜索资源与托管容量

scripts/asset-sizes.ts独立报告Pagefind总文件数、原始/gzip字节及全站文件数量、最大文件；总索引体积不等于首次搜索下载。首屏JS仍保守计入_astro全部自有JS；双语首页取gzip较大者，原预算不变。

scripts/budget-policy.ts及tests/unit/budget.test.ts校验Workers静态资源：Free每版本20,000文件，Paid100,000文件，单文件最多25MiB；默认采用Free，实际账户套餐须发布前核对。依据[Cloudflare官方限制](https://developers.cloudflare.com/workers/platform/limits/)。普通budget报告数量，受控发布按账户容量阻断。

scripts/measure-explore.ts在.scratch隔离生成5000×2语料、构建和系统分配的独立空闲端口验收后清理；scripts/search-performance.ts以390×844、1.6Mbps下行/750Kbps上行/150msRTT/CPU4倍测每语言5次冷/热，目标中位数≤3000/1000ms，失败不放宽。
