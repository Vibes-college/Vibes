---
tense: 'living'
describes: '功能名：精选目录浏览'
status: 'current'
shaped-by: []
---

# 精选目录浏览

## 当前行为

访客打开/或/explore/，浏览24件作品的视觉预览与简介，点击卡片进入站内详情。简介最多两行，无视频/音频/iframe嵌入；预览为编辑概括，不是来源截图。没有分页、投稿、收藏或播放器，不读数据库。

## 文件与依赖

src/pages/index.astro、src/pages/explore/index.astro、src/components/Explore.astro、Preview.astro、src/data/works.ts、works.json。

依赖 [内容维护](content-maintenance.md) 与 [详情阅读](article-read.md)。

## 验收与测试

首页与/explore/可读、24卡片可点击、简介两行且不嵌入媒体。tests/explore.spec.ts覆盖筛选、无横向溢出、无嵌入和两行简介。命令见 [CLI](../operations/CLI.md)；增删内容须同步24条测试基线。
