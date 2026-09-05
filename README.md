# Vibes / Explore

首版仅实现多模态精选目录。视觉参考 Are.na；页面与局部交互的原则参考 roadmap.sh `3d3d07c`。实现独立编写，没有复制参考项目的源码或品牌素材。

## 运行与检查

Node 22.12+。`npm ci` 后运行 `npm run dev`。生产预览：`npm run build`、`npm run preview`。

`npm run verify` 检查类型、静态构建和桌面/手机关键浏览流程。首次运行测试需要 `npx playwright install chromium`。CI 已写入 `.github/workflows/check.yml`；尚未关联远程 GitHub 仓库，因此尚未在 GitHub 运行。

## 改精选内容

唯一内容入口是 `src/data/works.json`，数组顺序即精选顺序。每条有独立 slug、标题、类型、介绍、原站地址和编辑制作的预览信息。首批 24 条为页面验收用的人工精选初稿。文字、图形预览是编辑概括，不是原站截图、论文原页或真实数据图表。

`src/components/Preview.astro` 是共享预览；`WorkDetail.astro` 同时生成详情层和独立详情页。新内容发布时生成完整 HTML，不需要数据库或访问时调用第三方 API。

`src/scripts/explore.ts` 只负责搜索、形式筛选、顺序与详情层。列表用真实链接，关闭 JavaScript 后仍可进入详情页。详情模板随首批列表一起提供，点击正文不发网络请求。内容显著增长后再分页，不无限堆入首页。

## 范围与维护

只有 Explore；没有账号、投稿、收藏、播放器、PDF Viewer、Paseo 或后台服务。参考源码保存在被 Git 忽略的 `references/`，研究与验收记录保存在 `research/`。旧项目没有修改。

一次只做一个已确认的小范围改动，使用功能分支，经检查和可见预览验收后再合并上线。源码文件以 300 行为提醒线，超过先说明原因；构建后浏览器脚本 gzip 不超过 10 KB、首页 HTML gzip 不超过 40 KB，由测试约束。预算是防止无意膨胀，不是线上速度保证。

## Cloudflare

`wrangler.jsonc` 只托管 `dist` 静态资源；`public/_headers` 设置缓存与基础响应头。`npm run deploy` 会构建并发布，需已配置 Cloudflare 登录。当前仅本地预览，未绑定或替换 vibes.college。正式发布前核对目标账户、域名和旧网址迁移清单。
