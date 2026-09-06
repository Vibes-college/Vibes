---
tense: 'living'
describes: '功能现状索引'
status: 'current'
shaped-by: ['002']
---

# 功能现状索引

这里描述当前行为；当初为什么这样设计，从各页shaped-by找到 [specs索引](../../specs/README.md)。未列来源编号的功能属于规格化之前的现有实现，不伪造编号。current表示文档描述现状，不代表功能全部上线；限制在对应页说明。

| 功能                                              | status  | 入口           | shaped-by |
| ------------------------------------------------- | ------- | -------------- | --------- |
| [两段式详情与来源阅读](article-read.md)           | current | 见功能操作路径 | 001       |
| [精选内容维护](content-maintenance.md)            | current | 见功能操作路径 | 001       |
| [GitHub 自动验收与新站接入](delivery-setup.md)    | current | 见功能操作路径 | 001, 002  |
| [文档时态与冻结检查](document-governance.md)      | current | 见功能操作路径 | 002       |
| [精选目录浏览](explore-browse.md)                 | current | 见功能操作路径 | 001       |
| [搜索与分类筛选](explore-filter.md)               | current | 见功能操作路径 | 001       |
| [本地测试库重建与迁移](local-database.md)         | current | 见功能操作路径 | —         |
| [找不到页面的提示](not-found.md)                  | current | 见功能操作路径 | 001       |
| [开发、检查、验收与部署命令](project-commands.md) | current | 见功能操作路径 | 001, 002  |
| [手机阅读与基础键盘操作](responsive-access.md)    | current | 见功能操作路径 | 001       |
| [页面标题与搜索引擎地址清单](site-metadata.md)    | current | 见功能操作路径 | 001       |
| [Spec Kit开发工作流](spec-kit-workflow.md)        | current | 见功能操作路径 | 002       |

运行方法见 [CLI](../operations/CLI.md)，全仓位置见 [仓库地图](../README.md)。功能文件与本表一一对应；新增/删除功能必须同PR同步，规格合并后正文描述最终行为。模板为_TEMPLATE.md，不是产品功能。
