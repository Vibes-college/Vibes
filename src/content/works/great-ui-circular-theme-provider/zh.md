---
locale: zh
status: published
title: 从一点展开的主题
summary: 让新主题从按钮、角落或指定点形成圆形扩散，将状态变化与触发位置联系起来。
description: 让新主题从按钮、角落或指定点形成圆形扩散，将状态变化与触发位置联系起来。
previewText:
  eyebrow: 主题切换
  display: Circular Theme Provider
  note: Great UI · 交互学习
learning:
  category: 主题切换
  classification:
    type: 组件
    purpose:
      - 主题切换
    behavior:
      - 圆形揭示
      - 位置关联
  placementHint: 有明确明暗切换入口的作品集、内容站或设置页。
  changesHint: 把项目现有主题作为受控状态；统一根视图动画调度，在finished后交还后续动作，避免多个提供者同时写入根元素。
  preserve:
    - 实际切换后根主题与显示文案一致，动画结束后可再次操作；减少动态效果或不支持API时应立即切换。
    - 主题是真实状态变化，文字、图片与按钮在新主题中仍可辨认。
  checks:
    - 实际切换后根主题与显示文案一致，动画结束后可再次操作；减少动态效果或不支持API时应立即切换。
    - 从项目入口与系统偏好改变主题都一致，重复触发不重叠，减少动态效果下仍完成切换。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 触发时解析圆心坐标，更新根主题，让新画面的圆形裁切从0扩展到最远角落之外，结束后恢复按钮。 保留项目自己的内容与样式，先核对固定源码中的triggerTransition / defaultCenter、duration / easing、theme / onThemeChange。
      judge: 实际切换后根主题与显示文案一致，动画结束后可再次操作；减少动态效果或不支持API时应立即切换。
    - id: improve
      title: 接入唯一主题状态
      action: 把项目现有主题作为受控状态；统一根视图动画调度，在finished后交还后续动作，避免多个提供者同时写入根元素。
      judge: 从项目入口与系统偏好改变主题都一致，重复触发不重叠，减少动态效果下仍完成切换。
    - id: quiet
      title: 减少动效也能完成
      action: 保留从一点展开的主题的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；键盘激活按钮时事件坐标可能不是按钮中心；使用 currentTarget 元素作为起点更稳定。传入页面坐标时也要明确这里使用视口坐标。 它会写入整个根元素的dark类和data-theme，并共用根视图样式；需要唯一主题负责人。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 扩散起点
      - triggerTransition / defaultCenter
      - 可用角落名称、坐标、事件或元素；元素会读取边界中心。
    - - 扩散速度
      - duration / easing
      - 默认500毫秒、ease-in-out。
    - - 状态来源
      - theme / onThemeChange
      - 受控模式与项目现有主题同步，避免另一状态单独切换根元素。
  glossary:
    circular-theme-provider-mechanism:
      title: 覆盖半径
      english: Covering radius
      kind: 行为与原理
      definition: 从某个圆心到最远画面角落的距离，让圆形扩张最终覆盖整个窗口。
      context: 最终半径取圆心到最远角落的距离，确保整个窗口都进入新主题；事件坐标、元素中心与预设角落均可作为起点。
      parameter: triggerTransition / defaultCenter：可用角落名称、坐标、事件或元素；元素会读取边界中心。；duration / easing：默认500毫秒、ease-in-out。；theme / onThemeChange：受控模式与项目现有主题同步，避免另一状态单独切换根元素。
      judgment: 键盘激活按钮时事件坐标可能不是按钮中心；使用 currentTarget 元素作为起点更稳定。传入页面坐标时也要明确这里使用视口坐标。 它会写入整个根元素的dark类和data-theme，并共用根视图样式；需要唯一主题负责人。
---

## 拆解设计

### 它在做什么

触发时解析圆心坐标，更新根主题，让新画面的圆形裁切从0扩展到最远角落之外，结束后恢复按钮。

### 效果是怎么形成的

[[circular-theme-provider-mechanism|覆盖半径]]：最终半径取圆心到最远角落的距离，确保整个窗口都进入新主题；事件坐标、元素中心与预设角落均可作为起点。

### 接进项目时要注意什么

键盘激活按钮时事件坐标可能不是按钮中心；使用 currentTarget 元素作为起点更稳定。传入页面坐标时也要明确这里使用视口坐标。 它会写入整个根元素的dark类和data-theme，并共用根视图样式；需要唯一主题负责人。

### 适合用在哪里

有明确明暗切换入口的作品集、内容站或设置页。

### 什么时候不用

同页并行运行多个独立主题提供者，或用主题动画代替页面导航和业务反馈。

### 试一次，就会更懂

比较左上角与按钮中心两种触发，观察圆心是否对应操作位置。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

与其他主题转场是替代关系；组合导航时需协调根视图动画和主题写入。
