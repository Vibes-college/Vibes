---
id: 'height-transition'
title: '高度动画'
english: 'Height transition'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：折叠问答',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/Accordion.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 高度动画 / Height transition

逐步改变内容区域占用的高度，让周围布局随之重新排列。

## 常见变体

固定高度之间变化、折叠到内容实际高度。

## 适合用在哪里

答案展开、内容区扩展和菜单尺寸变化。

## 什么时候不用

内容长度可变时不要假设固定终点高度；大范围重排需要核对性能。

## 提示词例子

```text
答案区域从收起过渡到内容实际高度，结束后容纳文字变化；减少动效时直接展开。
```
