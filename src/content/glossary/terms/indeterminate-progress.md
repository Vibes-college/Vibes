---
id: 'indeterminate-progress'
title: '不确定进度'
english: 'Indeterminate progress'
aliases: []
category: 'UX规则'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：字符轨迹等待动画',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/TerminalLoader.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 不确定进度 / Indeterminate progress

只表明任务仍在等待或执行，不承诺具体完成比例。

## 常见变体

循环图标、等待文字、循环字符。

## 适合用在哪里

尚不能计算完成比例的请求或任务。

## 什么时候不用

不能据循环位置推定完成百分比，也不能在真实失败后继续无限等待。

## 提示词例子

```text
用不确定进度表示正在处理，同时提供真实完成和失败状态；持续等待时可取消或重试。
```
