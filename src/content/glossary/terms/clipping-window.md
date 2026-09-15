---
id: 'clipping-window'
title: '裁切窗口'
english: 'Clipping window'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：按方向揭开的图片',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/ImageHoverReveal.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 裁切窗口 / Clipping window

两张图仍占据同样的位置，只改变上层可以被看见的范围。

## 常见变体

矩形窗口、条带窗口、方向感知窗口。

## 适合用在哪里

叠图对照和局部揭示。

## 什么时候不用

两张图未对齐时不宜假装为相同画面的连续变化。

## 提示词例子

```text
保持上下两张图位置一致，只改变上层裁切窗口；键盘和触屏可以控制相同揭示。
```
