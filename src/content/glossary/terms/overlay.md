---
id: 'overlay'
title: '遮挡层'
english: 'Overlay'
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

# 遮挡层 / Overlay

放在内容上方的独立视觉层。它可以暂时盖住底下的内容，而不用移动内容本身。

## 常见变体

全屏覆盖、局部覆盖、半透明背景。

## 适合用在哪里

页面转场、对话框背景、局部揭示。

## 什么时候不用

不要让覆盖层意外拦截点击或永久挡住内容。

## 提示词例子

```text
转场时先用独立遮挡层覆盖旧内容，确认新内容就绪后移开；失败时撤除遮挡并提供重试。
```
