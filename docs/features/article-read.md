# 功能名：两段式详情与来源阅读

## 状态

✅ 已完成（本地实现，未发布线上）

## 一句话说明

先在一屏内了解作品，再向下展开正文；左右切换作品，继续探索。

## 用户操作路径

1. 从目录卡片进入 `/works/transformers-js/`。
2. 按顺序查看原网站链接、预览、标题、简介、作者与类型及主题信息。
3. 点击原站链接或预览访问外部来源；作者和类型进入对应筛选，主题进入正文。
4. 向下滚动或点击小箭头进入正文；点击大标题展开或收起其内容。
5. 左右滑动、点击切换按钮或使用键盘左右键，进入前后作品；首尾不循环。
6. 点击“← Explore”返回目录；浏览器返回保留历史网址中的筛选。

## 涉及的文件

- `src/pages/works/[slug].astro`：静态路由、折叠章节。
- `src/components/WorkDetail.astro`：概览、标签、上下文导航。
- `src/data/work-facts.ts`：按作品数据生成可点击信息。
- `src/data/article-sections.ts`：切分本地编译后的 Markdown，保留完整正文。
- `src/scripts/detail.ts`：触摸、键盘和深层锚点。
- `src/styles/detail.css`、`src/styles/article.css`：手机优先布局和正文。
- `src/content/articles/*.md`：现有文章；本次未改正文。

数据库：无。

## 验收标准

- [x] 详情顺序为原站、预览、标题、简介、信息标签。
- [x] 正文大标题默认收起，可以独立展开和再次收起。
- [x] 正文仍保留表格、来源及完整文字，刷新后可读。
- [x] 手机横向触摸进入相邻作品，按钮可返回上一作品。
- [x] 320px 手机没有页面横向溢出。
- [x] 关闭 JavaScript 后文章仍在静态 HTML 中。
- [ ] 外部来源逐个打开确认仍可访问（不在本轮自动测试范围）。

## 对应的自动化测试

- `scripts/ego-e2e.sh`：目录筛选、打开详情、刷新返回、320px、不启用 JavaScript、章节折叠、真实触摸和相邻按钮。
- `tests/unit/article-sections.test.ts`：保留导言、子标题、表格、来源、转义代码。
- `tests/explore.spec.ts`：云端 Playwright 回归，新增两段阅读与相邻导航断言；本轮本地验收使用 ego-browser。

## 依赖的其他功能

[精选内容维护](content-maintenance.md)、[搜索与分类筛选](explore-filter.md)。

## 已知问题 / 待办

- 相邻切换使用全部目录顺序，不局限于进入详情前的筛选结果。
- 首屏信息来自现有作者、类型和主题，没有编造缺失的 Prompt 或商业属性。
- 预览复用当前 MVP 的封面，不是抓取原站的实时截图或嵌入应用。
- 不包含编辑、评论、收藏、聊天和完整 connection；左右触摸需 JavaScript，按钮与章节无需 JavaScript。
- 表格、代码、表单、摘要控制等区域不触发换作品，避免干扰阅读。

## 最近核对

2026-09-05：本地 Cloudflare 预览运行 `npm run test:e2e` 全部通过；ego-browser 手机、桌面截图与操作核对。未部署线上。
