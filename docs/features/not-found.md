---
tense: 'living'
describes: '找不到页面的提示'
status: 'current'
shaped-by: ['001']
---

# 找不到页面的提示

## 当前行为

不存在地址、未知语言和缺失译文路径返回HTTP404，页面显示简短中英提示，返回入口为`/zh/`。不生成伪翻译页面；这不是断网或服务错误通用页面。

## 文件与依赖

src/pages/404.astro、src/layouts/Layout.astro、wrangler.jsonc、wrangler.local.jsonc；依赖[目录](explore-browse.md)。旧根路径在public/_redirects及兼容页面中转到中文路径。

## 验收

2026-09-05本地Playwright桌面/手机通过未知地址、/fr/与/en/works/lora/的404及页面提示；tests/explore.spec.ts。
