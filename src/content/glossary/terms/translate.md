---
id: 'translate'
title: '位移'
english: 'Translate'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：错峰页面转场',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/StaggeredPageTransition.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 位移 / Translate

改变元素在画面里的显示位置，同时保留它在布局中的占位。

## 常见变体

水平、垂直及双轴位移。

## 适合用在哪里

抽屉、轻微进入与悬停反馈。

## 什么时候不用

位移不会自动给邻近元素腾出布局空间。

## 提示词例子

```text
让卡片轻微向上位移，保持原有布局占位；减少动效时直接显示最终状态。
```
