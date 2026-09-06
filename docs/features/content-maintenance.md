---
tense: 'living'
describes: '功能名：精选内容维护'
status: 'current'
shaped-by: []
---

# 精选内容维护

## 当前行为

维护者让AI修改src/data/works.json和同slug的src/content/articles/*.md，再check/test:e2e、查看详情；发布另行执行，本地修改不自动上线。无可视化编辑后台，不从D1读取内容。

slug唯一且为小写字母/数字/连接号，卡片有标题、简介、HTTPS来源和同名文章；数组顺序即目录顺序，缺正文阻断构建。增删内容同步固定数量测试；质量、版权与来源有效性需人工核对。

src/data/work-facts.ts从已有作者/类型/note生成信息，作者与类型指向筛选，主题指向正文；不伪造prompt、授权或价格。Markdown二级标题作为折叠章节，三级标题/表格/来源保留；预览复用Preview.astro。

## 文件与验收

src/data/works.ts校验内容，src/pages/works/[slug].astro检查文章存在；tests/unit/content.test.ts检查唯一地址、文章和HTTPS来源。npm run build执行构建约束；tests/explore.spec.ts检查产物，命令见 [CLI](../operations/CLI.md)。
