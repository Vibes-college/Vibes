---
id: 'focus-interval'
title: '聚焦区间'
english: 'Focus interval'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：词语逐个聚焦',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/WordFocusScroll.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 聚焦区间 / Focus interval

给每个词分配一小段滚动范围，在这段范围内完成强调变化。

## 常见变体

不重叠区间、部分重叠区间、前后停留区间。

## 适合用在哪里

用滚动进度依次强调词或段落。

## 什么时候不用

这里是动画进度区间，不是键盘操作焦点。

## 提示词例子

```text
给每个短语分配连续滚动区间，在各自区间内完成强调；不要改变键盘焦点。
```
