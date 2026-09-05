# 功能名：文章阅读与来源链接

## 状态

✅ 已完成（当前本地实现范围）

## 一句话说明

访客在独立页面阅读中文导读，也能从来源链接继续阅读原始材料。

## 用户操作路径

1. 点击目录卡片，或直接打开 `/works/lora/`。
2. 阅读标题、作者、中文导读、表格和“来源与延伸阅读”。
3. 点击“前往原始作品 ↗”在新标签页打开原始来源。
4. 点击“← Explore”回到目录，或用浏览器返回按钮回到之前的筛选。

## 涉及的文件

- [src/pages/works/[slug].astro](../../src/pages/works/[slug].astro)
- [src/components/WorkDetail.astro](../../src/components/WorkDetail.astro)
- [src/layouts/Layout.astro](../../src/layouts/Layout.astro)
- [src/content/articles/lora.md](../../src/content/articles/lora.md)
- [src/styles/article.css](../../src/styles/article.css)

数据库：无；当前功能不读写数据库。

## 验收标准

- [ ] LoRA 页面有对应标题、正文、表格和来源信息，不是弹窗。
- [ ] 刷新详情页后正文仍然存在。
- [ ] 关闭 JavaScript 后，直接打开文章仍能阅读。
- [ ] “← Explore”回到目录；浏览器返回恢复之前筛选。
- [ ] “前往原始作品”打开与该卡片对应的来源。

## 对应的自动化测试

`scripts/ego-e2e.sh`：文章跳转、刷新、返回、关闭 JavaScript 阅读；运行 `npm run test:e2e`。

`tests/explore.spec.ts`：`cards navigate directly to a complete article; browser back restores filters`、`standalone detail is readable with JavaScript disabled`。外部来源是否仍可访问需手动核对，不由这些测试保证。

## 依赖的其他功能

- [精选内容维护](content-maintenance.md)

## 已知问题 / 待办

“← Explore”跳到未筛选的目录；只有浏览器返回会恢复此前网址里的筛选。内容为编辑导读，不是原始材料全文；没有评论、点赞或阅读进度同步。

## 最近核对

- 日期：2026-09-05。
- 依据：当前本地源码、命令配置及真实测试文件；本次为文档核对，没有重跑浏览器或线上验收。
- 验收框留空，供下一次实际验收逐项勾选；已有代码不等于所有边界都有自动测试。
