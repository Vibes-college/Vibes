---
tense: 'living'
describes: '阅读作品详情'
status: 'current'
shaped-by: ['001', '003', '005', '006']
code-sources:
  [
    'src/components/WorkDetail.astro',
    'src/data/article-sections.ts',
    'src/data/work-facts.ts',
    'src/scripts/detail.ts',
    'src/scripts/detail-gestures.ts',
    'src/scripts/detail-disclosure.ts',
    'src/scripts/detail-transition.ts',
    'public/icons/x-mark.svg',
    'src/scripts/page-lifecycle.ts',
    'src/scripts/reading-prefetch.ts',
    'tests/navigation.spec.ts',
    'src/styles/detail.css',
    'src/styles/article.css',
    'src/lib/content/relations.ts',
    'src/lib/content/revision.ts',
    'src/pages/[locale]/works/[id].astro',
    'tests/explore.spec.ts',
  ]
code-revision: '92a045abc862f6d7d60e432c573f85b9c32fb116c755ce1332196ca260b83cc7'
---

# 功能名：阅读作品详情

## 一句话说明

访客在作品概览与正文之间整屏翻阅，按需展开章节，并继续阅读相邻作品。

## 用户操作路径

1. 从目录点击卡片，进入`/{locale}/works/{id}/`，先看来源、预览、标题、介绍和已有的作者/类型等信息。
2. 点击原站链接，在新标签页打开原始作品；预览封面不是内嵌播放器。
3. 上下滑动或点轻微摆动的向下入口，在概览与正文两屏间停靠；正文第一章默认展开，其余折叠。点击标题展开或收起，长正文可正常滚动阅读。
4. 点击有链接的信息项，进入同类作品或对应正文；没有有效目标的信息只显示文字。
5. 顶部依次为交叉关闭、上一件、下一件，随概览滚走，正文不悬浮保留；电脑可用左右键，手机可横滑。横滑或空白长按显示边缘方向提示，随触点上下移动；明确横移后松手切换，取消或只长按不切换。首尾不循环。
6. 详情不显示中英切换、缺译提示或查看原文入口；可返回首页选择语言。已有语言网址仍可直接打开，待复核译文保留状态文字。
7. 点顶部交叉按钮返回同语言目录；同标签页访问时恢复之前的分类和关键词。直接打开不存在的作品或译文地址会得到404。

### 操作之后发生什么

```mermaid
flowchart TD
  A[点击卡片或打开作品网址] --> B[读取目标详情HTML，优先复用新鲜缓存]
  B --> C{该语言版本是否已发布}
  C -->|是| D[站内切换更新页面，直接访问加载文档，显示概览与首章展开的正文]
  C -->|否| E[返回404和目录入口]
  D --> F[点击章节标题]
  F --> G[展开页面里已经存在的正文]
  D --> J[按钮、左右键或手机横滑]
  J --> K[打开同语言相邻作品，首尾不循环]
```

正文在构建时已转为HTML，展开章节不再请求正文；无脚本保留首章展开、原生折叠、CSS整屏停靠与真实导航。正文不显示序号、引导语或重复的底部原站入口；来源链接仍属于文章内容。启用脚本后开合带可反向取消的高度动画，减少动态偏好关闭动画。站内链接和相邻作品通过Astro ClientRouter保留运行环境并更新页面、标题与网址；相邻切换带短距离方向过渡，导航失败回退普通打开。可见相邻链接会提前准备；见[预取与缓存](../system/rules.md)。

## 涉及的文件

- 页面：`src/pages/[locale]/works/[id].astro`、`src/components/WorkDetail.astro`。
- 正文与信息：`src/data/article-sections.ts`、`src/data/work-facts.ts`、`src/lib/content/relations.ts`。
- 操作与排版：`src/scripts/detail.ts`及其手势、披露与切换模块、`src/styles/detail.css`、`src/styles/article.css`。
- 语言状态：`src/lib/content/revision.ts`、`src/lib/content/views.ts`；内容来自`src/content/works/`。

## 验收标准

- [x] 卡片和直接网址都能打开完整详情，原站链接在新标签页打开。
- [x] 章节可展开收起，表格、三级标题、来源和正文锚点保留。
- [x] 无JavaScript时仍可阅读正文、展开章节和用按钮切换作品。
- [x] 按钮、左右键和手机横滑能切换同语言的相邻作品，首尾不循环。
- [ ] 表格、代码和输入区域的操作不误触作品切换（已实现排除规则，缺完整专项验收）。
- [x] 详情无语言控件，首页可选择语言；已发布译文网址可读，缺译地址404。
- [x] 旧译文待复核、事实没有译文时有明确提示。
- [x] 320px宽度无整页横向溢出，宽表格在自身区域滚动。

连续阅读的历史滚动、反复搜索与语言切换由`tests/navigation.spec.ts`覆盖；旧页面监听与未完成搜索在切换时失效。

最近有效验收：2026-09-06 Playwright桌面Chromium、手机Chromium/WebKit覆盖首章展开、两屏停靠、相邻切换、首页语言和历史；内置浏览器核对桌面与手机概览、正文、开合及导航滚走。Chromium手机使用原生触摸；WebKit横滑为DOM事件，停靠使用scrollTo。完整verify通过（52项单元测试、81项浏览器测试，3项设备适用性跳过），budget通过。完整键盘路径、读屏和全部手势排除区域仍未覆盖。006证据在`resources/evidence/006-detail-reading/`；005目录历史证据保留原目录。

## 对应的自动化测试

`tests/explore.spec.ts`：

- `standalone detail is readable with JavaScript disabled`
- `detail overview, disclosure, and adjacent navigation`
- `touch swipe navigates to the next work and the previous button returns`
- `homepage switches language and detail omits language controls while routes stay valid`
- `detail top controls, snapped reading and reversible disclosure respect reduced motion`
- `edge feedback follows locked gestures and cancellation never navigates`
- `no horizontal overflow, no embeds, two-line card descriptions`

`tests/unit/article-sections.test.ts`验证正文结构；`tests/unit/content-relations.test.ts`验证事实/关联；`tests/content-lifecycle.spec.ts`验证译文发布及待复核的真实构建。

## 依赖的其他功能

- [维护作品内容](content-maintenance.md)：提供正文、事实与译文状态。
- [浏览与搜索作品](explore-browse.md)：提供阅读入口及返回目录。

## 已知问题 / 待办

手机触摸测试使用Chromium和WebKit模拟；真机Safari和读屏尚未完成专项验收。未提供的事实不会自动补全；来源与内容质量仍需编辑判断。
