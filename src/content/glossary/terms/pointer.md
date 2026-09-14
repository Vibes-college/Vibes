---
id: 'pointer'
title: '指针位置、移动与距离'
english: 'Pointer'
aliases: ['指针']
category: '触发方式'
provenance: '原文摘录与补充'
sources:
  [
    {
      'title': 'Vibe Coding 网页动效词典（上篇）：教你准确描述页面怎么动',
      'author': 'Adrian Punk',
      'url': 'https://x.com/adrianpunk115/article/2099485951701721585',
      'section': '指针位置、移动与距离（Pointer）',
    },
  ]
---

# 指针位置、移动与距离 / Pointer

Pointer 是鼠标、触控笔等指针设备的统一叫法。它可以读取光标的位置、移动方向、速度和与元素之间的距离，因此比普通 Hover 更适合鼠标跟随、视线跟随和互动背景。

## 常见变体

常见类型：

- **指针移动（Pointer move）：** 光标移动时持续更新动画。
- **位置映射（Pointer position）：** 把光标横纵坐标映射到倾斜角度、光照或渐变中心。
- **距离感应（Pointer proximity）：** 越靠近元素，效果越明显。
- **移动方向（Pointer direction）：** 根据光标从哪一侧进入，决定图片或文字的进入方向。
- **移动速度（Pointer velocity）：** 光标移动越快，拖尾、拉伸或惯性越明显。

## 适合用在哪里

Vibes整理：鼠标跟随、视线跟随、互动背景和卡片光晕。

## 什么时候不用

Vibes补充：触屏没有持续悬停位置；阅读内容不应随着指针不断晃动。

## 提示词例子

```text
卡片内部光晕跟随指针位置（Pointer position）移动，靠近中心时更明显，离开卡片后平滑回到默认位置。限制效果范围，不能让卡片文字跟着晃动；触屏设备关闭指针跟随。
```
