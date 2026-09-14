---
locale: zh
status: published
title: 展开成面板的浮动导航
summary: 顶部短栏展开为分组导航面板，让主要链接、辅助入口和社交链接按层级出现。
description: 顶部短栏展开为分组导航面板，让主要链接、辅助入口和社交链接按层级出现。
previewText:
  eyebrow: 视觉交互
  display: Floating Menu
  note: Great UI · 交互学习
learning:
  category: 视觉交互
  classification:
    type: 组件
    purpose:
      - 页面导航
    behavior:
      - 面板展开
      - 导航分组
      - 错峰出现
  placementHint: 链接数量适中的作品集、机构或品牌网站。
  changesHint: 把开关改为有展开状态的button，支持Escape与焦点返回；用最大视口宽高限制面板，替换Next Link为项目真实路由并处理导航后关闭。
  preserve:
    - 实际打开、关闭面板，点击主链接会收起；接入后链接必须指向真实页面。
    - 导航层级与目标清楚，关闭后焦点回到入口，移动端能读到全部链接。
  checks:
    - 实际打开、关闭面板，点击主链接会收起；接入后链接必须指向真实页面。
    - 320px宽度不横向溢出，小高度可滚动到底部；键盘可打开并访问所有链接，前进后退没有残留浮层。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 点击短栏展开，菜单文字错峰进入；内部主链接点击后关闭，点击外部或Close也关闭。预览链接均为#。 保留项目自己的内容与样式，先核对固定源码中的primaryLinks / secondaryLinks / socialLinks、motion.div animate width / height、isOpen / next/link。
      judge: 实际打开、关闭面板，点击主链接会收起；接入后链接必须指向真实页面。
    - id: improve
      title: 变成各输入方式都可用的导航
      action: 把开关改为有展开状态的button，支持Escape与焦点返回；用最大视口宽高限制面板，替换Next Link为项目真实路由并处理导航后关闭。
      judge: 320px宽度不横向溢出，小高度可滚动到底部；键盘可打开并访问所有链接，前进后退没有残留浮层。
    - id: quiet
      title: 减少动效也能完成
      action: 保留展开成面板的浮动导航的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；开关是div，缺键盘按钮语义；展开固定380px宽、700px高，会超出小屏。组件直接依赖next/link，移植其他路由时必须替换。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 导航内容
      - primaryLinks / secondaryLinks / socialLinks
      - 主次链接走Next Link，社交链接另开标签；替换所有#占位。
    - - 尺寸边界
      - motion.div animate width / height
      - 打开默认380×700，需要根据视口可用空间限制。
    - - 触发与路由
      - isOpen / next/link
      - 补原生按钮和键盘关闭，在现有框架接正确链接实现。
  glossary:
    floating-menu-mechanism:
      title: 渐进展开
      english: Progressive disclosure
      kind: 行为与原理
      definition: 先保留简短入口，用户需要时再展示更完整的选项层级。
      context: 容器在320×56和380×700之间做弹簧尺寸动画；内容用父子variants按顺序进入与反向退出。
      parameter: primaryLinks / secondaryLinks / socialLinks：主次链接走Next Link，社交链接另开标签；替换所有#占位。；motion.div animate width / height：打开默认380×700，需要根据视口可用空间限制。；isOpen / next/link：补原生按钮和键盘关闭，在现有框架接正确链接实现。
      judgment: 开关是div，缺键盘按钮语义；展开固定380px宽、700px高，会超出小屏。组件直接依赖next/link，移植其他路由时必须替换。
---

## 拆解设计

### 它在做什么

点击短栏展开，菜单文字错峰进入；内部主链接点击后关闭，点击外部或Close也关闭。预览链接均为#。

### 效果是怎么形成的

[[floating-menu-mechanism|渐进展开]]：容器在320×56和380×700之间做弹簧尺寸动画；内容用父子variants按顺序进入与反向退出。

### 接进项目时要注意什么

开关是div，缺键盘按钮语义；展开固定380px宽、700px高，会超出小屏。组件直接依赖next/link，移植其他路由时必须替换。

### 适合用在哪里

链接数量适中的作品集、机构或品牌网站。

### 什么时候不用

高频工具栏、需要同时持续看到大量导航的后台，或把示例#链接当成完成路由。

### 试一次，就会更懂

展开后点击Work观察收起，再比较它是否真的换页；缩小高度检查最下面的社交入口。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

可提供导航入口，另一个页面转场负责内容交接；统一路由状态，不能由两个监听器分别截获同一次点击。
