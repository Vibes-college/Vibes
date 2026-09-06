---
tense: 'living'
describes: '项目文档生成模板'
status: 'current'
shaped-by: ['002']
---

# Implementation Plan: [功能名]

生成最终文件时替换元数据为tense=frozen、status=draft、describes=技术决定、amended-by=[]，删除shaped-by。与spec状态一致，实现完成用complete；frozen-at可省略，实际合并状态看Git。

## 技术决定与职责

使用现有技术栈、真实文件路径、数据边界、依赖和失败处理；不预建空模块。未知事项可标NEEDS CLARIFICATION；需长期解释的技术未知或重要取舍按需生成research，记录决定/理由/替代方案。

## 宪章检查与预算

范围、权限、依赖批准、端差异、行数与性能目标均需可核对；篇幅仅提示审阅，不是CI失败条件。

## 验证与交付

按CI范围规则选择必要检查，说明运行环境和预期结果。代码与功能现状同PR生效，用户决定合并；不得把待测目标写成已通过。
