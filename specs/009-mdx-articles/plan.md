---
tense: 'frozen'
describes: 'MDX渲染与按需交互技术计划'
status: 'in-progress'
amended-by: []
---

# MDX 渲染与按需交互

## 技术决定与职责

采用官方@astrojs/mdx与@astrojs/react、react/react-dom及对应类型包，属于用户已确认方案所需依赖；用户随后确认十组件 beUI 演示并批准 Motion、Tailwind 及 Vite 插件；后续原版视觉要求另批准clsx、tailwind-merge及lucide-react。src/content.config.ts与src/lib/content/catalog.ts接受两种后缀，同一语言重复则拒绝。

普通.md保留现有HTML路径；.mdx经astro:content的render得到Content，原生渲染islands。src/lib/markdown/rehype-article-sections.ts在既有Prose处理后按顶层h2包装AST，保留根层import与JSX，使用Astro标题ID并输出章节元数据。src/components/MdxHeading.astro与共享回应控件保持现有结构。静态主标题用于目录；组件内部标题不纳入目录。事实锚点依构建时静态锚点验证，动态组件锚点不作为维护者事实目标。

src/scripts/detail-gestures.ts统一排除astro-island及显式data-article-interactive区域，同时覆盖detail-paging既有手势。不改变双页状态机。

src/components/demos与src/content/works/mdx-interaction-lab提供原创双语多实例示例，按可视区加载，初始状态支持无JS阅读。tests/mdx.spec.ts覆盖实际操作、加载隔离、搜索、语言、回应与历史；单元测试覆盖重复正文与AST分节。

## 宪章检查与预算

范围仅Explore维护者文章；无投稿、CMS及生产操作。用户确认普通MD与MDX分开预算：公共脚本维持21000字节；每篇MDX额外脚本上限150000字节（gzip），包括React/Motion及该文所有可达组件模块，去重计算，不把延迟加载排除。十种组件实测134567字节；门槛约留11.5%空间。其余资产预算不改。普通页面不得增加React请求。新源码按职责拆分，篇幅仅提示。

src/components/beui保留MIT上游实现，src/components/demos/beui按独立入口使用，src/content/works/beui-motion-lab提供长期中文解释文章。Tailwind只扫描这些目录，不导入Preflight；组件边界内补基础样式、主题与暂停动画，保留现有站点UI。

## 验证与交付

按网页改动执行verify与budget，保留单worker，检查.md/.mdx产物和实际网络请求。内置浏览器审阅桌面/手机布局；明确真机iOS 26尚未验收。更新article-read、content-maintenance及其关联system说明，核对文字后更新源码摘要。

## PR工作台与经验复核

Draft PR #8维护清单、预览与证据。实施前审阅spec/plan/tasks一致性，完成后converge。LESSONS的历史位置保护、代理稳定性和独立双页方案均保留。无合并授权，不合并或发布，合并后文档审阅流程留在PR收尾。

MDX格式整篇关闭左右拖动及长按拖动换篇，作品概览页顶部的相邻文章链接保留；普通Markdown维持原有手势。组件区域仍排除阅读键盘和纵向封面翻页手势。
