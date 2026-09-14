---
id: 'scroll-progress'
title: '滚动进度'
english: 'Scroll progress'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：滚动文字揭示',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/TextReveal.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 滚动进度 / Scroll progress

把一段滚动距离转换为从 0 到 1 的连续数值。

## 常见变体

整页进度、区块进度、元素进入和离开之间的进度。

## 适合用在哪里

阅读指示和滚动驱动动画。

## 什么时候不用

普通点击次数或未知加载进度不应伪装成滚动比例。

## 提示词例子

```text
把目标区块经过视口的距离映射为0到1的进度，明确开始与结束位置，越界时保持端点状态。
```
