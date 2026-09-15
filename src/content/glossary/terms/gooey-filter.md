---
id: 'gooey-filter'
title: '黏连滤镜'
english: 'Gooey filter'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：黏连展开的圆形菜单',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/RadialGooeyMenu.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 黏连滤镜 / Gooey filter

把邻近形状先模糊再提高透明度对比，让它们相接时出现柔软的连接。

## 常见变体

邻近圆形黏连、按钮分离与合拢。

## 适合用在哪里

少量图标菜单和装饰形状。

## 什么时候不用

不要连同正文一起模糊；滤镜范围和绘制开销需限制。

## 提示词例子

```text
只对菜单的背景形状使用黏连滤镜，图标和文字独立保持清晰，减少动效时直接展开。
```
