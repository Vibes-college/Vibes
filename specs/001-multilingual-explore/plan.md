---
tense: 'frozen'
describes: '多语言Explore实施方案'
status: 'merged'
frozen-at: '2026-09-06'
amended-by: []
---

# 多语言Explore实施方案

## 栈与职责

Astro7.3.1、TypeScript5.9.3、Node≥22.20，Cloudflare Workers Static Assets。保留现有CSS与Wrangler；Pagefind开发依赖已有用户许可，版本兼容待安装核对。网站继续文件构建，无线上数据库；本地D1仅供命令测试。

## 内容模型

`src/content/works/{id}/work.json`保存稳定id、originalLocale、唯一order、HTTPS sourceUrl、typeId/tagIds、preview、可选有序facts和related；首次id/order沿用旧JSON。`src/data/taxonomy.json`保存标签ID、kind、各语言label/aliases，别名冲突阻断构建。

同目录zh.md/en.md frontmatter：locale、status(draft/published)、title、summary、description、previewText；译文sourceRevision引用审核时原文摘要。原文未发布不得发布译文；draft/缺失不生成页面。摘要统一换行/属性序，对原文可翻译字段、正文和影响理解的事实/来源取SHA256，排除排序、布局及其他译文；不同时存易失真的needsReview布尔值。

译文摘要不一致时保留并显示待复核；重新审核更新摘要后清除。facts包含key/kind、各语言label/value和可选HTTPS/标签筛选/正文锚点，按数组排序；无目标显示普通文本，原文回退须明确。关联为无向ID对+本地化理由，拒绝自关联、重复和缺失目标，双方可读，不生成新UI。

`src/content.config.ts`、`src/lib/content/`集中schema、读取、校验与摘要；复用现有Preview、article-sections和work-facts逻辑。迁移24件逐项比对后才清理旧重复源，构建错误定位文件字段。

## 路由与交互

`src/lib/i18n/`集中语言、文案、路由；zh对应HTML zh-CN，en对应en。目录`/{locale}/`，后页`/{locale}/page/{n}/`，分类`/{locale}/tags/{tagId}/[page/{n}/]`，详情`/{locale}/works/{id}/`。每页24项，分类静态分页覆盖全目录；未知语言/ID/越界页真实404。

`/`、`/explore/`转/zh/；旧`/works/{id}/`转中文同作品，保留查询。q和旧type参数兼容，返回保持筛选/页码。语言切换保持ID，缺失译文显示尚无译文及原文入口，不静默跳语言。详情前后遍历同语言全部发布集合，首尾不循环。

## 搜索与性能

Pagefind索引只收录已发布作品正文/标题/摘要/标签，排除导航和重复列表；按页面语言检索。`src/scripts/search.ts`聚焦后dynamic import，非空输入防抖查询，复用单例，旧请求不覆盖新结果；结果每批24项按需读取，安全输出文本。

`src/scripts/explore.ts`不再扫描全量卡片，搜索与分类取交集；保留加载、清空、空结果、失败重试和无JS浏览提示。不在初始加载或空闲时预取搜索模块/WASM/索引。

保持首页gzip40,000B、首屏业务JS gzip10,000B、交互源码12,000B，搜索资源独立报告不规避预算。5000×2合成数据隔离生成，测试首中末/仅正文中文英文关键词；不覆盖真实数据、不部署合成内容。

390×844，1.6Mbps下行/750Kbps上行/150msRTT/CPU4倍降速，至少5次冷/热测量报告中位数及最大值；目标首次结果中位数≤3秒、热缓存≤1秒。记录24与5000件构建耗时、文件数和体积，核对账户静态文件数量/大小限制；失败不得默默放宽目标。

## 网址与交付

`src/config/site.ts`读取SITE_URL统一站名/默认语言/支持语言/origin；生产缺失或非HTTPS失败，本地明确localhost。Astro site、canonical、hreflang、sitemap、动态生成robots同源；x-default指原文/默认目录，草稿与搜索不进入清单。

先记录基线→内容模型与等价迁移→US1浏览语言/搜索→US2维护状态与规模→统一网址/发布→converge及现状同步。tasks列出32项具体路径；共享读取和页面由单一实现者集成。

运行check/verify/budget，本地与CI均用Playwright，分别报告实际运行结果。受控发布核对通过检查的SHA、账户和独立测试origin；已有OAuth可用则本机演练，无凭据不得假定自动部署成功。新增、修订、恢复上一成功SHA/资源/索引必须可见验证，优先平台实际支持的回退，否则重部署已验证旧产物。

原始证据放resources/evidence/001-multilingual-explore；发布摘要留PR。不得自动合并main或切换旧域名。Cloudflare限制、Pagefind兼容/中文分词和性能均是实测事项，不因官方支持而标为通过。

## 宪章核对

范围仅Explore、来源/语言可追溯、依赖已有许可、代码/文档预算、同SHA验收及用户合并权均有对应任务。无设计例外；用户已授权按计划实施，完成情况仍须真实验收。
