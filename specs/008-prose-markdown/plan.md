---
tense: 'frozen'
describes: 'Markdown组件渲染技术决定'
status: 'complete'
amended-by: []
---

# 实施计划

## 技术决定与职责

- `@prose-ui/style` 独立CSS替代旧正文规则。Markdown经 remark-directive / remark-math 与本地插件形成组件结构，经 rehype-katex 与现有Shiki在构建时输出HTML。
- `src/lib/markdown/`维护扩展语法、组件结构与代码增强，属性白名单/明确错误避免拼写错误静默丢失。
- `src/scripts/prose.ts`提供Tabs、代码语言切换、复制、图片放大，复用Astro页面生命周期；不下载React/公式引擎。
- `src/content/works/prose-ui-showcase/`提供完整示例，官网源码只读核对，图片复用有来源的公开资源。
- `src/styles/prose.css`仅处理现有分章容器兼容、主题边界、移动布局及渐进增强。

## 宪章检查与预算

用户已同意样式包及2026-09-07追加的三个插件及官方Markdown处理器构建依赖。新规格修改未冻结006/007的关系字段，现有PR继续使用。无线上数据库变化、不安装React/Tailwind。

## 验证与交付

针对扩展嵌套/错误属性/原生Markdown与代码元数据作单元测试；Playwright覆盖展示清单、切换同步、键盘/复制/放大、手机溢出与无JS。完整 verify/budget 后 Cloudflare预览；内置浏览器与官网同视口对照。

## PR工作台与经验复核

复用 PR #6。代码和文档同步；保留滚动恢复和表情懒加载回归。
