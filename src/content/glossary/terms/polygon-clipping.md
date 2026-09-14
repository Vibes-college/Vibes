---
id: 'polygon-clipping'
title: '多边形裁切'
english: 'Polygon clipping'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：沿方向扫开的主题',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/SwipeThemeProvider.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 多边形裁切 / Polygon clipping

通过一组顶点定义可见区域，改变顶点即可让画面沿直线边界揭示。

## 常见变体

三角形、斜边、多顶点区域。

## 适合用在哪里

几何揭示、斜向主题切换。

## 什么时候不用

对应关键帧顶点不匹配可能无法按预期过渡。

## 提示词例子

```text
使用相同数量的多边形顶点定义开始和结束裁切，确保终态覆盖目标区域。
```
