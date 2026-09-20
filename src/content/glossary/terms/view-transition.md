---
id: 'view-transition'
title: '视图过渡'
english: 'View Transition'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：分割展开主题',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/SplitThemeProvider.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 视图过渡 / View Transition

浏览器保存状态改变前后的画面，通过独立的过渡层连接这两个状态。

## 常见变体

整个视图过渡、指定元素之间的过渡。

## 适合用在哪里

状态切换前后需要视觉衔接的页面。

## 什么时候不用

不能假设所有运行环境都支持；过渡失败不应阻止真实状态更新。

## 提示词例子

```text
更新主题时使用视图过渡连接前后画面；不支持或减少动效时直接更新，并协调全局样式。
```
