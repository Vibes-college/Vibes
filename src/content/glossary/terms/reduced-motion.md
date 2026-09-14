---
id: 'reduced-motion'
title: '减少动态效果'
english: 'Reduced motion'
aliases: []
category: 'UX规则'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：错峰页面转场',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/StaggeredPageTransition.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
    {
      'title': 'Great UI：折叠问答',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/Accordion.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
    {
      'title': 'Great UI：滚动文字揭示',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/TextReveal.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 减少动态效果 / Reduced motion

尊重用户在系统中减少动画的偏好，为大范围运动提供更安静的替代方式。

## 常见变体

直接显示最终状态、缩短移动、以静态反馈替代循环。

## 适合用在哪里

大范围移动、回弹、滚动叙事和持续循环。

## 什么时候不用

不要仅缩短时长，却保留同样强烈的位移或闪动。

## 提示词例子

```text
尊重系统减少动效偏好，关闭非必要循环和大幅移动，同时保留状态反馈与所有操作。
```
