---
id: 'paired-masks'
title: '成对遮罩'
english: 'Paired masks'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：双帘开合转场',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/CurtainPageTransition.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 成对遮罩 / Paired masks

用两个从相对方向进入的图层覆盖旧画面，再一起露出新画面。

## 常见变体

左右合拢、上下合拢、从中心向外退出。

## 适合用在哪里

帘幕式转场和主视觉揭示。

## 什么时候不用

两层遮挡不能留下无法恢复的缝隙或拦截层。

## 提示词例子

```text
用左右两层遮挡合拢覆盖旧内容，数据就绪后替换，再同时退开；失败时恢复可操作页面。
```
