---
id: 'layer-staggering'
title: '图层错峰'
english: 'Layer staggering'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：多层扫过转场',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/SweepPageTransition.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 图层错峰 / Layer staggering

让占据同一区域的多个图层在不同时间开始，利用遮挡呈现层次。

## 常见变体

前后层依次覆盖、前后层依次退出。

## 适合用在哪里

多层色块转场和分层揭示。

## 什么时候不用

层数不能无限增加等待时间或绘制成本。

## 提示词例子

```text
让三层色块略微错开开始时间，形成层次；整组结束后移除遮挡，保留快速导航入口。
```
