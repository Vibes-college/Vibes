# 功能名：手机阅读与基础键盘操作

## 状态

✅ 已完成（当前本地实现范围）

## 一句话说明

同一套页面适配电脑与手机，并提供基本的键盘访问提示。

## 用户操作路径

1. 在手机或窄窗口打开 `/`，浏览卡片。
2. 打开文章，阅读正文；宽表格可在表格区域横向滚动。
3. 在电脑上按 Tab，观察焦点提示，使用“Skip to content”跳到主要内容。

## 涉及的文件

- [src/styles/global.css](../../src/styles/global.css)
- [src/styles/base.css](../../src/styles/base.css)
- [src/styles/cards.css](../../src/styles/cards.css)
- [src/styles/article.css](../../src/styles/article.css)
- [src/styles/responsive.css](../../src/styles/responsive.css)
- [src/layouts/Layout.astro](../../src/layouts/Layout.astro)

数据库：无；当前功能不读写数据库。

## 验收标准

- [ ] 320 像素宽时，目录和文章不导致整个页面左右滚动。
- [ ] 卡片简介仍控制在两行。
- [ ] 键盘焦点可见，可以访问链接、搜索框和分类。
- [ ] “Skip to content”可跳过页头到达主要内容。

## 对应的自动化测试

`scripts/ego-e2e.sh`：320 像素列表和文章宽度；运行 `npm run test:e2e`。

`tests/explore.spec.ts`：`no horizontal overflow, no embeds, two-line card descriptions`。键盘完整路径和读屏体验暂无专门自动化测试，需手动验收。

## 依赖的其他功能

- [精选目录浏览](explore-browse.md)
- [文章阅读与来源链接](article-read.md)

## 已知问题 / 待办

已有基础适配和语义结构，不等于完成无障碍认证；没有验证所有设备和读屏软件。界面仍混用中英文，页面根语言标记为英文，正文局部标记为中文。

## 最近核对

- 日期：2026-09-05。
- 依据：当前本地源码、命令配置及真实测试文件；本次为文档核对，没有重跑浏览器或线上验收。
- 验收框留空，供下一次实际验收逐项勾选；已有代码不等于所有边界都有自动测试。
