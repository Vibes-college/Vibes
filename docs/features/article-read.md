---
tense: 'living'
describes: '两段式详情与来源阅读'
status: 'current'
shaped-by: ['001']
---

# 两段式详情与来源阅读

## 当前行为

详情`/{locale}/works/{id}/`先展示来源、预览、标题与可选事实，再进入二级标题折叠正文。外链打开原始来源；表格、三级标题及正文锚点保留。每条事实按内容文件顺序显示，只有有效目标才成为链接，未提供的信息不生成。

语言入口定位同一作品；缺失/草稿译文显示尚无译文，当前原文继续可读。已发布译文的原文变化时显示待复核提示和原文入口；事实缺少译文时标为原文信息。

左右按钮、键盘和手机横滑在同语言完整目录中切换，首尾不循环；表格/代码/表单区域不触发切换。Explore返回同标签页保存的同语言目录与q，无JS也可阅读、展开和按钮导航。

## 文件与依赖

src/pages/[locale]/works/[id].astro、src/components/WorkDetail.astro、LanguageSwitch.astro、src/data/work-facts.ts、article-sections.ts、src/scripts/detail.ts、src/styles/detail.css和article.css。依赖[内容维护](content-maintenance.md)、[搜索](explore-filter.md)。

## 验收

2026-09-05本地Playwright桌面/手机通过折叠、前后切换、横滑、无JS阅读、同作品双语切换、缺失译文404和原文事实标注；tests/explore.spec.ts。tests/unit/article-sections.test.ts与content-relations.test.ts验证内容保留及事实/关联规则。tests/content-lifecycle.spec.ts已通过原文先发、译文草稿、发布、待复核及复核解除五个真实构建阶段。
