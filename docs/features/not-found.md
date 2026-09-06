---
tense: 'living'
describes: '功能名：找不到页面的提示'
status: 'current'
shaped-by: []
---

# 找不到页面的提示

## 当前行为

打开不存在地址（如/not-a-real-page），显示404与“This page isn’t in the collection.”，Back to Explore指向/explore/。Cloudflare本地预览返回HTTP404；提示英文，不是断网或所有服务错误的通用错误页。

## 文件与依赖

src/pages/404.astro、src/layouts/Layout.astro、wrangler.jsonc、wrangler.local.jsonc；依赖 [目录](explore-browse.md)。

## 验收与测试

错误地址不白屏、状态404、返回链接正确。tests/explore.spec.ts验证提示；tests/explore.spec.ts的static output stays small and content routes exist检查HTTP404；返回链接需手动确认。
