---
id: 'diff-animation'
title: '差异动画'
english: 'Diff animation'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：扰动字形的命令切换',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/ScrambledInstallCommand.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 差异动画 / Diff animation

只对新旧内容发生变化的部分加动画，让注意力集中在实际更新处。

## 常见变体

新增部分强调、替换部分过渡、删除部分淡出。

## 适合用在哪里

版本变化、命令切换和局部内容更新。

## 什么时候不用

不能让未改变的整段内容反复播放。

## 提示词例子

```text
比较前后文本，只对变化片段加入短暂动画；完整结果始终可复制，减少动效时直接更新。
```
