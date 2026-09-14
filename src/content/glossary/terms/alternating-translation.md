---
id: 'alternating-translation'
title: '交替位移'
english: 'Alternating translation'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：交错插入转场',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/InterlockingPageTransition.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 交替位移 / Alternating translation

让相邻元素从相反侧移动，在同一时刻形成相互穿插的视觉关系。

## 常见变体

相邻条带左右交替、上下交替。

## 适合用在哪里

条带转场、少量装饰性内容进入。

## 什么时候不用

高频交错移动不适合长正文或连续操作。

## 提示词例子

```text
相邻条带从相反方向进入，覆盖完成后替换内容，再退出；减少动效时直接切换。
```
