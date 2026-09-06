---
tense: 'living'
describes: '功能名：两段式详情与来源阅读'
status: 'current'
shaped-by: []
---

# 两段式详情与来源阅读

## 当前行为

从卡片进入/works/{slug}/：原站链接→预览→标题/简介→作者/类型/主题信息。原站与预览打开外部来源，作者/类型指向筛选，主题指向正文。下滑或箭头进入二级标题折叠章节，可各自展开，保留表格/来源/完整HTML。

左右滑动、按钮、键盘左右键切换全部目录中的前后作品，首尾不循环；不局限于进入前的筛选。Explore返回目录，浏览器返回保留URL条件。表格、代码、表单、摘要区域不触发切换。

无JS正文仍可读、按钮和章节可用；触摸需JS。预览是编辑封面，不是实时截图；不包含编辑、评论、收藏、聊天或完整connection，不编造缺失prompt/商业属性。

## 文件与依赖

src/pages/works/[slug].astro、src/components/WorkDetail.astro、src/data/work-facts.ts、article-sections.ts、src/scripts/detail.ts、src/styles/detail.css和article.css、src/content/articles/*.md。依赖 [内容维护](content-maintenance.md)、[搜索](explore-filter.md)。

## 验收与测试

概览顺序、独立折叠、刷新保留正文、相邻切换、320px无溢出、无JS阅读由tests/explore.spec.ts覆盖；tests/unit/article-sections.test.ts验证内容/锚点/转义保留。外部来源可用性需逐个人工核对。
