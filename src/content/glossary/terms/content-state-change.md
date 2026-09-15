---
id: 'content-state-change'
title: '内容状态切换'
english: 'Content state change'
aliases: []
category: 'UX规则'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：多语言引语切换',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/MultilingualQuote.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 内容状态切换 / Content state change

在同一个界面位置展示不同但相关的内容，并明确当前选中了哪一份。

## 常见变体

标签切换、语言切换、当前条目更新。

## 适合用在哪里

同一位置展示相关内容的选择器。

## 什么时候不用

动画状态与当前选中项不能分开维护而互相矛盾。

## 提示词例子

```text
切换内容时同步更新当前选择与正文，取消过期切换，确保用户能辨认正在阅读哪一项。
```
