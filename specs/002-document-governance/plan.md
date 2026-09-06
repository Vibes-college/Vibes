---
tense: 'frozen'
describes: '文档治理实施方案'
status: 'merged'
frozen-at: '2026-09-06'
amended-by: []
---

# 文档治理实施方案

Node内置fs/child_process与现有node:test实现，无新增依赖。front matter使用明确的小语法：单行字符串与简单YAML flow字符串数组，拒绝重复字段及歧义。

scripts/docs-check.ts编排Git文件清单、未忽略草稿与main基线；docs-frontmatter.ts解析与冻结比较；docs-policy.ts路径/标签/篇幅提示；docs-index.ts索引、关系和合并任务验证。文件按职责组织，必要注释解释原因和复杂约束；300行仅提醒审阅。

模板覆盖层提供短spec/plan/tasks，保留上游原件；宪章约束research/附加产物。现有规格保留必要决定，重复草案保留在被忽略的.scratch；living正文不保留历史日志。

CI checkout获取完整历史，DOCS_BASE_REF明确事件基线；本地默认origin/main。基线失效不跳过检查。每周CI输出文档/代码行数和比例，不设比例告警；裁剪依据是重复、过期、时态混杂和导航问题，日志不生成受治理Markdown文件。

冻结保护检查基线中已合并文件，包括删除和改名；元数据允许状态前进、追加amended-by及首次补记可选日期，不允许撤销修订关系或回退到草稿。LESSONS例外仅末尾追加，不混入living清单。

测试使用内存文档及临时Git仓库，制造真实冻结篡改、基线缺失和索引失败；运行check、verify、budget。功能最终行为、shaped-by与两个索引同PR交付，用户决定合并与冻结日期。

scripts/check-scope.ts对治理文档/文档工具保守分流，未知差异完整验证；CI保留verify/budget检查名称及分类失败保护。scripts/test-e2e.ts统一调用Playwright，配置固定本地Worker，不复用现成服务；触摸与320px覆盖迁入tests/explore.spec.ts。自然语言和流程效率由人工审阅，冻结正文/有效日期/真实引用仍由机器验证。
