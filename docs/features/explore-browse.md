---
tense: 'living'
describes: '浏览与搜索作品'
status: 'current'
shaped-by: ['001', '003', '005']
legacy-feature-ids: ['explore-filter', 'not-found', 'responsive-access']
code-sources:
  [
    'src/components/Explore.astro',
    'src/components/LanguageSwitch.astro',
    'src/components/Preview.astro',
    'src/components/LegacyRedirect.astro',
    'src/layouts/Layout.astro',
    'src/pages/',
    'src/scripts/explore.ts',
    'src/scripts/search.ts',
    'src/scripts/page-lifecycle.ts',
    'src/scripts/reading-prefetch.ts',
    'tests/navigation.spec.ts',
    'src/lib/i18n/',
    'src/lib/preview.ts',
    'src/lib/content/views.ts',
    'src/data/works.ts',
    'src/styles/',
    'public/_redirects',
    'public/favicon.svg',
    'public/icons/',
    'tests/explore.spec.ts',
  ]
code-revision: '7f312b78147fb6d82b7bd897ff7cda0ef246a71fd3a5f2dd5da9bf07dfbbd30b'
---

# 功能名：浏览与搜索作品

## 一句话说明

访客通过浏览、分类和关键词搜索找到感兴趣的作品，再打开详情阅读。

## 用户操作路径

1. 打开`/zh/`；访问`/`或`/explore/`会进入中文目录。
2. 浏览卡片，或点击“论文”“代码”等分类；内容超过一页时使用上一页、下一页，每页最多24件。
3. 输入关键词，搜索当前语言已发布作品的标题、简介与正文；选择了分类时只看该类结果，超过24项可点“加载更多”。
4. 点击卡片进入[作品详情](article-read.md)；返回Explore或刷新时保留分类与关键词。
5. 点English切换英文目录，只显示已发布英文内容；没有该语言内容时显示提示和原文入口。
6. 无结果时点“清空搜索与筛选”重新浏览；搜索框×只清关键词。加载失败时显示“重试”，不会把失败显示成零结果。
7. 打开不存在的地址时显示404，可返回中文目录；手机使用相同路径。

### 操作之后发生什么

```mermaid
flowchart TD
  A[打开目录] --> B[显示已生成的本页卡片]
  B --> C[聚焦搜索框：开始加载搜索资源]
  C --> D[输入关键词：保存到网址 q 参数]
  D --> E[等待输入停顿150ms，显示加载提示]
  E --> F[Pagefind检索当前语言，并应用分类条件]
  F --> G{检索结果}
  G -->|找到作品| H[读取前24项结果数据并显示卡片]
  H --> I[点击加载更多：读取下一批]
  G -->|没有作品| J[显示空结果和重置入口]
  F -->|下载失败或超时| K[显示失败和重试入口]
  K -->|重试| E
  H --> L[点击卡片：读取详情HTML并连续切换]
```

普通浏览使用预生成HTML，站内切换保留文档运行环境。列表前6个候选在可见停留后预取详情，其余在悬停、键盘聚焦或触摸时准备；不预先下载全文搜索索引；带q的网址会直接发起搜索。新输入或清空后，旧请求即使返回也不会覆盖当前结果。中英文分别保留独立搜索实例，切换后重新绑定当前页面操作，旧异步结果不修改新页面；浏览器返回等待搜索结果恢复后还原滚动，用户开始滚动则停止自动还原。重试索引失败只重建当前语言实例；搜索程序本身下载失败时会保留q并刷新页面。对应`src/scripts/explore.ts`和`src/scripts/search.ts`。

## 涉及的文件

- 页面：`src/pages/[locale]/index.astro`、`src/pages/[locale]/page/[page].astro`、`src/pages/[locale]/tags/[tagId]/[...page].astro`、`src/pages/404.astro`。
- 列表与外框：`src/components/Explore.astro`、`src/components/Preview.astro`、`src/layouts/Layout.astro`。
- 搜索与语言：`src/scripts/explore.ts`、`src/scripts/search.ts`、`src/lib/i18n/routes.ts`、`src/lib/i18n/messages.ts`。
- 数据：`src/data/works.ts`、`src/lib/content/views.ts`、`src/data/taxonomy.json`；由[内容维护](content-maintenance.md)提供作品。
- 手机样式：`src/styles/cards.css`、`src/styles/responsive.css`；检索限制与分页参数见[规则](../system/rules.md)。

## 验收标准

- [x] 首页只显示当前语言的已发布作品，卡片能进入正确详情。
- [x] 分类与关键词同时生效；刷新、进入详情再返回后条件保留。
- [x] 能通过正文中的词找到作品，不只匹配卡片上的文字。
- [x] 清空关键词保留分类；空结果中的重置恢复全部目录。
- [x] 下载失败有重试入口，清空搜索后旧请求不覆盖当前列表。
- [x] 多页目录可翻页，搜索结果可加载更多；无JavaScript仍能浏览与翻页。
- [x] 320px宽度无整页横向溢出；不存在地址返回404并有回首页入口。
- [x] 普通浏览不下载搜索索引，开始搜索后才加载。

最近有效验收：2026-09-06 Playwright桌面Chromium、手机Chromium/WebKit检查浏览、搜索、语言切换、失败重试与历史；ego-browser检查真实页面连续阅读。证据在`resources/evidence/005-continuous-navigation/`。2026-09-05的5000×2容量数据只保留为历史基线，搜索生命周期改动后未重跑该专项，不代表此次规模性能已验收。

## 对应的自动化测试

`tests/explore.spec.ts`：

- `local filtering, empty state, and URL survive refresh`
- `cards navigate directly to a complete article; browser back restores filters`
- `no horizontal overflow, no embeds, two-line card descriptions`
- `lazy full-text search and detail back link preserve the query`
- `failed search resources can retry and clearing cancels stale results`
- `failed result fragments recover after explicit retry`
- `failed lazy search client can recover without losing the query`
- `static output stays small and content routes exist`

`tests/navigation.spec.ts`覆盖连续导航、异步结果滚动恢复、语言往返、预取上限、触摸与失败回退。

大目录分页和结果分批由`scripts/measure-explore.ts`单独验证，不属于每次普通E2E；单位规则见`tests/unit/i18n.test.ts`。

## 依赖的其他功能

- [维护作品内容](content-maintenance.md)：提供已发布作品和标签。
- [阅读作品详情](article-read.md)：承接卡片点击后的阅读路径。

## 已知问题 / 待办

- 搜索需要JavaScript；中文搜索不做词干还原。
- 英文只展示已发布译文，不能把缺少译文当作搜索漏项；实际数量由content:validate读取。
- 真机Safari、完整键盘路径与读屏尚无完整验收；模拟手机通过不代表所有设备通过。
- 大目录本地性能通过不代表当前免费托管容量足够，容量限制见[检查与发布](project-commands.md)。
