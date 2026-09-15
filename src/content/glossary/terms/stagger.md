---
id: 'stagger'
title: '交错出现'
english: 'Stagger'
aliases: ['错峰', '错峰动画', '交错显现']
category: '动效类型'
provenance: '原文摘录与补充'
sources:
  [
    {
      'title': 'Vibe Coding 网页动效词典（上篇）：教你准确描述页面怎么动',
      'author': 'Adrian Punk',
      'url': 'https://x.com/adrianpunk115/article/2099485951701721585',
      'section': 'Stagger：交错出现',
    },
  ]
---

# 交错出现 / Stagger

Stagger 指一组相似元素依次开始动画，中文常叫“交错出现”或“错峰动画”。Delay 通常控制一个元素等待多久，Stagger 负责给列表中的每个元素自动错开一点时间。

## 常见变体

常见类型：

- 卡片从左到右依次出现。
- 列表从上到下依次出现。
- 导航菜单逐项展开。
- 标题按行、按词或按字符出现。
- 数据柱按照顺序增长。

常见英文写法：

```text
交错显现：staggered reveal
子元素交错：stagger children
依次入场：sequential entrance
级联动画：cascade animation
```

## 适合用在哪里

卡片列表、菜单、照片墙、数据面板、步骤流程和文字标题。整组要像连续动作，间隔太大会变成排队等候。

## 什么时候不用

Vibes补充：整组等待时间不宜随项目数量无限增长；长列表应限制首屏动画范围。

## 提示词例子

```text
让六张卡片交错出现（Stagger），按照从左到右、从上到下的阅读顺序依次进入。相邻卡片只保留很短的间隔，整组动画连贯、轻快。
```
