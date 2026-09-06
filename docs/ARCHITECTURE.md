---
tense: 'living'
describes: '当前架构'
status: 'current'
shaped-by: ['001', '002']
---

# 当前架构

单个Astro7.3.1静态网站，TypeScript5.9.3与普通CSS。构建使用Pagefind1.5.2，没有React、Tailwind或线上业务数据库。

src/content/works按稳定ID拆分work.json与zh/en.md，src/data/taxonomy.json保存稳定标签。src/lib/content共用schema、跨文件校验、版本摘要及读取规则；Astro Content Collections渲染Markdown。只有published语言生成详情、目录和索引；原文更新使已发布译文标待复核。

目录与分类每页24项，以静态路径分页；search.ts按搜索意图加载Pagefind全文索引，explore.ts处理查询状态及分批结果，不再输出全量卡片。WorkDetail和detail.ts保持两段式阅读与同语言相邻导航；无JS可阅读和分页。

src/config/site.ts统一SITE_URL，布局、sitemap、robots与Astro共用；wrangler.jsonc托管静态产物，无业务Worker入口。本地D1只用于命令测试。scripts/build.ts先校验后构建索引，.scratch支持隔离内容与输出，防止规模测试覆盖真实内容。

npm run check执行类型、lint、格式、文档治理和单元测试；verify接本地数据库与浏览器检查；budget检查构建体积。GitHub运行verify/budget，并有每周文档体检，不包含自动部署。

当前功能以 [功能索引](features/README.md) 为准；待实施变更与理由以 [specs索引](../specs/README.md) 为准。长期技术原则在 [宪章](../.specify/memory/constitution.md)，不以计划替代现状。
