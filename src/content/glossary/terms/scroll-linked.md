---
id: 'scroll-linked'
title: '跟随滚动进度'
english: 'Scroll-linked'
aliases: ['Scroll-driven', 'Scrub']
category: '触发方式'
provenance: '原文摘录与补充'
sources:
  [
    {
      'title': 'Vibe Coding 网页动效词典（上篇）：教你准确描述页面怎么动',
      'author': 'Adrian Punk',
      'url': 'https://x.com/adrianpunk115/article/2099485951701721585',
      'section': '跟随滚动进度（Scroll-linked）',
    },
  ]
---

# 跟随滚动进度 / Scroll-linked

跟随滚动进度指动画和页面滚动直接绑定。用户滚动一部分，动画也只完成相应部分；用户往回滚，动画同步倒放。

## 常见变体

常见搭配：

- **滚动驱动（Scroll-driven）：** 使用滚动位置控制动画进度。
- **进度同步（Scrub）：** 动画紧跟滚动，也可以加入少量跟随延迟。
- **固定内容（Pin）：** 某个区块暂时固定，旁边内容继续变化。
- **滚动进度（Scroll progress）：** 用进度条、章节编号或图形变化显示阅读位置。

这里要分清：进入视口（Scroll-triggered）像按下播放键，触发后动画自己播完；跟随滚动（Scroll-linked）像拖动视频进度条，滚到哪里就播放到哪里。

## 适合用在哪里

Vibes整理：产品拆解、滚动叙事及阅读进度。

## 什么时候不用

Vibes补充：简单内容入场不必固定整段页面；不要让主要信息只能在精确滚动位置读到。

## 提示词例子

```text
产品拆解区使用跟随滚动进度（Scroll-linked）：页面向下滚动时，产品图按照滚动进度逐步展开；向上滚动时同步倒放。该区块暂时固定（Pin），滚动结束后自然释放。
```
