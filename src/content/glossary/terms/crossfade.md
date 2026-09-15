---
id: 'crossfade'
title: '交叉淡化'
english: 'Crossfade'
aliases: ['Cross-fade']
category: '动效类型'
provenance: '原文摘录与补充'
sources:
  [
    {
      'title': 'Vibe Coding 网页动效词典（上篇）：教你准确描述页面怎么动',
      'author': 'Adrian Punk',
      'url': 'https://x.com/adrianpunk115/article/2099485951701721585',
      'section': 'Crossfade：交叉淡化',
    },
  ]
---

# 交叉淡化 / Crossfade

Crossfade 指旧内容淡出的同时，新内容淡入。两个画面会短暂重叠，因此切换过程比“旧内容先消失，新内容再出现”更连贯。

## 常见变体

常见类型：

- 两张图片交叉淡化。
- 标签页内容切换。
- 产品配色预览切换。
- 背景图或背景颜色渐变切换。
- 音乐封面和播放信息更新。

## 适合用在哪里

两个位置相同、内容不同的状态。新旧内容尺寸差异很大时，还要配合布局动画，避免容器突然跳动。

## 什么时候不用

Vibes补充：新旧内容尺寸差异大时不能只叠加透明度；需处理容器高度和快速切换。

## 提示词例子

```text
切换标签页时使用交叉淡化（Crossfade）：旧内容淡出的同时，新内容在相同位置淡入。保持容器高度稳定，快速切换时取消上一段未完成动画。
```
