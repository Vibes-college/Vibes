---
tense: 'frozen'
describes: 'Markdown完整排版与示例文章'
status: 'complete'
feature-ids: ['article-read', 'content-maintenance']
amends: ['006', '007']
research-trigger: '复用独立CSS并在Markdown中提供全部官网组件和交互'
approved-artifacts: []
amended-by: []
---

# Markdown 完整排版与示例文章

## 用户与核心路径

- US1（P1）：访客阅读现有文章，正文采用 Prose UI 排版，标题、目录、表情反馈继续正常工作。
- US2（P1）：维护者写 Markdown 并使用扩展块表达组件，构建后得到可用的组件，不编写 React。
- US3（P1）：用户打开网站的“Prose UI 排版全览”文章，逐项检查官网展示类型和全部公开视觉变体。

## 功能要求与验收

- FR001：正文采用官网原版组件样式，阅读底色按用户截图为#FCFBF8，正文/标题为#2E2B29暖灰，中文优先苹方；保留现有首页、封面、导航与分章反馈的操作路径。
- FR002：覆盖 Typography（标题1–6、正文、Subtitle、强调、删除线、链接、引用、有序/无序/嵌套列表、分隔线）、Image、Frame/Caption、Callout、Card/Cards、Steps、Code block、Code group、Tabs、Math、Table。
- FR003：Callout 五种变体及有/无标题，Card 静态/链接、图标/彩色图标、横向/纵向、CTA/箭头、1–3列，Steps 编号/图标与标题尺寸，Frame 四种对齐均有示例。
- FR004：代码支持高亮、标题、行号、可选复制；CodeGroup 支持文件与语言切换，Tabs 支持键盘切换及分组同步，图片可放大并关闭，公式在构建时渲染。
- FR005：示例使用原创说明和明确归属的图片，作为验收文章出现在当前网站；不伪装为第三方作品或投稿入口。
- SC001：所有官网组件/变体在示例文章有对应内容；覆盖矩阵记录对应章节及验证结果。
- SC002：320px手机至桌面无整页横向溢出，宽表格/代码/公式在容器内滚动；保留章节锚点、目录和反馈。
- SC003：无JS可阅读全部内容；Tabs/代码组展开为连续面板，复制/放大等增强不阻塞正文；页面切换清理事件与临时状态。
- SC004：必要 verify 与 budget 通过；提供 Cloudflare PR 预览及实际浏览器验收。

## 明确不做

不引入 React/Tailwind，不开放投稿、后台或在线编辑器，不合并或提升生产；官网站点外壳和文档导航不属于文章样式。

## 端差异

手机组件适应正文宽度；交互支持触摸与键盘。网站当前浅色外壳保留，示例提供局部明暗样式对照。CLI/CI编译同一 Markdown。

## 交付说明

docs/system/markdown.md独立维护扩展语法、编译顺序、样式与资源规则，加入living明确白名单；功能文档沿链接提供完整维护路径。

## 行数预算

按职责拆分渲染、样式和交互；目录无总行数硬上限，性能预算保持硬检查。

## PR工作台与经验复核

复用 PR #6，规格/代码/说明同时交付。保留上一规格的导航与WebKit回归，避免变更正文结构破坏历史恢复。原始视觉证据位于 resources/evidence/008-prose-markdown。
