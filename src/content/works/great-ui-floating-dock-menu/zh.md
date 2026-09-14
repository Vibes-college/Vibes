---
locale: zh
status: published
title: 展开设置的浮动工具条
summary: 一排分类按钮按需向上展开设置，切换分类时容器跟随内容变化，让常用配置集中在手边。
description: 一排分类按钮按需向上展开设置，切换分类时容器跟随内容变化，让常用配置集中在手边。
previewText:
  eyebrow: 视觉交互
  display: Floating Dock Menu
  note: Great UI · 交互学习
learning:
  category: 视觉交互
  classification:
    type: 组件
    purpose:
      - 触发操作
    behavior:
      - 分类展开
      - 布局跟随
      - 开关状态
  placementHint: 少量分类清楚、可即时反馈的编辑器或工具设置。
  changesHint: 移除示例能力，绑定项目状态；用有名称的switch和button，增加展开语义、Escape及焦点返回，让数据变化与界面同步。
  preserve:
    - 切换分类、改变一项开关再返回，状态保持；点击外部关闭，真实业务需另接。
    - 每个设置有清晰名称和真实结果，未实现的动作不能以可用状态展示。
  checks:
    - 切换分类、改变一项开关再返回，状态保持；点击外部关闭，真实业务需另接。
    - 键盘可触达每项，切换值与实际配置一致，失败能还原；窄屏和软键盘不遮住必要内容。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 点击分类展开，再点同一分类或点击外部关闭；开关保存在组件内存并通知回调，action项只执行提供的onClick。 保留项目自己的内容与样式，先核对固定源码中的tabs / onItemToggle / menuItems.onClick、isFixed / menuWidth、entryEase / entryDuration / exitEase / exitDuration。
      judge: 切换分类、改变一项开关再返回，状态保持；点击外部关闭，真实业务需另接。
    - id: improve
      title: 让工具条反映真实设置
      action: 移除示例能力，绑定项目状态；用有名称的switch和button，增加展开语义、Escape及焦点返回，让数据变化与界面同步。
      judge: 键盘可触达每项，切换值与实际配置一致，失败能还原；窄屏和软键盘不遮住必要内容。
    - id: quiet
      title: 减少动效也能完成
      action: 保留展开设置的浮动工具条的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；默认AI、安全、导出条目都只是示例状态或空回调，没有对应服务。开关缺名称、action行是不可聚焦div，隐藏分类文字后也可能无可读名称；传入新tabs不会重置内部开关。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 设置与业务
      - tabs / onItemToggle / menuItems.onClick
      - toggle是内存布尔值，action调用外部回调，均不自带服务。
    - - 显示位置
      - isFixed / menuWidth
      - 默认固定底部、展开宽310px；预览是相对定位。
    - - 过渡节奏
      - entryEase / entryDuration / exitEase / exitDuration
      - 未提供ease时使用弹簧；0时长会被或运算回退，静态模式需修改分支。
  glossary:
    floating-dock-menu-mechanism:
      title: 布局动画
      english: Layout animation
      kind: 行为与原理
      definition: 读取布局变化前后的尺寸位置，再用过渡连接，减少容器突然跳变。
      context: activeIndex决定展开内容，LayoutGroup协调工具条与浮层大小变化；各设置按tab和item ID独立存储。
      parameter: tabs / onItemToggle / menuItems.onClick：toggle是内存布尔值，action调用外部回调，均不自带服务。；isFixed / menuWidth：默认固定底部、展开宽310px；预览是相对定位。；entryEase / entryDuration / exitEase / exitDuration：未提供ease时使用弹簧；0时长会被或运算回退，静态模式需修改分支。
      judgment: 默认AI、安全、导出条目都只是示例状态或空回调，没有对应服务。开关缺名称、action行是不可聚焦div，隐藏分类文字后也可能无可读名称；传入新tabs不会重置内部开关。
---

## 拆解设计

### 它在做什么

点击分类展开，再点同一分类或点击外部关闭；开关保存在组件内存并通知回调，action项只执行提供的onClick。

### 效果是怎么形成的

[[floating-dock-menu-mechanism|布局动画]]：activeIndex决定展开内容，LayoutGroup协调工具条与浮层大小变化；各设置按tab和item ID独立存储。

### 接进项目时要注意什么

默认AI、安全、导出条目都只是示例状态或空回调，没有对应服务。开关缺名称、action行是不可聚焦div，隐藏分类文字后也可能无可读名称；传入新tabs不会重置内部开关。

### 适合用在哪里

少量分类清楚、可即时反馈的编辑器或工具设置。

### 什么时候不用

把默认AI或安全文案当作已实现能力；需要复杂审批或大规模配置的界面。

### 试一次，就会更懂

打开Canvas，改变开关后切换分类再回来，区分内存状态与真实功能。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

承担设置入口，不等于输入采集或任务执行；和任务反馈结合时需由同一业务状态驱动。
