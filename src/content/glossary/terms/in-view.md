---
id: 'in-view'
title: '进入视口'
english: 'In view / Scroll-triggered'
aliases: ['Scroll-triggered', 'Enter viewport']
category: '触发方式'
provenance: '原文摘录与补充'
sources:
  [
    {
      'title': 'Vibe Coding 网页动效词典（上篇）：教你准确描述页面怎么动',
      'author': 'Adrian Punk',
      'url': 'https://x.com/adrianpunk115/article/2099485951701721585',
      'section': '进入视口（In view / Scroll-triggered）',
    },
  ]
---

# 进入视口 / In view / Scroll-triggered

进入视口指页面滚动到某个位置后，元素出现在屏幕可见区域，此时播放一次动画。它适合标题、卡片、数据和章节内容入场。

## 常见变体

描述时还可以补充：

- **进入视口（Enter viewport）：** 元素进入可见区域时开始。
- **离开视口（Leave viewport）：** 元素滚出屏幕后触发离场或复位。
- **播放一次（Once）：** 第一次看到时播放，往回滚动不重复。
- **重复播放（Replay）：** 每次重新进入视口都播放。
- **滚动方向（Scroll direction）：** 向下和向上滚动时使用不同状态。
- **触发位置（Trigger point）：** 元素刚露出、进入一部分或接近屏幕中央时开始。

## 适合用在哪里

Vibes整理：标题、卡片、数据和章节内容入场。

## 什么时候不用

Vibes补充：不要把进入视口触发一次播放误当作与滚动进度连续绑定。

## 提示词例子

```text
当功能卡片进入视口（In view）后触发入场动画，每张卡片只播放一次。不要等到卡片完全进入屏幕才开始；用户向上滚动返回时保持最终状态，不重复闪烁。
```
