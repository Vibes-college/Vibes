---
id: 'distance-based-timing'
title: '距离时序'
english: 'Distance-based timing'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：对称阶梯转场',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/CascadePageTransition.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 距离时序 / Distance-based timing

以元素到某个中心或边缘的距离作为延迟依据，形成有方向的展开。

## 常见变体

从中心向外、从边缘向内、从选定点扩散。

## 适合用在哪里

网格、卡片组和径向揭示。

## 什么时候不用

元素数量或距离变化后不应使总时长无界增长。

## 提示词例子

```text
根据每个单元到起点的距离安排延迟，距离越近越早开始，并设置总时长上限。
```
