# 功能名：搜索与分类筛选

## 状态

✅ 已完成（当前本地实现范围）

## 一句话说明

访客通过关键词和内容分类缩小列表范围，刷新或返回后保留筛选。

## 用户操作路径

1. 打开 `/`，点击“Papers”。
2. 在搜索框输入 `LoRA`，列表缩小为一条。
3. 刷新页面，搜索词和分类保留；打开文章后用浏览器返回按钮回到筛选结果。
4. 输入 `not-in-the-collection` 查看空结果提示，再点“Clear search & filters”恢复全部。
5. 搜索框右侧的 × 只清除搜索词，保留已选分类。

## 涉及的文件

- [src/scripts/explore.ts](../../src/scripts/explore.ts)
- [src/components/Explore.astro](../../src/components/Explore.astro)
- [src/layouts/Layout.astro](../../src/layouts/Layout.astro)
- [src/data/works.ts](../../src/data/works.ts)

数据库：无；当前功能不读写数据库。

## 验收标准

- [ ] 当前数据下“Papers”显示 4 条，搜索 LoRA 后显示 1 条。
- [ ] 刷新与浏览器返回后保留筛选条件。
- [ ] 无结果时显示提示，清除全部条件后恢复 24 条。
- [ ] 点击搜索框 × 清空搜索词，但不清除分类。
- [ ] 英文搜索不区分大小写；多个空格分隔的词需同时匹配。

## 对应的自动化测试

`scripts/ego-e2e.sh`：论文筛选、搜索、刷新、空结果、清除和返回；运行 `npm run test:e2e`。

`tests/explore.spec.ts`：前两个测试覆盖相同主流程；搜索框 × 和多词匹配暂无专门断言，需手动验收。

## 依赖的其他功能

- [精选目录浏览](explore-browse.md)

## 已知问题 / 待办

筛选依赖 JavaScript。搜索的是卡片标题、作者和简介字段，不是整篇文章；最多输入 160 个字符。网址中的 `q` 和 `type` 保存筛选条件；没有后台搜索服务。

## 最近核对

- 日期：2026-09-05。
- 依据：当前本地源码、命令配置及真实测试文件；本次为文档核对，没有重跑浏览器或线上验收。
- 验收框留空，供下一次实际验收逐项勾选；已有代码不等于所有边界都有自动测试。

分类栏显示 All、Code、Papers、Websites、Video、Audio、Articles，手机使用 12px 字号和紧凑间距；本轮 ego-browser 筛选、刷新、清除与返回验收通过。
