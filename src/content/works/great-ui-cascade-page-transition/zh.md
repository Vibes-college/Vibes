---
locale: zh
status: published
title: 对称阶梯转场
summary: 条带从中央向两边或从两边向中央依次移动，用对称的阶梯轮廓覆盖页面。
description: 条带从中央向两边或从两边向中央依次移动，用对称的阶梯轮廓覆盖页面。
previewText:
  eyebrow: 页面转场
  display: Cascade Page Transition
  note: Great UI · 交互学习
learning:
  category: 页面转场
  classification:
    type: 组件
    purpose:
      - 页面导航
    behavior:
      - 对称错峰
      - 阶梯轮廓
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
      action: 入场延迟按离中心或边缘的距离计算；覆盖后换内容，保留200毫秒停留再退场。示例是8条单色、从中间向外。 保留项目自己的内容与样式，先核对固定源码中的mode / columns、duration / staggerDelay、colors / showLeadingStroke / showTrailingStroke。
      judge: 实际触发原作，确认内容发生切换，过程结束后遮罩不再挡住操作；这只验证演示，不代表真实路由。
    - id: improve
      title: 让转场等待真实内容
      action: 将计时回调改为明确的进入、内容就绪、退出阶段；加载失败可恢复旧页，连续触发只保留有效请求，减少动态效果时直接导航。
      judge: 人为延迟和失败加载，确认未就绪时不露出空页，失败能恢复，退场后焦点到新标题，浏览器前进后退正确。
    - id: quiet
      title: 减少动效也能完成
      action: 保留对称阶梯转场的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；条数、mode 和间隔共同影响总等待；colors 为空没有有效颜色。边缘描线只是装饰，不应当作遮罩覆盖范围。 原作以计时器交接，没有等待目标数据或提供失败恢复；真实导航还需处理键盘焦点、历史和重复触发。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 对称顺序
      - mode / columns
      - in-to-out 或 out-to-in，默认14条，示例8条。
    - - 步阶速度
      - duration / staggerDelay
      - 默认0.55秒及0.035秒，成对条带共享延迟。
    - - 色条与边缘
      - colors / showLeadingStroke / showTrailingStroke
      - 描线默认关闭；先保证不透明色条完整覆盖。
  glossary:
    cascade-page-transition-mechanism:
      title: 距离时序
      english: Distance-based timing
      kind: 行为与原理
      definition: 以元素到某个中心或边缘的距离作为延迟依据，形成有方向的展开。
      context: 成对条带共享延迟，因此左右两边对称；mode 决定先走中间还是边缘，颜色可按条带循环。
      parameter: mode / columns：in-to-out 或 out-to-in，默认14条，示例8条。；duration / staggerDelay：默认0.55秒及0.035秒，成对条带共享延迟。；colors / showLeadingStroke / showTrailingStroke：描线默认关闭；先保证不透明色条完整覆盖。
      judgment: 条数、mode 和间隔共同影响总等待；colors 为空没有有效颜色。边缘描线只是装饰，不应当作遮罩覆盖范围。 原作以计时器交接，没有等待目标数据或提供失败恢复；真实导航还需处理键盘焦点、历史和重复触发。
---

## 拆解设计

### 它在做什么

入场延迟按离中心或边缘的距离计算；覆盖后换内容，保留200毫秒停留再退场。示例是8条单色、从中间向外。

### 效果是怎么形成的

[[cascade-page-transition-mechanism|距离时序]]：成对条带共享延迟，因此左右两边对称；mode 决定先走中间还是边缘，颜色可按条带循环。

### 接进项目时要注意什么

条数、mode 和间隔共同影响总等待；colors 为空没有有效颜色。边缘描线只是装饰，不应当作遮罩覆盖范围。 原作以计时器交接，没有等待目标数据或提供失败恢复；真实导航还需处理键盘焦点、历史和重复触发。

### 适合用在哪里

需要少量章节切换的作品集、活动或品牌页面。

### 什么时候不用

高频任务切换、需要立即反馈的工具界面，或与另一整屏转场同时运行。

### 试一次，就会更懂

看中间两条与最外两条谁先开始，再反转 mode 比较轮廓。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

与其他页面转场属于替代关系；同次导航只由一个转场和路由负责人调度。
