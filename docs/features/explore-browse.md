# 功能名：精选目录浏览

## 状态

✅ 已完成（当前本地实现范围）

## 一句话说明

访客可以浏览精选内容卡片，点击后进入站内阅读页。

## 用户操作路径

1. 打开首页 `/` 或 `/explore/`。
2. 浏览卡片上的视觉预览和简介。
3. 点击任一卡片，例如 LoRA，进入对应的阅读页。

## 涉及的文件

- [src/pages/index.astro](../../src/pages/index.astro)
- [src/pages/explore/index.astro](../../src/pages/explore/index.astro)
- [src/components/Explore.astro](../../src/components/Explore.astro)
- [src/components/Preview.astro](../../src/components/Preview.astro)
- [src/data/works.ts](../../src/data/works.ts)
- [src/data/works.json](../../src/data/works.json)

数据库：无；当前功能不读写数据库。

## 验收标准

- [ ] 首页与 `/explore/` 都能显示精选目录。
- [ ] 当前数据下显示 24 张卡片，卡片可以点击。
- [ ] 卡片简介最多显示两行，不嵌入视频、音频或 iframe。

## 对应的自动化测试

`scripts/ego-e2e.sh`：首页 24 张卡片、卡片进入文章；运行 `npm run test:e2e`。

`tests/explore.spec.ts`：`local filtering, empty state, and URL survive refresh`、`no horizontal overflow, no embeds, two-line card descriptions`；补充回归见 [CLI](../CLI.md)。

## 依赖的其他功能

- [精选内容维护](content-maintenance.md)
- [文章阅读与来源链接](article-read.md)

## 已知问题 / 待办

当前是固定精选集合，没有分页、用户投稿、收藏或播放器。卡片视觉是编辑制作的概括，不是来源网站截图。自动测试中的 24 条是当前数据基线，增删内容时要同步调整。

## 最近核对

- 日期：2026-09-05。
- 依据：当前本地源码、命令配置及真实测试文件；本次为文档核对，没有重跑浏览器或线上验收。
- 验收框留空，供下一次实际验收逐项勾选；已有代码不等于所有边界都有自动测试。
