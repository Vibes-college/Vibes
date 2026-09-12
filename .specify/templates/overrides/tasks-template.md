---
tense: 'living'
describes: '项目文档生成模板'
status: 'current'
shaped-by: ['002', '004', '015']
---

# Tasks: [功能名]

生成最终文件时替换元数据为tense=frozen、status=draft、describes=执行清单、amended-by=[]，删除shaped-by。开发中随Git保存进度；真实完成后才勾选，全部完成后同步spec/plan/tasks与索引为complete，进入main后冻结。

## 基础与用户故事

每项格式为- [ ] T001 [US1] 动作与具体文件路径；基础/交付任务不加故事标签。按依赖排序，给每个故事独立验收条件，只对不冲突任务标[P]。需要测试的行为先列有效失败与成功路径。

## 验证与现状同步

- [ ] T001 在实际受影响路径完成实现与必要测试，按影响运行文档检查、check或verify与budget。
- [ ] T002 更新 docs/features/<name>.md 为合并后的最终行为，更新shaped-by；更新 docs/features/README.md 与 specs/README.md 状态。此项未完成converge不通过。

## 交付引用

PR、验证与收尾遵循docs/system/checks-and-release.md；动态进度只写PR。相关失败经验及应对措施见plan，不在此重复。
