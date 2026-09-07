---
tense: 'frozen'
describes: 'MDX执行清单'
status: 'in-progress'
amended-by: []
---

# MDX 执行清单

## 基础

- [x] T001 在specs/009-mdx-articles/spec.md明确范围、完成研究和Draft PR。
- [x] T002 在astro.config.mjs与package.json配置官方MDX、React及类型依赖。

## US1 维护内容

- [x] T003 [US1] 在tests/unit/content.test.ts覆盖.md/.mdx及重复语言错误，并更新src/lib/content/catalog.ts与src/content.config.ts。
- [x] T004 [US1] 在src/lib/markdown/rehype-article-sections.ts实现AST分节与元数据，tests/unit/mdx-sections.test.ts覆盖根层import、嵌套标题和锚点。
- [x] T005 [US1] 在src/pages/[locale]/works/[id].astro与src/components/MdxHeading.astro原生渲染MDX，保留事实、目录和回应。

独立验收：维护者添加合法MDX可构建，重复语言与语法错误被拒绝，现有Markdown继续构建。

## US2 阅读与互动

- [x] T006 [US2] 在src/components/demos与src/content/works/mdx-interaction-lab提供双语、多实例及长文真实示例。
- [x] T007 [US2] 在src/scripts/detail-gestures.ts排除组件区域，tests/mdx.spec.ts验证触摸、键盘及鼠标操作不误翻页。
- [x] T008 [US2] 在tests/mdx.spec.ts覆盖双语搜索、深链接、目录、回应、历史返回及无JS正文。

独立验收：双语示例可操作，文章原有阅读路径不被组件破坏。

## US4 真实组件解释文章

- [x] T013 [US4] 在src/components/beui/按MIT源码适配10个不同组件及最小共享依赖，保留署名，原始证据放resources/references/beui。
- [x] T014 [US4] 在src/content/works/beui-motion-lab/zh.mdx编写可长期保留的介绍文章，每节含用途、操作、结果与原始组件来源；分别按需加载。
- [x] T015 [US4] 在tests/beui.spec.ts覆盖10组件真实操作、章节手势隔离和加载，用resources/evidence/009-mdx-articles对比2/20同组件实例及10不同组件。

## US3 加载与交付

- [x] T009 [US3] 在tests/mdx.spec.ts核对普通页不加载React、多实例共享运行时；保存实际构建体积与预算方案至resources/evidence/009-mdx-articles。
- [x] T010 在docs/features/article-read.md、content-maintenance.md及关联docs/system文档同步完整路径、源码与限制，更新索引。
- [x] T011 运行verify与budget，浏览器审阅示例并将证据保存resources/evidence/009-mdx-articles，处理预算冲突。
- [ ] T012 在specs/009-mdx-articles复核converge、同步真实状态，保存推送并更新PR清单与预览。

独立验收：实际请求和预算证明按需加载，必要检查通过，未测与未部署准确列出。

## 依赖与执行策略

基础→US1→US2→US3；先确保原生渲染再扩充示例及回归。内容校验测试与AST测试可独立审阅，但实现按文件依赖推进。无新增公共API或数据库。

## PR工作台与经验复核

PR #8按阶段同步清单、预览与限制，细项以本文件为准。保留单worker及独立封面状态；模拟验收不能代替真机。合并由用户决定，代码与说明同批提交，合并后按逐commit及最终差异复核受影响文档。
