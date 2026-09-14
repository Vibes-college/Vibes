---
id: 'transform-origin'
title: '缩放原点'
english: 'Transform origin'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：百叶条带转场',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/VenetianBlindsPageTransition.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 缩放原点 / Transform origin

指定元素缩放时保持不动的位置，决定它从哪一侧展开或收回。

## 常见变体

中心、边缘、角落、自定义坐标。

## 适合用在哪里

缩放、旋转及展开方向的控制。

## 什么时候不用

不能把缩放原点与元素布局位置混为一谈。

## 提示词例子

```text
让下划线以左端为缩放原点横向展开，正文位置保持稳定。
```
