# 功能名：精选内容维护

## 状态

✅ 已完成（当前本地实现范围）

## 一句话说明

项目维护者通过 AI 更新卡片数据和中文导读，再构建发布。

## 用户操作路径

1. 告诉 AI 要新增、修改或移除哪条精选内容。
2. AI 更新卡片数据及对应的 Markdown 文章。
3. 运行 `npm run check` 和 `npm run test:e2e`，再从目录打开文章核对。
4. 确认后另行部署；只改本地文件不会自动更新线上网站。

## 涉及的文件

- [src/data/works.json](../../src/data/works.json)
- [src/data/works.ts](../../src/data/works.ts)
- [src/content/articles/](../../src/content/articles/)
- [src/pages/works/[slug].astro](../../src/pages/works/[slug].astro)
- [tests/unit/content.test.ts](../../tests/unit/content.test.ts)

数据库：无；当前功能不读写数据库。

## 验收标准

- [ ] 每个条目的 slug（地址名称）唯一，且只包含规定的小写字母、数字和连接号。
- [ ] 每张卡片有标题、简介、HTTPS 来源和同名文章文件。
- [ ] 数据数组中的顺序决定目录顺序。
- [ ] 缺少文章时构建失败，不生成不完整的详情页。

## 对应的自动化测试

`tests/unit/content.test.ts`：`every work has a unique route, article, and HTTPS source`；运行 `npm run test:unit`。

`src/data/works.ts` 的数据校验及详情页的缺文章检查在 `npm run build` 时执行；补充静态产物检查在 `tests/explore.spec.ts`。

## 依赖的其他功能

无。

## 已知问题 / 待办

没有可视化编辑后台，内容不从 D1 读取。增删卡片后须同步测试中的固定数量及功能地图；文章质量、版权和外部来源有效性需要人工核对。

## 最近核对

- 日期：2026-09-05。
- 依据：当前本地源码、命令配置及真实测试文件；本次为文档核对，没有重跑浏览器或线上验收。
- 验收框留空，供下一次实际验收逐项勾选；已有代码不等于所有边界都有自动测试。
