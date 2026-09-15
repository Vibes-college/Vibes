---
id: 'view-swap'
title: '内容切换时机'
english: 'View swap'
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

# 内容切换时机 / View swap

把旧视图替换成新视图的时刻。它需要与动画的遮挡状态协调。

## 常见变体

直接替换、遮挡后替换、数据就绪后替换。

## 适合用在哪里

需要把内容替换与过渡协调的导航。

## 什么时候不用

不能把固定计时或动画开始当作数据就绪。

## 提示词例子

```text
等遮挡到位且新页面数据准备好后再替换内容，随后移开遮挡；连续导航时忽略过期结果。
```
