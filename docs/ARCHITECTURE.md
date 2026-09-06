---
tense: 'living'
describes: '当前架构'
status: 'current'
shaped-by: ['002']
---

# 当前架构

单个Astro7.3.1静态网站，TypeScript5.9.3与普通CSS。没有React、Tailwind、Pagefind或线上业务数据库。

src/data/works.json保存24件卡片，src/content/articles保存中文Markdown，src/data/works.ts连接两者并生成页面数据。Explore输出全部卡片，explore.ts在DOM中搜索分类；WorkDetail和detail.ts提供两段式阅读、折叠及前后切换。无JS仍有正文HTML，交互能力依具体功能说明。

astro.config.mjs、sitemap.xml.ts、public/robots.txt分别保存站点地址。wrangler.jsonc托管dist静态资源，没有业务Worker入口；wrangler.local.jsonc的D1仅供本地命令测试。

npm run check执行类型、lint、格式、文档治理和单元测试；verify接本地数据库与浏览器检查；budget检查构建体积。GitHub运行verify/budget，并有每周文档体检，不包含自动部署。

当前功能以 [功能索引](features/README.md) 为准；待实施变更与理由以 [specs索引](../specs/README.md) 为准。长期技术原则在 [宪章](../.specify/memory/constitution.md)，不以计划替代现状。
