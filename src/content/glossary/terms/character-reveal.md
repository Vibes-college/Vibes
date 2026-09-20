---
id: 'character-reveal'
title: '逐字揭示'
english: 'Character reveal'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：滚动文字揭示',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/TextReveal.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 逐字揭示 / Character reveal

给每个字符分配自己的进度区间，按阅读顺序改变显示状态。

## 常见变体

逐字符淡入、位移、模糊或裁剪显现。

## 适合用在哪里

短标题、短数字和少量强调文字。

## 什么时候不用

长正文不宜逐字等待；中文和组合字符需要正确分割。

## 提示词例子

```text
让短标题按字符依次显现，整句快速完成；保留完整可读文本，减少动效时一次显示。
```
