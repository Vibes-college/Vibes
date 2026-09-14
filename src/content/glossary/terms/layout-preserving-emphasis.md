---
id: 'layout-preserving-emphasis'
title: '不改变布局的强调'
english: 'Layout-preserving emphasis'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：有分隔线反馈的图片卡',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/Card.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 不改变布局的强调 / Layout-preserving emphasis

通过覆盖层的视觉变化表达反馈，保持正文位置与尺寸稳定。

## 常见变体

下划线伸展、覆盖色变化、阴影反馈。

## 适合用在哪里

卡片、链接和不宜发生布局位移的区域。

## 什么时候不用

装饰反馈不能替代可点击语义或真实目标。

## 提示词例子

```text
让装饰下划线从左端展开，标题和相邻内容不移动；链接继续使用真实地址和键盘焦点。
```
