---
tense: 'frozen'
describes: 'MDX章节与islands兼容决定'
status: 'complete'
amended-by: []
---

# MDX 章节与 islands

## 原生渲染与结构分节

决定：MDX通过render(entry).Content原生渲染，在rehype阶段包装顶层h2，保留JSX属性与根层mdxjsEsm。普通Markdown保留既有HTML分节。

理由：现有articleSections切HTML字符串，无法可靠承载islands元数据。官方编译器先读取根层import再识别client指令，故不能把import一起搬进章节。自定义插件早于内置标题ID步骤，显式调用公开rehypeHeadingIds；后续内置过程尊重已有ID。章节元数据写入astro.frontmatter并经remarkPluginFrontmatter读取。

替代：将MDX整体转成字符串或浏览器重排章节会丢失构建信息或依赖JS呈现基本文章结构，故不选。iframe和自定义标记已由用户排除，不重新扩展方案。

## 共用排版与组件约束

决定：复用proseProcessor的插件组，MDX增加结构包装，保留默认optimize:false。静态Markdown主标题是目录来源；组件内部标题不混入章节。JSX图片需组件自行指定尺寸，Markdown图片仍走现有补齐规则。

理由：MDX语法比Markdown严格，表达式、花括号、导入和标签必须合法；支持MDX不等于任意源码复制即用。源码需检查样式、字体、Next.js专属功能、浏览器API、服务端依赖与授权。

## 依赖与性能

@astrojs/mdx 8.0.0支持Astro ^7.2.6，当前7.3.1匹配；@astrojs/react 6.0.5支持React 19。React运行时按岛加载，普通文章没有岛时不加载；多实例共用模块。用户确认MD/MDX分开计量：公共脚本维持21KB，每篇MDX额外脚本上限150KB gzip。scripts/script-budget.ts追踪模块引用，运行时与同篇实例去重，未归属JS保守计入公共。两实例与二十实例构建模块完全相同；十种beUI组件测得额外134567字节，说明不同组件和依赖会增加体积。

## 官方依据

2026-09-07核对[MDX配置与组件](https://docs.astro.build/en/guides/integrations-guide/mdx/)、[islands启动指令](https://docs.astro.build/en/guides/framework-components/#hydrating-interactive-components)与已发布包源码。后续按用户明确要求纳入十种beUI组件。

## beUI 与 Tailwind

用户批准Motion及Tailwind安装。选择上游MIT源码（04d6f76e9e67e35cded996b1b8d08a5ddcebc13a）的TiltCard、MetallicButton、Tabs、Switch、Checkbox、RadioGroup、RangeSlider、BouncyAccordion、AnimatedBadge与Marquee，保留动画实现与实用类；保留原版预览文案、变体、参数、Lucide图标与Geist字体，仅调整导入、样式隔离、键盘和减少动态效果细节。许可随public/licenses/beui.txt发布。各示例单独入口，避免首次可见时导入全部十项。

采用官方[不含Preflight的导入方式](https://tailwindcss.com/docs/preflight)，通过Vite编译，source(none)后只列组件目录。这样减少手工翻译大量样式类和升级比对的成本；站点既有UI不改用Tailwind。组件基础样式仅在.beui-demo内补齐。

## CSP

Astro islands包含内联启动脚本，基础script-src会阻止水合。构建扫描实际可执行内联脚本并计算SHA256，给全站同一有限许可集以兼容ClientRouter从普通页进入MDX。保留原有同源与WASM策略，不开放脚本unsafe-inline；JSON数据脚本不计入哈希。
