---
tense: 'living'
describes: '项目文档生成模板'
status: 'current'
shaped-by: ['002', '004']
---

# Feature Specification: [功能名]

生成最终文件时替换模板元数据为：tense=frozen，status=draft，describes=功能意图，feature-ids/amends/amended-by/approved-artifacts为JSON字符串数组；删除shaped-by。必要附加产物由Agent在approved-artifacts声明，正文说明用途，不逐文件请示。

## 用户与核心路径

谁用、输入/操作、成功和失败结果；每个故事有优先级与独立验收。

## 功能要求与验收

使用稳定FR/SC编号，给出可验证边界，不写工作流水账。

## 明确不做

列排除范围，避免示例变成需求。

## 端差异

手机/桌面、无JS、CLI/CI的实际差异及边界。

## 行数预算

本规格目录不设行数硬上限，必要信息完整且无重复。research仅在技术未知或重要取舍需解释时生成，并在spec填写research-trigger；data-model/contracts/quickstart默认不生成，须spec列明必要性与用途。

## PR工作台与经验复核

首版spec形成后即创建Draft PR，给用户可打开链接和任务摘要；详细任务以tasks.md为准，PR描述同步当前进度/阻塞/下一步/预览，阶段与交接前推送。不按commit数拆PR或触发预览。列出与docs/LESSONS.md相关经验的应对措施；无相关项写明无，不强行造条目。实现与合并/部署状态分开，合并后上线验收和清理记录在PR，不为事后勾选修改冻结清单。
