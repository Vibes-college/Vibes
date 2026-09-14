---
id: 'layout-animation'
title: '布局动画'
english: 'Layout animation'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：展开设置的浮动工具条',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/FloatingDockMenu.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 布局动画 / Layout animation

读取布局变化前后的尺寸位置，再用过渡连接，减少容器突然跳变。

## 常见变体

位置变化、尺寸变化、共享元素衔接。

## 适合用在哪里

折叠区、菜单、列表重排和标签内容。

## 什么时候不用

不能以视觉过渡掩盖不可预测的真实布局跳变。

## 提示词例子

```text
内容变化时连接布局前后的尺寸与位置，保持焦点所在元素可见，减少动效时直接布局。
```
