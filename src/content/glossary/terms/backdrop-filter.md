---
id: 'backdrop-filter'
title: '背景滤镜'
english: 'Backdrop filter'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：交叉模糊转场',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/CrossBlurPageTransition.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 背景滤镜 / Backdrop filter

处理图层背后的画面，区别于只模糊元素自身的filter。

## 常见变体

背景模糊、背景亮度或颜色处理。

## 适合用在哪里

有透出背景的浮层和面板。

## 什么时候不用

透明度不足或背后没有内容时效果不同；大面积动态滤镜需测量成本。

## 提示词例子

```text
浮层只轻微模糊背后的画面，自身文字保持清楚；提供不依赖滤镜的可读背景。
```
