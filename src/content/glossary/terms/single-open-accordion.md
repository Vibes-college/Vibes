---
id: 'single-open-accordion'
title: '单项展开'
english: 'Single-open accordion'
aliases: []
category: 'UX规则'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：折叠问答',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/Accordion.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 单项展开 / Single-open accordion

一组折叠项中最多保留一个打开项。

## 常见变体

允许全部收起、始终保持一项展开。

## 适合用在哪里

适合逐项阅读的问答或设置组。

## 什么时候不用

需要跨项比较时，不应强制关闭其他答案。

## 提示词例子

```text
问答最多同时展开一项，是否允许全部收起请明确说明；用按钮表达展开状态并支持键盘操作。
```
