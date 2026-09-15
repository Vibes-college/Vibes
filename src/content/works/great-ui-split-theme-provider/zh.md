---
locale: zh
status: published
title: 分割展开主题
summary: 让新主题从中央展开，或让旧主题向中央收拢，把明暗切换表现为一次有方向的揭示。
description: 让新主题从中央展开，或让旧主题向中央收拢，把明暗切换表现为一次有方向的揭示。
previewText:
  eyebrow: 主题切换
  display: Split Theme Provider
  note: Great UI · 交互学习
learning:
  category: 主题切换
  classification:
    type: 组件
    purpose:
      - 主题切换
    behavior:
      - 主题切换
      - 裁切揭示
  placementHint: 已有明确主题切换入口的内容站、作品集或设置页。
  changesHint: 让项目现有主题状态成为唯一来源，明确谁写入根属性；与其他根视图过渡统一调度，把结束交接挂到 transition.finished。
  preserve:
    - 切换模式和方向后点击对应按钮，核对根主题确实改变，动画结束后按钮重新可用。
    - 新旧主题使用一致的布局，切换结果与应用实际主题状态保持同步。
  checks:
    - 切换模式和方向后点击对应按钮，核对根主题确实改变，动画结束后按钮重新可用。
    - 从主题按钮和系统偏好改变主题都保持一致；连续触发不重叠，减少动态效果与不支持API时仍立即完成切换。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 选择向外或向内模式，再触发横向或纵向切换。组件更新页面根元素的主题属性，同时让浏览器生成的新旧画面按裁切范围交替出现。 保留项目自己的内容与样式，先核对固定源码中的direction / mode、duration / easing、theme / onThemeChange / useSplitTheme。
      judge: 切换模式和方向后点击对应按钮，核对根主题确实改变，动画结束后按钮重新可用。
    - id: improve
      title: 接入已有主题系统
      action: 让项目现有主题状态成为唯一来源，明确谁写入根属性；与其他根视图过渡统一调度，把结束交接挂到 transition.finished。
      judge: 从主题按钮和系统偏好改变主题都保持一致；连续触发不重叠，减少动态效果与不支持API时仍立即完成切换。
    - id: quiet
      title: 减少动效也能完成
      action: 保留分割展开主题的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；它写入整个 documentElement 的 dark 类和 data-theme，并共用根视图样式；多个主题管理器并存会争抢状态。onTransition 在主题更新时调用，不代表动画已经结束。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 展开方式
      - direction / mode
      - horizontal 或 vertical；in-to-out 展开新画面，out-to-in 收拢旧画面。
    - - 速度与节奏
      - duration / easing
      - 默认600毫秒与 ease-in-out，持续时间单位是毫秒。
    - - 主题归属
      - theme / onThemeChange / useSplitTheme
      - 受控模式由应用提供主题并接收变更；根属性仍由组件写入。
  glossary:
    split-theme-provider-mechanism:
      term: 'view-transition'
      context: View Transition 保存新旧根视图，clip-path 的 inset 从中央窄条扩展为整屏，或反向收拢旧视图；主题状态与视觉过渡由同一次触发协调。
      parameter: direction / mode：horizontal 或 vertical；in-to-out 展开新画面，out-to-in 收拢旧画面。；duration / easing：默认600毫秒与 ease-in-out，持续时间单位是毫秒。；theme / onThemeChange / useSplitTheme：受控模式由应用提供主题并接收变更；根属性仍由组件写入。
      judgment: 它写入整个 documentElement 的 dark 类和 data-theme，并共用根视图样式；多个主题管理器并存会争抢状态。onTransition 在主题更新时调用，不代表动画已经结束。
---

## 拆解设计

### 它在做什么

选择向外或向内模式，再触发横向或纵向切换。组件更新页面根元素的主题属性，同时让浏览器生成的新旧画面按裁切范围交替出现。

### 效果是怎么形成的

[[split-theme-provider-mechanism|视图过渡]]：View Transition 保存新旧根视图，clip-path 的 inset 从中央窄条扩展为整屏，或反向收拢旧视图；主题状态与视觉过渡由同一次触发协调。

### 接进项目时要注意什么

它写入整个 documentElement 的 dark 类和 data-theme，并共用根视图样式；多个主题管理器并存会争抢状态。onTransition 在主题更新时调用，不代表动画已经结束。

### 适合用在哪里

已有明确主题切换入口的内容站、作品集或设置页。

### 什么时候不用

与另一个独立全局主题提供者同时接管根元素；把它作为表单结果或页面导航的替代。

### 试一次，就会更懂

依次尝试 In to Out 和 Out to In，并比较横向、纵向；注意内容布局不需要跟着移动。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

它是全局主题能力，与其他主题转场属于替代关系；只有统一主题与根过渡负责人后，才考虑与导航效果协作。
