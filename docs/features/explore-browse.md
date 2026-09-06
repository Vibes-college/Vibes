---
tense: 'living'
describes: '精选目录浏览'
status: 'current'
shaped-by: ['001']
---

# 精选目录浏览

## 当前行为

访客打开`/`或`/explore/`会转到`/zh/`，可切换`/en/`。目录及分类每页最多24件，只显示该语言已发布版本；下一页是静态链接，不依赖JavaScript。当前中文24件、英文1件审核样例；没有译文的作品不混入英文目录。

点击卡片进入`/{locale}/works/{id}/`；简介最多两行，预览是编辑封面，无播放器或嵌入。没有投稿、收藏或编辑后台。

## 文件与依赖

src/pages/[locale]/下的index.astro、page/[page].astro、tags/[tagId]/[...page].astro；src/components/Explore.astro、Preview.astro；src/lib/content/views.ts与src/data/works.ts。依赖[内容维护](content-maintenance.md)与[详情](article-read.md)。

## 验收

2026-09-05本地Playwright桌面/手机Chromium验证24/1件目录、卡片导航、320px无溢出及两行简介通过；tests/explore.spec.ts。5000×2隔离构建的首中末正文搜索、无JS第二页/末页和结果分批加载也已通过；scripts/measure-explore.ts，详细边界见规模报告。
