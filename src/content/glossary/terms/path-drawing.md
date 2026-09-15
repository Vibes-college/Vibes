---
id: 'path-drawing'
title: '路径描画'
english: 'Path drawing'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：路径描画标志',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/AnimatedPath.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 路径描画 / Path drawing

通过改变可见的描边长度，让一条已有路径看起来正在被画出。

## 常见变体

从起点描画、反向擦除、分段描画。

## 适合用在哪里

线条图标、流程路径和少量图形强调。

## 什么时候不用

复杂图形描画不能延误信息出现。

## 提示词例子

```text
沿SVG已有路径逐步显示描边，完成后保留完整图形；减少动效时直接显示。
```
