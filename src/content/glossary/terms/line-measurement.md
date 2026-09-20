---
id: 'line-measurement'
title: '分行测量'
english: 'Line measurement'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：文字分行飞入',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/SplitLineFlyIn.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 分行测量 / Line measurement

读取文字实际排版后各词的纵向位置，把落在同一行的内容作为一组处理。

## 常见变体

固定分行、依据实际排版重新分组。

## 适合用在哪里

需要逐行显现的响应式标题。

## 什么时候不用

不能只按换行符推定浏览器真实行数；字体加载会改变排版。

## 提示词例子

```text
字体加载和容器宽度变化后重新按实际排版分行，避免逐行动画拆断文字。
```
