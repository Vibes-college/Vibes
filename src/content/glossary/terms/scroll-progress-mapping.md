---
id: 'scroll-progress-mapping'
title: '滚动进度映射'
english: 'Scroll progress mapping'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：随滚动飞入的卡片',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/ScrollFlyingCards.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 滚动进度映射 / Scroll progress mapping

用元素经过视口的位置控制视觉变化，滚动速度与方向由读者决定。

## 常见变体

进度映射为位移、透明度、角度或尺寸。

## 适合用在哪里

滚动驱动的卡片、章节和主视觉。

## 什么时候不用

不要混同进入视口后独立播放；过长的映射区间会拖延阅读。

## 提示词例子

```text
用区块滚动进度控制卡片位移，向上滚动时同步回退；减少动效时使用稳定布局。
```
