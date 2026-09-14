---
id: 'load-route'
title: '页面加载与路由切换'
english: 'Load / Route'
aliases: ['页面加载', '路由切换']
category: '触发方式'
provenance: '原文摘录与补充'
sources:
  [
    {
      'title': 'Vibe Coding 网页动效词典（上篇）：教你准确描述页面怎么动',
      'author': 'Adrian Punk',
      'url': 'https://x.com/adrianpunk115/article/2099485951701721585',
      'section': '页面加载与路由切换（Load / Route）',
    },
  ]
---

# 页面加载与路由切换 / Load / Route

页面首次打开、组件挂载和页面切换也能触发动画。这类触发决定首屏怎样进入，以及离开旧页面、进入新页面时如何衔接。

## 常见变体

常见类型：

- **页面加载（Page load）：** 首次打开页面时播放。
- **组件挂载（On mount）：** 某个组件被加入页面时播放。
- **进入页面（Route enter）：** 新页面出现时触发。
- **离开页面（Route exit）：** 旧页面关闭前触发。
- **转场完成（Transition complete）：** 页面切换结束后，再播放内部内容。
- **数据就绪（Data ready）：** 数据加载完成后，从骨架屏切换到真实内容。

## 适合用在哪里

Vibes整理：首屏进入、组件加入、页面离开与进入的衔接。

## 什么时候不用

Vibes补充：不要只靠固定计时推定数据已准备好；连续导航不能被未完成动画阻塞。

## 提示词例子

```text
进入新页面（Route enter）时先完成页面容器的淡入，再播放标题和卡片入场；离开页面（Route exit）时快速收起。用户连续切换页面时取消尚未完成的动画，不能阻塞导航。
```
