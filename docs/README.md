---
tense: 'living'
describes: '给维护者阅读的代码说明地图'
status: 'current'
shaped-by: ['002', '003']
---

# 文档地图

Markdown是给你看的代码说明，不是另一套可以晚些更新的报告。先理解项目，再沿用户操作路径找到功能，遇到数据或配置细节时进入系统说明。

## 从哪里读

| 想知道什么                               | 唯一维护入口                               |
| ---------------------------------------- | ------------------------------------------ |
| 项目是什么、已经实现什么、明确不做什么   | [项目总览](PROJECT_ANALYSIS.md)            |
| 用户与维护者怎样完成一件事               | [功能索引](features/README.md)             |
| 作品资料、译文、关系与本地测试表怎么保存 | [数据结构](system/content-model.md)        |
| 框架、域名、环境变量和工具配置在哪里     | [运行配置](system/configuration.md)        |
| 页面提供什么资源、调用了哪些外部服务     | [接口与服务](system/interfaces.md)         |
| 数值限制、样式约束和校验规则是什么       | [系统规则](system/rules.md)                |
| 怎样检查、审阅、发布与恢复               | [检查与发布](system/checks-and-release.md) |
| 原生助手怎样连接电脑、重建与维护         | [Paseo接入](system/local-assistant.md)     |

正文组件与扩展语法见[Markdown排版](system/markdown.md)。

## 目录只按阅读目的划分

```text
docs/
├── PROJECT_ANALYSIS.md  项目全貌与导航
├── README.md            文档地图
├── features/            一条用户操作路径一篇说明
├── system/              数据、配置、接口、规则与交付的源码说明
├── DECISIONS.md         已冻结的历史原则决定
└── LESSONS.md           待转化与已转化的失败经验
```

同一事实只在一个地方解释清楚，其他页面链接过去；总览不再复制整张数据表或命令表。篇幅取决于需要解释的内容，不为减少文件或行数丢掉关键边界。

## 文档与代码如何对应

功能和系统说明头部的code-sources列出对应源码文件或目录，code-revision记录上次复核的源码摘要。源码改变后检查会指出哪些说明必须复核；新增源码未被任何说明覆盖、引用路径不存在、当前文档链接失效也会失败。摘要只能证明看的是同一份代码，不能证明解释质量，仍需对照代码和测试审阅。

作品正文是内容本身，日常修改正文不意味着要重写架构；当前数量用内容校验命令读取。产品行为、schema、工具与配置变化才沿对应说明维护。完整流程见[维护文档](features/document-governance.md)。

## 现状与历史分开

AGENTS和宪章指导AI执行；[specs](../specs/README.md)记录需求、计划和完成度，进入main后冻结。合并状态由Git与PR提供，部署状态由发布版本和实际站点提供，不把这些易变状态复制到每篇现状说明。

resources保存被忽略的本地原始证据；.scratch是临时产物，不提交。node_modules、dist、.astro、.wrangler与test-results是运行生成数据，不是手工维护文档。
