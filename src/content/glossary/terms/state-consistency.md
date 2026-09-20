---
id: 'state-consistency'
title: '状态一致性'
english: 'State consistency'
aliases: []
category: 'UX规则'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：轻量立体按钮',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/MinimalButtons.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
    {
      'title': 'Great UI：带内发光的按钮',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/AceternityButton.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 状态一致性 / State consistency

界面显示的可用、运行和禁用状态必须与真实可执行能力一致。

## 常见变体

可用、禁用、加载中、完成与失败。

## 适合用在哪里

按钮、链接、表单和异步操作入口。

## 什么时候不用

不能只有灰色外观却仍执行禁用动作，也不能显示不存在的服务状态。

## 提示词例子

```text
让控件外观、可操作性和真实任务状态一致；加载时防止重复提交，失败后恢复操作并显示原因。
```
