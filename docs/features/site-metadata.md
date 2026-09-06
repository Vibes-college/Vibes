---
tense: 'living'
describes: '页面标题与搜索引擎地址'
status: 'current'
shaped-by: ['001']
---

# 页面标题与搜索引擎地址

## 当前行为

SITE_URL通过src/config/site.ts统一站点来源；canonical去掉搜索参数，hreflang只列实际已发布的对应语言。sitemap列已发布详情和静态目录分页，不包含草稿、缺失译文、搜索q及旧重定向URL。robots引用同一来源的sitemap；404禁止收录。

本地默认http://127.0.0.1:4322。发布模式要求显式独立HTTPS测试来源，拒绝旧vibes.college、localhost及带路径/凭据/查询/片段的配置；不保证搜索引擎收录。

## 文件与验证

src/config/site.ts、astro.config.mjs、src/layouts/Layout.astro、src/pages/sitemap.xml.ts、src/pages/robots.txt.ts；public/robots.txt已移除。依赖[内容维护](content-maintenance.md)。

2026-09-05本地tests/unit/site-config.test.ts通过配置边界；tests/explore.spec.ts验证sitemap包含已发布LoRA。独立测试站的页面、sitemap、robots和索引入口已与本地受检产物逐字核对。

## 已验证环境

2026-09-05本地与GitHub的verify/budget通过；独立[Cloudflare测试站](https://vibes-explore.topologic-relay.workers.dev/zh/)已部署。中文24件、英文1件，线上中英搜索、语言切换、旧路径、404与元数据核对通过；内容修订与恢复上一版本的页面和索引也已实测。原始证据在resources/evidence/001-multilingual-explore/cloudflare-release.md，发布摘要见PR；旧vibes.college未切换。
