---
id: 'discrete-time-selection'
title: '离散时间选择'
english: 'Discrete time selection'
aliases: []
category: 'UX规则'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：按日期浏览的修订时间轴',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/RevisionTimeline.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 离散时间选择 / Discrete time selection

通过可选时间点浏览一份对应内容，空日期只提供间隔不提供记录。

## 常见变体

按日期、版本或事件节点选择。

## 适合用在哪里

版本历史、修订记录和时间线。

## 什么时候不用

空日期不能伪装为实际记录；超长跨度需限制一次加载数量。

## 提示词例子

```text
仅有记录的时间点可以选择，空日期显示间隔；选择后同步正文并保留当前状态。
```
