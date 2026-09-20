---
id: 'shuffled-staggering'
title: '随机错峰'
english: 'Shuffled staggering'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：像素格溶解转场',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/PixelPageTransition.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 随机错峰 / Shuffled staggering

先打乱元素顺序，再按这个顺序安排出现时间，形成分散的变化。

## 常见变体

随机排列、固定种子的分散排列。

## 适合用在哪里

像素块、网格和装饰性显现。

## 什么时候不用

不要把随机闪动用于重要文字；需要复现时固定排列。

## 提示词例子

```text
将网格单元顺序打乱后依次显现，限制总时长；同次转场使用稳定顺序，减少动效时直接显示。
```
