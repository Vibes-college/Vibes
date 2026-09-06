---
tense: 'living'
describes: '精选内容维护'
status: 'current'
shaped-by: ['001']
---

# 精选内容维护

## 当前行为

维护者让AI编辑`src/content/works/{id}/work.json`和`zh.md`/`en.md`；标签统一在src/data/taxonomy.json。work.json保存稳定ID、原文语言、排序、来源、预览、事实和单一无向关联；Markdown保存语言字段与正文。网站不读D1，无公众或Agent编辑入口。

先运行`npm run content:validate`；每次build也先校验。重复ID/顺序、文件身份错误、缺失原文、无效来源/标签/事实目标、自关联及反向重复关系会失败。原文和译文各有draft/published状态；只有published生成路由和索引，原文可先独立发布。

人工或明确的编辑审核后发布译文：查询`npm run content:revision -- <id>`，核对完整译文，再填写sourceRevision及published。命令只报告摘要，不写文件或自动发布。原文正文、可翻译字段、事实等改变会让已发布译文派生待复核；排序改变不触发。旧译文仍可读，复核并更新摘要才解除提示。

关联只记录一次，双方可读；用途是相似/归组/比较，不表达继承依赖。可选事实按作品顺序展示，链接/标签/锚点必须有效；未翻译事实明确标注回退。当前中文24件；英文仅一件AI逐段编辑审核样例，不代表人工审核或全部翻译完成。

## 文件与验证

src/lib/content/{schema,catalog,validate,revision,relations,views}.ts；src/content.config.ts接Astro集合；scripts/validate-content.ts与build.ts；src/data/work-facts.ts渲染事实。

2026-09-05本地单元测试通过schema/身份/迁移、发布规则、修订摘要与无向关联；tests/unit/content-validation.test.ts、content-revision.test.ts、content-relations.test.ts、i18n.test.ts。来源真实性、授权和翻译质量仍需编辑核对，类型检查不证明这些事项。
