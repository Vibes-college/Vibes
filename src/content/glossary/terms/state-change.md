---
id: 'state-change'
title: '组件状态变化'
english: 'State change'
aliases: ['状态变化']
category: '触发方式'
provenance: '原文摘录与补充'
sources:
  [
    {
      'title': 'Vibe Coding 网页动效词典（上篇）：教你准确描述页面怎么动',
      'author': 'Adrian Punk',
      'url': 'https://x.com/adrianpunk115/article/2099485951701721585',
      'section': '组件状态变化（State change）',
    },
  ]
---

# 组件状态变化 / State change

组件从一种状态变成另一种状态，也会触发动效。它常用于解释“刚才的操作带来了什么变化”，比纯装饰动画更重要。

## 常见变体

常见状态：

- 展开与收起（Expand / Collapse）
- 选中与取消（Select / Deselect）
- 加载、成功与失败（Loading / Success / Error）
- 开启与关闭（On / Off）
- 内容更新（Content update）
- 数值变化（Value change）

## 适合用在哪里

Vibes整理：展开、选中、加载、成功、失败和内容更新。

## 什么时候不用

Vibes补充：不要以动画替代真实状态，也不要只用颜色表达错误。

## 提示词例子

```text
提交表单后，根据状态变化（State change）切换反馈：加载时按钮显示处理中，成功后变成完成状态，失败时显示错误提示。各状态平滑衔接，错误信息不能只靠颜色区分。
```
