---
tense: 'living'
describes: '变更索引'
status: 'current'
shaped-by: ['002']
---

# 变更索引

| 编号与名字                                            | status | 影响的feature                                                                                                                                    |
| ----------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [001 多语言Explore](001-multilingual-explore/spec.md) | merged | article-read, content-maintenance, delivery-setup, explore-browse, explore-filter, not-found, project-commands, responsive-access, site-metadata |
| [002 文档治理](002-document-governance/spec.md)       | merged | delivery-setup, document-governance, project-commands, spec-kit-workflow                                                                         |

| [003 按操作路径组织功能文档](003-feature-documentation/spec.md) | complete | article-read, content-maintenance, document-governance, explore-browse, project-commands |

| [004 PR工作台与正式站交付](004-pr-delivery-workbench/spec.md) | complete | document-governance, project-commands |

当前任务看in-progress；draft仍需审阅。新规格complete表示实现完成，进入main后冻结；历史merged状态保留兼容。这里不记录PR是否已经合并或线上部署到哪个版本，分别以Git/PR及发布记录为准。当前行为看[功能索引](../docs/features/README.md)，历史feature-ids通过当前说明legacy-feature-ids追溯。

| [005 连续阅读与详情预取](005-continuous-navigation/spec.md) | in-progress | article-read, explore-browse |
