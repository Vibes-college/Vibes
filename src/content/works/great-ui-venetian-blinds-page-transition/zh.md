---
locale: zh
status: published
title: 百叶条带转场
summary: 一排细长条逐渐变宽或变高，盖住画面后再收细，形成百叶式开合。
description: 一排细长条逐渐变宽或变高，盖住画面后再收细，形成百叶式开合。
previewText:
  eyebrow: 页面转场
  display: Venetian Blinds Page Transition
  note: Great UI · 交互学习
learning:
  category: 页面转场
  classification:
    type: 组件
    purpose:
      - 页面导航
    behavior:
      - 条带缩放
      - 错峰开合
  placementHint: 需要少量章节切换的作品集、活动或品牌页面。
  changesHint: 将计时回调改为明确的进入、内容就绪、退出阶段；加载失败可恢复旧页，连续触发只保留有效请求，减少动态效果时直接导航。
  preserve:
    - 实际触发原作，确认内容发生切换，过程结束后遮罩不再挡住操作；这只验证演示，不代表真实路由。
    - 保留这一种主要转场规则；内容只在明确交接时改变，结束后恢复可操作状态。
  checks:
    - 实际触发原作，确认内容发生切换，过程结束后遮罩不再挡住操作；这只验证演示，不代表真实路由。
    - 人为延迟和失败加载，确认未就绪时不露出空页，失败能恢复，退场后焦点到新标题，浏览器前进后退正确。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 条带从0缩放到1，内容交接后再缩到0；支持依次、中央向外和边缘向内的延迟安排。 保留项目自己的内容与样式，先核对固定源码中的direction / columns、staggerType / staggerDelay、origin / duration。
      judge: 实际触发原作，确认内容发生切换，过程结束后遮罩不再挡住操作；这只验证演示，不代表真实路由。
    - id: improve
      title: 让转场等待真实内容
      action: 将计时回调改为明确的进入、内容就绪、退出阶段；加载失败可恢复旧页，连续触发只保留有效请求，减少动态效果时直接导航。
      judge: 人为延迟和失败加载，确认未就绪时不露出空页，失败能恢复，退场后焦点到新标题，浏览器前进后退正确。
    - id: quiet
      title: 减少动效也能完成
      action: 保留百叶条带转场的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；origin 要与缩放方向协调；预览只展示线性错峰和中心原点，不能因此声称已覆盖全部组合。 原作以计时器交接，没有等待目标数据或提供失败恢复；真实导航还需处理键盘焦点、历史和重复触发。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 条带轴向
      - direction / columns
      - 默认20条，horizontal 为横条，vertical 为竖条。
    - - 开始顺序
      - staggerType / staggerDelay
      - linear、center-out、edge-in；默认间隔0.02秒。
    - - 开合位置
      - origin / duration
      - 默认中心、单程0.5秒；覆盖后另停200毫秒。
  glossary:
    venetian-blinds-page-transition-mechanism:
      term: 'transform-origin'
      context: horizontal 用横条的 scaleY，vertical 用竖条的 scaleX；这是二维缩放，并没有真实三维翻转。
      parameter: direction / columns：默认20条，horizontal 为横条，vertical 为竖条。；staggerType / staggerDelay：linear、center-out、edge-in；默认间隔0.02秒。；origin / duration：默认中心、单程0.5秒；覆盖后另停200毫秒。
      judgment: origin 要与缩放方向协调；预览只展示线性错峰和中心原点，不能因此声称已覆盖全部组合。 原作以计时器交接，没有等待目标数据或提供失败恢复；真实导航还需处理键盘焦点、历史和重复触发。
---

## 拆解设计

### 它在做什么

条带从0缩放到1，内容交接后再缩到0；支持依次、中央向外和边缘向内的延迟安排。

### 效果是怎么形成的

[[venetian-blinds-page-transition-mechanism|缩放原点]]：horizontal 用横条的 scaleY，vertical 用竖条的 scaleX；这是二维缩放，并没有真实三维翻转。

### 接进项目时要注意什么

origin 要与缩放方向协调；预览只展示线性错峰和中心原点，不能因此声称已覆盖全部组合。 原作以计时器交接，没有等待目标数据或提供失败恢复；真实导航还需处理键盘焦点、历史和重复触发。

### 适合用在哪里

需要少量章节切换的作品集、活动或品牌页面。

### 什么时候不用

高频任务切换、需要立即反馈的工具界面，或与另一整屏转场同时运行。

### 试一次，就会更懂

比较横条与竖条，注意条带边缘是在伸缩，还是整体移动。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

与其他页面转场属于替代关系；同次导航只由一个转场和路由负责人调度。
