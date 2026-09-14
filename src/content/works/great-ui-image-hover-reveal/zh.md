---
locale: zh
status: published
title: 按方向揭开的图片
summary: 从灰度底图中揭开彩色图或另一张图，鼠标进入方向决定揭示从哪边开始。
description: 从灰度底图中揭开彩色图或另一张图，鼠标进入方向决定揭示从哪边开始。
previewText:
  eyebrow: 视觉交互
  display: Image Hover Reveal
  note: Great UI · 交互学习
learning:
  category: 视觉交互
  classification:
    type: 组件
    purpose:
      - 作品展示
    behavior:
      - 方向揭示
      - 条带跟随
  placementHint: 艺术展示、头像变化、同构图视觉对照。
  changesHint: 触摸提供切换按钮，键盘可查看两张图；装饰副本隐藏于读屏，补图像失败说明，静态模式直接显示可读结果。
  preserve:
    - 按原作的悬停或点击方式观察方向揭示，核对内容和结束状态；记录未覆盖的变体。
    - 主要内容与操作结果不依赖装饰动画才能取得。
  checks:
    - 按原作的悬停或点击方式观察方向揭示，核对内容和结束状态；记录未覆盖的变体。
    - 从不同方向进入均无空边，触摸能切换，缺图不会让另一图无法读，窄屏条带不过宽。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: directional从进入侧展开整张叠图并从离开侧收回；slice只显示随鼠标移动的120px宽或高条带。 保留项目自己的内容与样式，先核对固定源码中的src / overlaySrc / alt、variant、thickness / springConfig。
      judge: 按原作的悬停或点击方式观察方向揭示，核对内容和结束状态；记录未覆盖的变体。
    - id: improve
      title: 让图片内容完整可达
      action: 触摸提供切换按钮，键盘可查看两张图；装饰副本隐藏于读屏，补图像失败说明，静态模式直接显示可读结果。
      judge: 从不同方向进入均无空边，触摸能切换，缺图不会让另一图无法读，窄屏条带不过宽。
    - id: quiet
      title: 减少动效也能完成
      action: 保留按方向揭开的图片的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；仅有鼠标事件，触摸和键盘没有等价入口；上下两图都有alt会重复描述，固定120px条宽也需适配尺寸。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 底图与叠图
      - src / overlaySrc / alt
      - 未提供叠图时使用同图彩色版；两图构图需对齐。
    - - 揭示方式
      - variant
      - directional整图揭开；slice的轴由进入方向固定。
    - - 跟随宽度
      - thickness / springConfig
      - 条带在源码固定120px，默认刚度400、阻尼30。
  glossary:
    image-hover-reveal-mechanism:
      term: 'clipping-window'
      context: 叠图用clip-path inset控制可见部分，鼠标相对中心的角度决定轴向；slice用弹簧让裁切跟随。
      parameter: src / overlaySrc / alt：未提供叠图时使用同图彩色版；两图构图需对齐。；variant：directional整图揭开；slice的轴由进入方向固定。；thickness / springConfig：条带在源码固定120px，默认刚度400、阻尼30。
      judgment: 仅有鼠标事件，触摸和键盘没有等价入口；上下两图都有alt会重复描述，固定120px条宽也需适配尺寸。
---

## 拆解设计

### 它在做什么

directional从进入侧展开整张叠图并从离开侧收回；slice只显示随鼠标移动的120px宽或高条带。

### 效果是怎么形成的

[[image-hover-reveal-mechanism|裁切窗口]]：叠图用clip-path inset控制可见部分，鼠标相对中心的角度决定轴向；slice用弹簧让裁切跟随。

### 接进项目时要注意什么

仅有鼠标事件，触摸和键盘没有等价入口；上下两图都有alt会重复描述，固定120px条宽也需适配尺寸。

### 适合用在哪里

艺术展示、头像变化、同构图视觉对照。

### 什么时候不用

需要精确前后差异比较的唯一入口，或关键信息只出现在悬停层。

### 试一次，就会更懂

从左边与上边进入slice，观察条带轴向是否随第一次进入改变。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

承担内容展示这一环节；业务动作、数据和异常仍由完整路径负责。
