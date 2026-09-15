---
id: 'local-stacking'
title: '局部层级'
english: 'Local stacking'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：带姓名提示的头像叠放',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/AvatarStack.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 局部层级 / Local stacking

在重叠元素中提升当前项的绘制顺序，避免交互目标被相邻项盖住。

## 常见变体

悬停项置顶、聚焦项置顶、选中项置顶。

## 适合用在哪里

重叠头像、卡片组和局部提示。

## 什么时候不用

不能仅提高层级就认为提示不会被祖先裁切。

## 提示词例子

```text
当前头像获得交互时提升局部绘制层级，离开后恢复；提示仍需检查容器边界和键盘入口。
```
