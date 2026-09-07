---
tense: 'living'
describes: 'Markdown正文组件、样式与编译规则'
status: 'current'
shaped-by: ['008', '009']
code-sources:
  [
    'src/lib/markdown/',
    'src/scripts/prose.ts',
    'src/styles/prose.css',
    'tests/unit/prose-markdown.test.ts',
    'public/images/prose/',
  ]
code-revision: '677f16226c7c372ddd31e7b5651862e0ba81b6bf815bfef5bb41b2d64e5bbced'
---

# Markdown正文排版

维护者通过[内容维护](../features/content-maintenance.md)编辑Markdown，访客操作见[阅读详情](../features/article-read.md)。完整可复制示例是[src/content/works/prose-ui-showcase/zh.md](../../src/content/works/prose-ui-showcase/zh.md)。普通文章使用Markdown与下列扩展指令；需要可操作演示时使用[MDX](#mdx互动文章)，不批量迁移旧文章。

## 写一段组件内容

`:::组件{参数="值"}`开始容器，独立一行`:::`结束，中间可继续写Markdown。嵌套时外层冒号比内层多；表格、列表与结束标记之间留空行，避免标记成为内容。单行组件使用`::组件[内容]{参数="值"}`；句中图片使用`:image{...}`。

```markdown
:::callout{variant="tip" title="阅读提示"}
先看**完整示例**，再选择适合内容的形式。
:::

::::tabs{groupId="example"}
:::tab{value="说明"}
这里继续写Markdown。
:::
:::tab{value="例子"}
这里是另一个面板。
:::
::::
```

## 组件参数

| 组件               | 参数与默认值                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| subtitle / caption | 无属性，内容写在方括号或块内；caption放在frame中                                                                           |
| callout            | variant为note（默认）、info、tip、warning、danger；title可省略；也接受`> [!TIP]`等简写                                     |
| frame              | align为left（默认）、center、right、stretch；caption可写为属性或内嵌caption                                                |
| cards / card       | cards的columns为1–3，默认3；card必填title，可填icon、十六进制color、href、horizontal、cta、arrow；外链默认箭头及新标签打开 |
| steps / step       | steps的titleSize为base（默认）或h1–h6；step必填title，可填icon替代编号                                                     |
| tabs / tab         | tabs可填groupId；tab必填唯一value；相同groupId共享选择                                                                     |
| codegroup          | 可填groupId；每个代码块须有title，相同title按语言形成版本；同组每个文件都需提供全部语言                                    |
| image              | 必填src、alt，可填正整数width/height、zoom、href；独立图片默认zoom=true，行内默认false，链接优先于放大                     |

布尔属性接受不带值或`true`，明确关闭用`false`。Card图标来自`public/icons/prose/`的既有白名单；未知图标、属性、组件、枚举或危险URL会使构建失败。代码围栏支持`title="example.ts" showLineNumbers`，默认无标题、无行号；复制由浏览器增强。未知语法高亮语言沿Astro默认回退，不改变代码内容。数学使用`$行内公式$`或独立行`$$`块；KaTeX编译错误使构建失败。

本地图片放public，正文以`/images/...`引用。构建读取原始尺寸，只给宽或高时补齐等比例尺寸；外链图片不在构建时下载，应显式提供尺寸；图片内容策略允许HTTPS图源，浏览器直连来源。图片默认lazy与async解码；展示文章的Juno原图保持上游清晰度，文件较大，浏览器缓存复用。截图示例的图片、字体、图标许可证随静态资源保存。

## MDX互动文章

`.mdx`使用相同文件头和下列写法（路径以示例文章目录为准）：

```mdx
import MixDemo from '../../../components/demos/MixDemo';

## 动手体验

<MixDemo locale="zh" initial={35} client:visible />
```

import必须位于根层。默认候选`client:visible`在可视区启动；`client:load`适合需要立即操作的组件，无client指令只输出静态初始画面。组件默认需支持构建期渲染：window/document等浏览器API放事件或effect中。确需`client:only="react"`时提供可读fallback并单独验收，不能把文章本体改成仅客户端可读。

MDX的标签须闭合，花括号是表达式，HTML注释改为JSX注释；普通文字中的特殊符号要转义或放代码块。主章节使用静态Markdown`##`，支持强调和行内代码，不支持标题中的JSX/表达式；嵌套标题和组件内部标题不进入目录。事实链接使用静态Markdown标题ID或reading，组件动态ID不作为构建期事实目标。

先审查源码许可及字体、CSS、Next.js专属API和后台依赖，再适配；不得因为引用示例站而默认安装其整套框架。样式作用于组件自己的类或CSS module，避免全局reset覆盖正文。Astro islands和`data-article-interactive`容器整块排除文章手势；组件自有键盘和滚动行为仍需实际验收。组件图片/JSX图片自行声明尺寸，Markdown图片继续自动补齐本地尺寸。

GIF放public后用图片引用；本地视频可用`<video controls src="/media/demo.mp4" width="640" height="360" />`，文件放public/media并提供说明/字幕或文字替代；现有响应头仅允许同源媒体。GIF和视频只展示，不能交互。单文件和文件数仍受[资产预算](rules.md)约束，不把大媒体写进代码或内联为base64。

MDX是可信仓库源码，会在构建中执行import；不接收公众输入、远程MDX或秘密值。普通页面不加载React；曾访问互动页后，共享运行时可留在同一标签页缓存，不承诺卸载已下载代码。

## beUI 组件文章

[十组件介绍](../../src/content/works/beui-motion-lab/zh.mdx)是一篇永久中文体验文章，每节包括用途、操作、预期与上游来源。src/components/beui保存MIT组件与本地许可，src/components/demos/beui每项单独入口，正文使用client:visible。Motion处理交互动画，Marquee使用CSS，悬停暂停。

beui.css通过Tailwind Vite插件编译，只扫描上述两个目录，不导入Preflight；主题和基础元素修正限定.beui-demo。预览保留原站英文文案、参数与变体，使用原站Geist本地字体及lucide-react图标；cn使用clsx与tailwind-merge处理类合并。维护上游组件时保留许可证并重新对照原站。新增演示目录须加入CSS的@source。每篇MDX预算包含该文全部延迟组件和共享运行时，见[系统规则](rules.md)。

## 编译顺序与浏览器行为

```mermaid
flowchart TD
  A[Markdown] --> B[解析指令与公式并保留内层Markdown]
  B --> C[Astro Shiki生成高亮HTML]
  C --> D[KaTeX静态公式，组件包装与表格滚动层]
  D --> E[补齐本地图像尺寸，识别顶层章节]
  E --> M{正文格式}
  M -->|md| N[现有HTML分节]
  M -->|mdx| O[Astro标题ID，AST分节，原生Content与islands]
  N --> F[输出完整静态HTML与正文搜索索引]
  O --> F
  F --> G[浏览器增强复制、分组同步与图片放大]
```

`npm run build`使用Astro官方`--force`清理内容编译缓存，避免插件或图片变化后仍复用旧HTML；开发服务修改编译插件后需重启。`src/lib/markdown/config.ts`配置官方unified处理器；remark-prose负责指令，rehype-prose负责最终结构与错误，rehype-image-size补本地尺寸。rehype-article-sections仅处理MDX：先用Astro标题ID，再包顶层章节、保留根层import/JSX；目录元数据通过remarkPluginFrontmatter传给页面。嵌套二级标题不进入大章节目录。原始HTML仅由受信维护者编辑；扩展属性白名单不等于公众输入消毒器，网站不开放投稿。

`src/lib/markdown/prose-style.ts`从已锁定的官方CSS读取样式，只把根级变量声明移到正文容器，避免覆盖网站外壳。`src/styles/prose.css`提供局部浏览器基础样式、滚动/交互适配、Geist与中文字体回退，以及用户指定的暖白#FCFBF8和暖灰#2E2B29；嵌套明暗样本保留上游变量，其他组件枚举与语义色保持原版。

`src/scripts/prose.ts`复用页面生命周期：相同组名同步选项，代码语言全篇同步；localStorage键为`prose-ui-code-lang`与`prose-ui-code-tab-{groupId}`。存储受限时当页可操作。复制失败保留可手选代码；图片原生dialog支持键盘/焦点与清理。禁用JS时全部面板展开，控件隐藏；公式、高亮、卡片和提示不依赖客户端框架。

构建后scripts/content-security.ts为实际产物中的内联启动脚本生成SHA256许可并写入dist/_headers，全站共享有限哈希以支持ClientRouter连续导航；保留同源脚本与原有策略，不启用脚本unsafe-inline。源码public/_headers仍是基础策略。

## 验证

`tests/unit/prose-markdown.test.ts`运行真实Astro编译器，覆盖组件变体、属性/URL/公式错误、标题唯一性、图像比例与全文顶层章节；`tests/prose.spec.ts`覆盖复制和失败、文件/语言/标签同步、刷新、图片焦点、320px与无JS。`tests/mdx.spec.ts`验证真实MDX排版、组件加载与阅读路径，`tests/unit/mdx-sections.test.ts`验证结构，`tests/unit/content-security.test.ts`验证精确脚本许可。完整发布仍遵守[检查与发布](checks-and-release.md)。

MDX格式整篇关闭左右拖动及长按拖动换篇，作品概览页顶部的相邻文章链接保留；普通Markdown维持原有手势。组件区域仍排除阅读键盘和纵向封面翻页手势。
