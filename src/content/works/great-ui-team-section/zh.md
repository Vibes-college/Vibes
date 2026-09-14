---
locale: zh
status: published
title: 悬停人物名单
summary: 把人物姓名排成清晰名单，鼠标经过时显示职位和照片；窄屏直接展示人物卡片。
description: 把人物姓名排成清晰名单，鼠标经过时显示职位和照片；窄屏直接展示人物卡片。
previewText:
  eyebrow: 布局与卡片
  display: Team Section
  note: Great UI · 交互学习
learning:
  category: 布局与卡片
  classification:
    type: 组件
    purpose:
      - 作品展示
    behavior:
      - 悬停选择
      - 方向感知换图
      - 响应式展示
  placementHint: 团队、嘉宾、作者等人数较少的人物介绍。
  changesHint: 用可聚焦的选择入口同步 onFocus 与悬停状态，并为桌面名单提供真实社交链接；减少动态效果时直接换图。
  preserve:
    - 依次悬停不同姓名，核对照片、职位与人物一致；窄屏不依赖悬停也能读到全部信息。
    - 人物文字和照片一一对应，任何输入方式都能读取重要资料。
  checks:
    - 依次悬停不同姓名，核对照片、职位与人物一致；窄屏不依赖悬停也能读到全部信息。
    - 只用键盘访问每个人的信息和链接；上下选择时照片不错配，窄屏没有重复或隐藏资料。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 桌面悬停姓名会显示对应职位与右侧照片；移到上一位或下一位时，照片从不同方向进入。小屏改为每个人都带图片和资料的纵向布局。 保留项目自己的内容与样式，先核对固定源码中的speakers / Speaker、slideDistance / align / rowClassName、grayscale / activeImageClassName / imageVariants。
      judge: 依次悬停不同姓名，核对照片、职位与人物一致；窄屏不依赖悬停也能读到全部信息。
    - id: improve
      title: 键盘与桌面链接补齐
      action: 用可聚焦的选择入口同步 onFocus 与悬停状态，并为桌面名单提供真实社交链接；减少动态效果时直接换图。
      judge: 只用键盘访问每个人的信息和链接；上下选择时照片不错配，窄屏没有重复或隐藏资料。
    - id: quiet
      title: 减少动效也能完成
      action: 保留悬停人物名单的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；桌面行只监听鼠标进入，没有等价键盘选择；social 链接只在窄屏卡片出现。桌面上需要同时补齐可聚焦入口和每位人物的实际链接。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 人物资料
      - speakers / Speaker
      - 提供姓名、职位、公司、图片和可选社交地址；空数组不渲染。
    - - 名单反馈
      - slideDistance / align / rowClassName
      - 职位默认移动20px进入，行可按中心、基线或底端对齐。
    - - 照片表现
      - grayscale / activeImageClassName / imageVariants
      - 默认黑白；换图用0.4秒的位移，新旧照片在相同位置交接。
  glossary:
    team-section-mechanism:
      title: 方向感知切换
      english: Direction-aware transition
      kind: 行为与原理
      definition: 根据用户选择顺序决定新内容从哪一侧进入，让变化与浏览方向一致。
      context: activeIndex 与 prevIndex 决定选中人物和图片进入方向，AnimatePresence 让旧照片缩小淡出、新照片从上方或下方进入。
      parameter: speakers / Speaker：提供姓名、职位、公司、图片和可选社交地址；空数组不渲染。；slideDistance / align / rowClassName：职位默认移动20px进入，行可按中心、基线或底端对齐。；grayscale / activeImageClassName / imageVariants：默认黑白；换图用0.4秒的位移，新旧照片在相同位置交接。
      judgment: 桌面行只监听鼠标进入，没有等价键盘选择；social 链接只在窄屏卡片出现。桌面上需要同时补齐可聚焦入口和每位人物的实际链接。
---

## 拆解设计

### 它在做什么

桌面悬停姓名会显示对应职位与右侧照片；移到上一位或下一位时，照片从不同方向进入。小屏改为每个人都带图片和资料的纵向布局。

### 效果是怎么形成的

[[team-section-mechanism|方向感知切换]]：activeIndex 与 prevIndex 决定选中人物和图片进入方向，AnimatePresence 让旧照片缩小淡出、新照片从上方或下方进入。

### 接进项目时要注意什么

桌面行只监听鼠标进入，没有等价键盘选择；social 链接只在窄屏卡片出现。桌面上需要同时补齐可聚焦入口和每位人物的实际链接。

### 适合用在哪里

团队、嘉宾、作者等人数较少的人物介绍。

### 什么时候不用

大量联系人管理、要求快速逐列比较资料的表格、只放姓名不提供可访问详情。

### 试一次，就会更懂

从第一个姓名移到最后一个，再向上返回，观察照片从哪一侧进入；缩窄窗口比较资料是否仍完整。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

它是人物展示方式，与头像堆叠和社交卡片可以比较取舍；核心资料应完整，不依赖额外悬停效果叠加。
