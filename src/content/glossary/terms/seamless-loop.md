---
id: 'seamless-loop'
title: '无缝循环'
english: 'Seamless loop'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：斜向循环图片墙',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/DiagonalMarqueeCarousel.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 无缝循环 / Seamless loop

复制一段内容，在移动到副本对应位置时回到起点，使首尾衔接。

## 常见变体

水平循环、垂直循环、斜向循环。

## 适合用在哪里

展示图片或标志的连续背景。

## 什么时候不用

副本不应重复朗读或产生大量可聚焦项；无限循环需有暂停与减少动效处理。

## 提示词例子

```text
复制一组展示内容实现首尾衔接，只让原始内容提供语义，页面不可见和减少动效时暂停。
```
