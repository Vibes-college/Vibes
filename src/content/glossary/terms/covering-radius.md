---
id: 'covering-radius'
title: '覆盖半径'
english: 'Covering radius'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：从一点展开的主题',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/CircularThemeProvider.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 覆盖半径 / Covering radius

从某个圆心到最远画面角落的距离，让圆形扩张最终覆盖整个窗口。

## 常见变体

从点击点、元素中心、视口角落扩张。

## 适合用在哪里

圆形主题揭示和径向遮挡。

## 什么时候不用

不能混用页面坐标与视口坐标，也不能只按较短边计算半径。

## 提示词例子

```text
从按钮中心扩张圆形区域，半径取到最远视口角落的距离，窗口改变后重新计算。
```
