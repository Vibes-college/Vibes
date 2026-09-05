# Vibes / Explore

首版仅实现多模态精选目录。视觉参考 Are.na；页面与局部交互的原则参考 roadmap.sh `3d3d07c`。实现独立编写，没有复制参考项目的源码或品牌素材。

## 功能与验收

[功能地图](docs/features/README.md) 是当前产品说明书和逐项验收入口，新增或修改功能时同步更新；维护规则见 [AGENTS.md](AGENTS.md)。

## 运行与检查

Node 22.20+。首次运行 `npm ci`，日常启动用 `npm run dev`，Cloudflare 本地预览用 `npm run preview`。

`npm run check` 一次检查类型、lint、格式和单元测试。`npm run verify` 依次运行检查、本地测试库重建、ego-browser 端到端测试；运行前需安装并完成 ego lite 初始设置。所有命令及使用时机见 [命令说明](docs/CLI.md)。GitHub CI 执行 `verify` 和 `budget`，其中浏览器验收使用 Playwright；本地完整验收仍用 ego-browser。

## 改精选内容

卡片内容入口是 `src/data/works.json`，数组顺序即精选顺序。每条有独立 slug、标题、类型、介绍、原站地址和编辑制作的预览信息。首批 24 条为页面验收用的人工精选初稿。文字、图形预览是编辑概括，不是原站截图、论文原页或真实数据图表。

`src/content/articles/*.md` 保存 24 篇有来源链接的中文编辑导读，文章与卡片通过 slug 对应，缺失文章会阻止构建。`src/components/Preview.astro` 是卡片预览；`WorkDetail.astro` 提供阅读页结构。新内容发布时生成完整 HTML，不需要数据库或访问时调用第三方 API。

`src/scripts/explore.ts` 只负责搜索、横向分类和筛选网址。卡片直接进入独立详情页，浏览器返回保留筛选。Markdown 在构建时生成完整 HTML，详情页不加载交互脚本，关闭 JavaScript 后仍可阅读。排版参考 Arena 的正文、标题、引用与表格；使用本地系统字体，不加载远程字体。内容显著增长后再分页。

## 范围与维护

只有 Explore；没有账号、投稿、收藏、播放器、PDF Viewer、Paseo 或后台服务。参考源码保存在被 Git 忽略的 `references/`，研究与验收记录保存在 `research/`。旧项目没有修改。

一次只做一个已确认的小范围改动，使用功能分支，经检查和可见预览验收后再合并上线。源码文件以 300 行为提醒线，超过先说明原因；构建后浏览器脚本 gzip 不超过 10 KB、首页 HTML gzip 不超过 40 KB，由测试约束。预算是防止无意膨胀，不是线上速度保证。

## Cloudflare

`wrangler.jsonc` 只托管 `dist` 静态资源；`public/_headers` 设置缓存与基础响应头。`npm run deploy` 会构建并发布，需已配置 Cloudflare 登录。当前通过内置 Sites 发布，公开地址见下方；未绑定或替换 vibes.college。正式发布前核对目标账户、域名和旧网址迁移清单。

Sites 公网地址：https://vibes-explore.jachi2.chatgpt.site 。手机与电脑使用同一套响应式页面。Sites 项目绑定保存在 `.openai/hosting.json`，后续发布沿用这个站点。

## 配置与维护文档

- [配置与环境变量](docs/CONFIG.md)
- [数据库结构与 SQL](docs/DATABASE.md)
- [常量、规则与正则](docs/CONSTANTS.md)
- [第三方集成](docs/INTEGRATIONS.md)
- [CI、分支保护与 Cloudflare 连接](docs/CI.md)
