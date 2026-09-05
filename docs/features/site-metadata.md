# 功能名：页面标题与搜索引擎地址清单

## 状态

✅ 已完成（当前本地实现范围）

## 一句话说明

页面提供标题、摘要和地址清单，方便浏览器与搜索引擎识别内容。

## 用户操作路径

1. 打开 `/works/lora/`，查看浏览器标签上的标题。
2. 打开 `/sitemap.xml`，查看首页和文章地址清单。
3. 打开 `/robots.txt`，查看搜索引擎入口说明。

## 涉及的文件

- [src/layouts/Layout.astro](../../src/layouts/Layout.astro)
- [src/pages/sitemap.xml.ts](../../src/pages/sitemap.xml.ts)
- [public/robots.txt](../../public/robots.txt)
- [astro.config.mjs](../../astro.config.mjs)

数据库：无；当前功能不读写数据库。

## 验收标准

- [ ] 文章页标题包含该文章标题与 Vibes。
- [ ] 站点地图包含首页和当前文章地址，例如 `/works/lora/`。
- [ ] `/explore/` 的标准地址指向首页；404 页面带有不收录提示。

## 对应的自动化测试

`tests/explore.spec.ts`：`static output stays small and content routes exist` 检查 sitemap 响应及 LoRA 地址。标题、标准地址和 robots 提示暂无专门自动化断言，需手动查看页面源码。

## 依赖的其他功能

- [精选内容维护](content-maintenance.md)
- [文章阅读与来源链接](article-read.md)

## 已知问题 / 待办

地址目前绑定既有 Sites 域名，且分散在配置、sitemap 代码和 robots 文件中；换域名时需一起核对。没有保证搜索引擎一定收录，也没有社交分享预览图片。

## 最近核对

- 日期：2026-09-05。
- 依据：当前本地源码、命令配置及真实测试文件；本次为文档核对，没有重跑浏览器或线上验收。
- 验收框留空，供下一次实际验收逐项勾选；已有代码不等于所有边界都有自动测试。
