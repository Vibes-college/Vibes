---
tense: 'living'
describes: '功能名：页面标题与搜索引擎地址清单'
status: 'current'
shaped-by: []
---

# 页面标题与搜索引擎地址

## 当前行为

详情标题包含文章标题与Vibes；/sitemap.xml列首页及文章，/robots.txt提供入口。/explore/的canonical指首页，404带不收录提示；不保证搜索引擎收录，无社交分享图片。

网址绑定Sites域名，并分别位于astro.config.mjs、src/pages/sitemap.xml.ts和public/robots.txt；更换时须共同核对，不能只改一处。

## 文件与依赖

src/layouts/Layout.astro和上述配置；依赖 [内容维护](content-maintenance.md) 与 [详情](article-read.md)。

## 验收与测试

打开/works/lora/、sitemap和robots核对标题/地址。tests/explore.spec.ts的static output stays small and content routes exist检查sitemap及LoRA地址；标题/canonical/robots暂无专门自动断言，需查看页面源码。
