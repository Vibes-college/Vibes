---
id: 'external-profile-state'
title: '外部资料状态'
english: 'External profile state'
aliases: []
category: 'UX规则'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：X 账号悬浮资料卡',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/TwitterCard.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 外部资料状态 / External profile state

把未加载、已取得与失败区分开，避免把初始占位值误读成真实结果。

## 常见变体

尚未请求、加载中、已取得、失败或过期。

## 适合用在哪里

读取外部人物或项目资料的卡片。

## 什么时候不用

缺数据不能显示为真实的0值，也不能把示例简介当作已加载内容。

## 提示词例子

```text
分别显示资料加载、成功和失败状态；切换账号时取消旧请求，失败保留重试入口。
```
