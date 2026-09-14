---
id: 'text-on-a-path'
title: '沿路径文字'
english: 'Text on a path'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：沿曲线滚动的文字',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/TextOnPathScroll.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 沿路径文字 / Text on a path

把文字基线放在SVG曲线上，字符沿曲线的方向逐个排列。

## 常见变体

固定曲线、移动文字位置、沿闭合路径排列。

## 适合用在哪里

标志、主视觉和装饰文字。

## 什么时候不用

主要正文不宜沿复杂曲线排列。

## 提示词例子

```text
将短标题沿SVG曲线排列，保证文字方向和间距可读；提供普通文本表达同样内容。
```
