---
id: 'task-state'
title: '任务状态'
english: 'Task state'
aliases: []
category: 'UX规则'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：分步状态清单',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/DeploymentChecklist.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 任务状态 / Task state

以明确状态记录一个步骤处于等待、运行、完成或异常中的哪一阶段。

## 常见变体

等待、运行、成功、失败、取消。

## 适合用在哪里

任务步骤、上传和处理流程。

## 什么时候不用

预设计时动画不能当作真实后台进度。

## 提示词例子

```text
让步骤状态来自真实任务结果，明确显示失败原因与重试入口，不用计时器虚构成功。
```
