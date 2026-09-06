---
tense: 'living'
describes: '文档时态与冻结检查'
status: 'current'
shaped-by: ['002']
---

# 文档时态与冻结检查

## 当前行为

npm run docs:check扫描Git管理范围内的治理Markdown，检查front matter、白名单、索引、修订关系、冻结保护，另外输出篇幅审阅提示。草稿未提交也参与检查；.scratch禁止提交。非治理的产品文章和上游资产采用自己的格式。

living描述当前行为，原地更新；spec开发中draft/in-progress可编辑，PR合并后冻结。检查main/CI基线中merged或superseded的文件：正文及文件名不得变化，元数据允许状态前进、追加amended-by及首次据实补记可选frozen-at，且不能回退状态或删除后续关系。LESSONS只可追加不可改写的决策条目。

功能索引与spec索引必须覆盖真实文件，状态和影响功能一致；修订关系双向存在，shaped-by引用真实编号。spec合并状态要求任务全部完成且功能文档包含来源编号；交付时人工核对最终行为及索引同步，不检查任务顺序或关键词。

## 文件与依赖

scripts/docs-check.ts执行扫描与基线读取；docs-frontmatter.ts解析和冻结比较；docs-policy.ts白名单/篇幅指南；docs-index.ts索引与关系。package.json接入check/verify；.github/workflows/check.yml传入基线并每周体检。无需新增npm依赖。

## 验收标准与自动测试

合法文档通过；缺标签、未声明用途的额外文件、漏/重复索引、关系缺失、冻结篡改/删除、状态回退和缺失基线都失败。tests/unit/docs-policy.test.ts和docs-check.test.ts覆盖这些边界及真实临时Git基线。模板通过.specify/scripts/bash/resolve-template.sh解析验证。

## 限制

额外产物在spec的approved-artifacts列明并在正文解释用途；无需逐文件批准，该字段不代表外部操作授权。自然语言准确性与任务完成证据由人工审阅，不设禁词或固定任务措辞。周报行数比例仅供观察，没有告警阈值；文档和代码篇幅只作审阅提示，spec目录无总行数上限。CI通过不代表网站功能或远端部署通过。

开发中的spec可逐步补齐plan/tasks，feature-ids可声明尚未实现的功能；只有合并状态才要求完整交付文件及功能现状说明，不创建占位文档。
