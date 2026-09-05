# 功能名：找不到页面的提示

## 状态

✅ 已完成（当前本地实现范围）

## 一句话说明

输错地址时，访客看到明确提示并可以回到目录。

## 用户操作路径

1. 打开 `/not-a-real-page`。
2. 看到 404 和“This page isn’t in the collection.”。
3. 点击“Back to Explore →”回到目录。

## 涉及的文件

- [src/pages/404.astro](../../src/pages/404.astro)
- [src/layouts/Layout.astro](../../src/layouts/Layout.astro)
- [wrangler.jsonc](../../wrangler.jsonc)
- [wrangler.local.jsonc](../../wrangler.local.jsonc)

数据库：无；当前功能不读写数据库。

## 验收标准

- [ ] 错误地址显示专用提示页，不白屏。
- [ ] 在 Cloudflare 本地预览中，错误地址返回 HTTP 404。
- [ ] 返回目录的链接指向 `/explore/`。

## 对应的自动化测试

`scripts/ego-e2e.sh`：不存在页面显示 404；运行 `npm run test:e2e`。

`tests/explore.spec.ts`：`static output stays small and content routes exist` 检查 HTTP 404；返回链接需手动确认。

## 依赖的其他功能

- [精选目录浏览](explore-browse.md)

## 已知问题 / 待办

提示文字目前为英文。此功能处理不存在的地址，不是断网或所有服务错误的通用错误页。

## 最近核对

- 日期：2026-09-05。
- 依据：当前本地源码、命令配置及真实测试文件；本次为文档核对，没有重跑浏览器或线上验收。
- 验收框留空，供下一次实际验收逐项勾选；已有代码不等于所有边界都有自动测试。
