---
tense: 'living'
describes: '阅读作品详情'
status: 'current'
shaped-by: ['001', '003', '005', '006', '007', '008', '009', '010']
code-sources:
  [
    'src/components/WorkDetail.astro',
    'src/components/MediaDetail.astro',
    'src/components/MediaItem.astro',
    'src/scripts/media.ts',
    'src/scripts/media-player.ts',
    'src/scripts/media-experience.ts',
    'src/scripts/media-demo.ts',
    'src/scripts/media-chart.ts',
    'tests/media.spec.ts',
    'src/scripts/prose.ts',
    'src/styles/prose.css',
    'public/icons/prose/',
    'tests/prose.spec.ts',
    'src/components/SectionReaction.astro',
    'src/components/ReactionButton.astro',
    'src/components/MdxHeading.astro',
    'src/components/demos/',
    'src/components/beui/',
    'tests/beui.spec.ts',
    'src/lib/markdown/rehype-article-sections.ts',
    'tests/mdx.spec.ts',
    'src/scripts/reaction-entry.ts',
    'src/scripts/section-reactions.ts',
    'src/styles/section-reactions.css',
    'public/icons/reaction.svg',
    'tests/reactions.spec.ts',
    'src/data/article-sections.ts',
    'src/data/work-facts.ts',
    'src/scripts/detail.ts',
    'src/scripts/detail-gestures.ts',
    'src/scripts/reading-progress.ts',
    'src/components/ReadingProgress.astro',
    'src/styles/reading-progress.css',
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
code-revision: '703c35ac1ada18336d71a1b1d46961e025e4090a6020fb4524e4eeae846f0351'
---

# 功能名：阅读作品详情

## 一句话说明

访客在作品概览与正文之间整屏翻阅，连续阅读正文并用进度目录跳转，并继续阅读相邻作品。

## 用户操作路径

1. 从目录点击卡片，进入`/{locale}/works/{id}/`，先看来源、预览、标题、介绍和已有的作者/类型等信息。
2. 点击原站链接，在新标签页打开原始作品；有媒体的封面按下面的路径播放或操作，未配置媒体的作品保留静态预览。
3. 上下滑动或点轻微摆动的向下入口，在概览与正文两个独立页面之间切换：单指移动至少72px后松手翻页，较短或取消则留在当前页；换页有280ms短幅位移淡入。未显示的页面退出布局，不存在两页之间的位置或滚动吸附。较长概览先正常滚到末尾；正文全部展开并使用浏览器原生滚动，在正文顶部向下滑可返回概览。底部进度胶囊只在正文出现，显示阅读进度与当前章；点击展开目录并跳转，Escape或点外部关闭。
4. 点击章节标题右上角的小表情，展开五个选项；选择后逐个飘出，第一章向下飘，其他章按顶部空间调整。可按住入口拖到表情松开，或长按表情连续发射。每章选择只在当前浏览器保存，刷新后恢复。点入口、外部或Escape关闭；方向键选择，减少动态偏好不发射。
5. 点击有链接的信息项，进入同类作品或对应正文；没有有效目标的信息只显示文字。
6. 顶部依次为交叉关闭、上一件、下一件，仅在概览显示，进入正文后隐藏；电脑可用左右键，手机可横滑。横滑或空白长按显示边缘方向提示，随触点上下移动；明确横移后松手切换，取消或只长按不切换。首尾不循环。
7. 详情不显示中英切换、缺译提示或查看原文入口；可返回首页选择语言。已有语言网址仍可直接打开，待复核译文保留状态文字。
8. 在正文时先回到正文顶部向下滑返回概览，或用浏览器返回；再点概览顶部交叉按钮返回同语言目录；同标签页访问时恢复之前的分类和关键词。直接打开不存在的作品或译文地址会得到404。

### 操作作品封面

- 图库：点素材按钮切换图片，再点放大查看；关闭或Escape返回并恢复按钮焦点。
- 视频与音频：点播放/试听后加载完整来源，用原生进度、音量与字幕控制；封面左上角的列表图标展开章节和文字稿，可直接跳转；跳转尚未完成时也可暂停，跳转结束后保持暂停。音频波形来自实际录音，若附文字稿可展开阅读，带时间的行可跳转；没有歌词或字幕时不会生成假内容。Sintel是完整预告片，不是整部电影；Carefree提供完整录音。
- 循环动画：可见时按偏好静音播放，点暂停停止；动画图通过静态海报停止循环。
- YouTube、Spotify、B站与已登记的原站体验：点“开始体验”加载官方播放器或原作，再在其中播放、按键或拖动；点“退出体验”移除它。Spotify可播放范围由平台、地区和账号决定。2048使用作者MIT源码的沙盒版，用方向键/滑动；5秒未能启动时可点“刷新重试”重新打开当前作品。yaoda忍者可拖动，角色区播放作者骨骼动画，其他角色不宣称支持拖动。
- 图表：点开始才读取有来源的真实数值；可切换系列或观测数量，展开数据表核对数值、来源日期、上下文与带条件的关键结果。Anscombe提供四组经典散点数据，采集年份不伪装成更新日期。

封面右下角使用小型半透明圆形播放/暂停图标；下方直接接大标题，不展示素材说明、来源小字或章节栏。来源与许可保留在正文及作品资料中。图库、播放器、iframe和图表控件区域不会触发换篇手势。切换媒体、进入正文、离开作品或进入后台会停止当前体验；浏览器返回后需重新启动手动播放。下载失败保留静态图、重试和原作入口。无JS保留正文、图片、媒体直达链接及原站入口；第三方不能嵌入时用原站打开，iframe加载完成不代表播放成功。

### 正文中的排版与操作

正文使用Prose UI组件样式，阅读底色为暖白#FCFBF8、正文与标题为暖灰#2E2B29。拉丁字母使用Geist，中文在Apple设备优先苹方，其他平台回退本机中文字体；组件提示色保留原版。标题1–6、引用、列表、图片、卡片、步骤、代码、标签、公式和表格都可直接阅读。

代码右上角可复制当前内容；成功显示勾号3秒，失败提示手动选择。CodeGroup先选文件，再选语言；同组Tabs共享选项，代码语言在支持该语言的组间同步，刷新恢复。标签用左右键与Home/End切换，语言菜单用上下键与Escape；内容区域内方向键不切换作品。图片默认点击放大，Escape、关闭按钮或画面可返回并恢复焦点；行内图片默认不放大，链接图片保持打开链接。

[排版全览文章](../../src/content/works/prose-ui-showcase/zh.md)覆盖公开组件变体，作为Vibes原创验收文章显示在中文目录；没有英文译文。无JS时各标签/代码面板连续展示，复制与放大不启用；公式仍是静态可读内容。宽表格、长代码和块级公式各自在自己的区域内滚动。写法与参数见[Markdown排版](../system/markdown.md)。

### 操作文章中的互动演示

[beUI十组件文章](../../src/content/works/beui-motion-lab/zh.mdx)用带圆角与左右留白的深色容器提供不同的真实组件，按每节操作说明体验点击、选择、拖动、折叠与暂停；每项附来源，刷新恢复初始状态。

互动文章仍从同样的作品卡片进入。[调色实验](../../src/content/works/mdx-interaction-lab/zh.mdx)提供中英文版本：进入正文后拖动滑杆/虚线区域、聚焦后按左右键或点击重置；两个色块独立变化。示例进入可视区才加载React，多实例共享运行时；普通Markdown文章不请求React。组件区域的触摸、鼠标、方向键和滚轮由演示处理，MDX整篇不安装左右拖动或长按拖动换篇手势，使用作品概览页顶部的上一篇/下一篇按钮换篇；普通Markdown保留手势。正文滚动、目录和组件自身拖动照常可用。

互动组件周围的章节、目录深链接、回应与全文搜索保持同一套路径；组件内部标题不加入文章目录。禁用JS时正文、表格、公式和演示初始状态仍可读，不能动态调整。GIF或视频是效果展示，不能替代可操作组件。

### 操作之后发生什么

```mermaid
flowchart TD
  A[点击卡片或打开作品网址] --> B[读取目标详情HTML，优先复用新鲜缓存]
  B --> C{该语言版本是否已发布}
  C -->|是| D[站内切换更新页面，直接访问加载文档，显示概览与完整正文]
  C -->|否| E[返回404和目录入口]
  D --> F[点击底部进度胶囊，再选章节]
  F --> G[跳到已有正文锚点并更新当前位置]
  D --> J[按钮、左右键或手机横滑]
  J --> K[打开同语言相邻作品，首尾不循环]
```

正文在构建时已转为HTML，目录不再请求正文；无脚本保留全部正文、顺序展开的封面/正文与真实导航，进度胶囊隐藏。正文不显示序号、折叠按钮、引导语或重复的底部原站入口；来源链接仍属于文章内容。标题保持完整原意，以Prose UI层级排版；通用章节用短导航名，其他长名称在胶囊省略、目录换行。胶囊接近正文时才初始化，不在封面首屏测量章节；尺寸有可取消回弹，文字交叉淡入，目录逐项出现，圆环平滑追随；减少动态偏好即时更新。进度按正文顶部到正文底部进入视口计算，缩放与尺寸变化重新校准，页面离开清理监听和动画。站内链接和相邻作品通过Astro ClientRouter保留运行环境并更新页面、标题与网址；相邻切换带短距离方向过渡，导航失败回退普通打开。可见相邻链接会提前准备；见[预取与缓存](../system/rules.md)。

表情菜单与动画模块在整页加载完成、进入正文停留1.5秒后的空闲时预加载，省流量模式仅点击加载，提前点击立即加载。预加载不创建工具条、不运行动画；全页共享一个工具条，最多40个粒子，关闭、滚轮操作、离开或进入后台清理；其他滚动时工具条随标题移动，标题离开视口则关闭。无JS时隐藏入口；存储受限时当次仍可使用，无法跨刷新保存。系统emoji在不同平台外观可能不同，不请求第三方图片。

## 涉及的文件

分章表情：`SectionReaction.astro`与MDX的`MdxHeading.astro`保留标题结构，共用`ReactionButton.astro`定位小入口，`reaction-entry.ts`负责恢复选择与延迟加载，`section-reactions.ts`负责工具条、输入、保存与动画，`section-reactions.css`负责排版。

- 页面：`src/pages/[locale]/works/[id].astro`、`src/components/WorkDetail.astro`。
- 正文与信息：`src/data/article-sections.ts`、`src/data/work-facts.ts`、`src/lib/content/relations.ts`。
- 操作与排版：`src/scripts/detail.ts`及其横向手势、`detail-paging.ts`纵向整页过渡、阅读进度与切换模块、`src/styles/detail.css`、`src/styles/article.css`。
- 语言状态：`src/lib/content/revision.ts`、`src/lib/content/views.ts`；内容来自`src/content/works/`。

## 验收标准

- [x] 卡片和直接网址都能打开完整详情，原站链接在新标签页打开。
- [x] 正文全部可读，进度目录支持章节跳转；表格、三级标题、来源和正文锚点保留。
- [x] 无JavaScript时仍可阅读全部正文和用按钮切换作品。
- [x] 按钮、左右键和手机横滑能切换同语言的相邻作品，首尾不循环。
- [ ] 表格、代码和输入区域的操作不误触作品切换（已实现排除规则，缺完整专项验收）。
- [x] 详情无语言控件，首页可选择语言；已发布译文网址可读，缺译地址404。
- [x] 旧译文待复核、事实没有译文时有明确提示。
- [x] 320px宽度无整页横向溢出，宽表格在自身区域滚动。
- [x] 每章表情独立保存，刷新恢复；键盘、拖选、长按、受限存储、减少动态和换页清理可用。
- [x] 封面不加载表情主体，正文空闲准备；省流量仅点击，提前点击立即加载。

连续阅读的历史滚动、反复搜索与语言切换由`tests/navigation.spec.ts`覆盖；旧页面监听与未完成搜索在切换时失效。

最近有效验收：2026-09-06 Playwright桌面Chromium、手机Chromium/WebKit覆盖常显正文、进度目录、锚点、Escape/外部关闭、减少动画、入口对齐、相邻切换、首页语言和历史。底部连续滚动、视口尺寸变化后保留末章及返回正文顶部由回归覆盖。完整verify/budget与发布记录保存在证据目录；脚本预算见[系统规则](../system/rules.md)。内置浏览器核对390px手机正文与目录，并与Rare UI相同视口参考对照。Chromium手机使用原生触摸；WebKit手势为DOM事件、长正文使用程序滚动。原始截图、加载与滚动比较在`resources/evidence/006-detail-reading/`，性能样本仅代表同机模拟环境，不能证明所有设备零影响；真机与读屏尚未专项验收。005目录历史证据保留原目录。

分章评价有效验收：2026-09-06完整发布检查通过52项单测、96项浏览器测试（3项设备适用性跳过）及budget；内置浏览器在Cloudflare预览390px宽度实际选择与刷新，已恢复原表情、无整页溢出和控制台错误。表情主体约2.1KB延后，首开脚本增量约1.35KB；详细测量与限制见[007研究](../../specs/007-section-reactions/research.md)，原始证据在`resources/evidence/007-section-reactions/`。

排版专项验收：2026-09-06，编译单测覆盖所有组件、属性错误、错误公式、图像尺寸与章节完整性；Playwright专项覆盖同步/复制、禁用JS、320px、图片键盘关闭与存储受限。完整verify通过61项单测、111项浏览器测试（3项设备适用性跳过），budget通过；Cloudflare预览已实际核对复制、同步、图片关闭、暖白背景与控制台。截图对照与限制见`resources/evidence/008-prose-markdown/design-qa.md`，发布证据见同目录及PR。

圆角与留白验收：2026-09-07，三种浏览器的6项beUI专项通过，包含320px页签左右边界与十组件交互；日志为`resources/evidence/009-mdx-articles/rounded-6-pass.log`。

MDX有效验收：2026-09-07，完整运行71项单元测试通过、浏览器140项通过及4项按设备适用性跳过；新增英文文章使旧数量断言失败，修正该测试后在三种浏览器专项3项通过，其余代码未变。budget通过。原版十组件、双语调色、无JS、减少动画、320px、加载隔离与MDX横拖禁用均有覆盖；证据在`resources/evidence/009-mdx-articles/`，真机iOS未专项验收。

媒体验收：2026-09-07，完整verify与budget通过，测试数及设备适用性跳过见原始日志。tests/media.spec.ts覆盖图库、音视频、循环、游戏、数据图表、延迟加载、重试、无JS、搜索/双语、暂停与返回，并保存三环境首次/缓存访问的真实首帧时间。内置浏览器在Cloudflare预览实际播放Sintel并进入正文，另实际验证YouTube、Spotify试听和2048键盘操作。原始截图、日志和时间数据在resources/evidence/010-media-previews；iPhone Safari真机未验，第三方限制见下方已知问题。

## 对应的自动化测试

`tests/explore.spec.ts`：

- `standalone detail is readable with JavaScript disabled`
- `detail overview, continuous reading, and adjacent navigation`
- `touch swipe navigates to the next work and the previous button returns`
- `homepage switches language and detail omits language controls while routes stay valid`
- `detail progress menu preserves anchors, keyboard, reversal and reduced motion`
- `edge feedback follows locked gestures and cancellation never navigates`
- `reading bottom stays put after repeated overscroll and viewport changes`
- `no horizontal overflow, no eager embeds, two-line card descriptions`

`tests/prose.spec.ts`覆盖排版交互与窄屏/无JS；`tests/unit/prose-markdown.test.ts`使用真实Astro编译器验证语法、错误和全部示例。

`tests/reactions.spec.ts`覆盖加载时机、省流量、独立保存、键盘、320px边界、减少动态、受限存储与长按清理。

`tests/mdx.spec.ts`覆盖双语互动、懒加载、多实例、搜索、深链接、回应、历史、320px与无JS；`tests/unit/mdx-sections.test.ts`覆盖AST分节和静态标题限制。

`tests/unit/article-sections.test.ts`验证正文结构；`tests/unit/content-relations.test.ts`验证事实/关联；`tests/content-lifecycle.spec.ts`验证译文发布及待复核的真实构建。

## 依赖的其他功能

- [维护作品内容](content-maintenance.md)：提供正文、事实与译文状态。
- [浏览与搜索作品](explore-browse.md)：提供阅读入口及返回目录。

独立页面回归：2026-09-07，当前取消全部滚动吸附；验证轻滑不翻、明确翻页、反向返回、取消、多指、进入正文后等待与视口高度变化，以及正文底部滚动。Chromium使用原生触摸，WebKit使用DOM事件；不能代替真实iPhone惯性及地址栏表现。证据在`resources/evidence/006-detail-reading/independent-pages/`。

## 已知问题 / 待办

iOS 26 Safari旧吸附实现曾出现正文回封面；当前已改为独立页面，真机复测仍待确认。读屏尚未完成专项验收。咬哒叔的忍者嵌入在内置浏览器可能停在加载画面，原站可显示；可用顶部原站入口打开，不能把iframe加载当作动画成功。未提供的事实不会自动补全；来源与内容质量仍需编辑判断。
