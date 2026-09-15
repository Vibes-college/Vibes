---
locale: zh
status: published
title: 彩色边缘页面转场
summary: 用带彩色边缘的分块遮挡完成页面切换，让移动方向和节奏更鲜明。
description: 用带彩色边缘的分块遮挡完成页面切换，让移动方向和节奏更鲜明。
previewText:
  eyebrow: 页面转场
  display: Color Wipe Page Transition
  note: Great UI · 交互学习
learning:
  category: 页面转场
  classification:
    type: 组件
    purpose:
      - 页面导航
    behavior:
      - 错峰遮挡
      - 彩色边缘
  placementHint: 少量关键页面间的品牌化导航或作品展示。
  changesHint: 减少色条颜色和分块数量，保留项目品牌色；用真实加载状态和动画完成事件协调内容切换，失败和重复导航可中断恢复。
  preserve:
    - 选择方向触发转场，旧画面完整遮住后再换内容，面板全部退出后可继续操作。
    - 色条跟随对应面板，目标内容与遮挡时机一致，失败时能恢复可操作页面。
  checks:
    - 选择方向触发转场，旧画面完整遮住后再换内容，面板全部退出后可继续操作。
    - 慢速加载时不提前揭开空页，失败后无残留遮挡，前进后退和连续点击目标一致。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 多条面板错峰覆盖旧画面，在计算出的遮挡时刻调用 onViewSwap，停留50毫秒后退场。作者示例使用8块面板、只显示前缘，并向另一侧退出。 保留项目自己的内容与样式，先核对固定源码中的columns / duration / staggerDelay、showLeadingStroke / showTrailingStroke / strokeWidth、direction / exitOpposite / onViewSwap。
      judge: 选择方向触发转场，旧画面完整遮住后再换内容，面板全部退出后可继续操作。
    - id: improve
      title: 颜色更克制、切换更可靠
      action: 减少色条颜色和分块数量，保留项目品牌色；用真实加载状态和动画完成事件协调内容切换，失败和重复导航可中断恢复。
      judge: 慢速加载时不提前揭开空页，失败后无残留遮挡，前进后退和连续点击目标一致。
    - id: quiet
      title: 减少动效也能完成
      action: 保留彩色边缘页面转场的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；onViewSwap 来自固定计时，并不会等待路由数据或实际退场。附带的 RouteTransitionProvider 拦截文档链接，需要与项目路由、下载链接及并发导航规则核对。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 分块与节奏
      - columns / duration / staggerDelay
      - 组件默认10块、每次0.45秒、错开0.03秒；示例覆盖为8块。
    - - 边缘样式
      - showLeadingStroke / showTrailingStroke / strokeWidth
      - 默认前后缘都显示、宽10px；示例关闭后缘。
    - - 路线与退场
      - direction / exitOpposite / onViewSwap
      - 默认从左进入并原路退出；要等待实际数据和动画完成，必须增加明确交接。
  glossary:
    color-wipe-page-transition-mechanism:
      term: 'leading-edge'
      context: 面板本体负责遮挡，窄色条贴在它的前后边缘。上下进入时是竖向分块，左右进入时改为横向分条；颜色按数组循环分配。
      parameter: columns / duration / staggerDelay：组件默认10块、每次0.45秒、错开0.03秒；示例覆盖为8块。；showLeadingStroke / showTrailingStroke / strokeWidth：默认前后缘都显示、宽10px；示例关闭后缘。；direction / exitOpposite / onViewSwap：默认从左进入并原路退出；要等待实际数据和动画完成，必须增加明确交接。
      judgment: onViewSwap 来自固定计时，并不会等待路由数据或实际退场。附带的 RouteTransitionProvider 拦截文档链接，需要与项目路由、下载链接及并发导航规则核对。
---

## 拆解设计

### 它在做什么

多条面板错峰覆盖旧画面，在计算出的遮挡时刻调用 onViewSwap，停留50毫秒后退场。作者示例使用8块面板、只显示前缘，并向另一侧退出。

### 效果是怎么形成的

[[color-wipe-page-transition-mechanism|运动前缘]]：面板本体负责遮挡，窄色条贴在它的前后边缘。上下进入时是竖向分块，左右进入时改为横向分条；颜色按数组循环分配。

### 接进项目时要注意什么

onViewSwap 来自固定计时，并不会等待路由数据或实际退场。附带的 RouteTransitionProvider 拦截文档链接，需要与项目路由、下载链接及并发导航规则核对。

### 适合用在哪里

少量关键页面间的品牌化导航或作品展示。

### 什么时候不用

高频工具切换、筛选刷新，或与另一个全屏转场同时使用。

### 试一次，就会更懂

在原作尝试左右两种方向，留意色条跟随哪一侧边缘，以及内容在哪个时刻改变。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

与错峰页面转场属于同一导航位置的替代方案，不能仅因视觉不同就叠加使用。
