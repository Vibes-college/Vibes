---
id: 'direction-aware-transition'
title: '方向感知切换'
english: 'Direction-aware transition'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：悬停人物名单',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/TeamSection.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 方向感知切换 / Direction-aware transition

根据用户选择顺序决定新内容从哪一侧进入，让变化与浏览方向一致。

## 常见变体

上一项从一侧进入、下一项从另一侧进入。

## 适合用在哪里

有顺序的轮播、步骤与内容浏览。

## 什么时候不用

顺序不明确的内容不能随意赋予前后方向。

## 提示词例子

```text
根据用户选择上一项或下一项决定进入方向，快速切换时以最终选择为准。
```
