---
locale: zh
status: published
title: 有层级的基础按钮
summary: 用同一套尺寸、形状和状态表达主操作、次操作与不可操作，让用户容易判断下一步。
description: 用同一套尺寸、形状和状态表达主操作、次操作与不可操作，让用户容易判断下一步。
previewText:
  eyebrow: 按钮
  display: Button
  note: Great UI · 交互学习
learning:
  category: 按钮
  classification:
    type: 组件
    purpose:
      - 触发操作
    behavior:
      - 操作层级
      - 加载反馈
  placementHint: 表单提交、确认选择、工具栏等需要清楚操作层级的位置。
  changesHint: 接入真实异步操作，运行时设置 isLoading；完成或失败后恢复，附近显示结果。明确 type，图标按钮加 aria-label。
  preserve:
    - 对照五种普通样式与 Loading 状态；Loading 必须不可点击，普通按钮要接到明确的操作。
    - 主要与次要操作有稳定层级，禁用状态与实际可操作性一致。
  checks:
    - 对照五种普通样式与 Loading 状态；Loading 必须不可点击，普通按钮要接到明确的操作。
    - 按 Enter 执行一次，运行时连点不会重复提交；失败后能看到原因并重新执行。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 同一个原生 button 根据 variant 和 size 切换外观。isLoading 为真时出现旋转图标、隐藏左右装饰图标，并同时禁用点击。 保留项目自己的内容与样式，先核对固定源码中的variant、size / className、isLoading / disabled / onClick。
      judge: 对照五种普通样式与 Loading 状态；Loading 必须不可点击，普通按钮要接到明确的操作。
    - id: improve
      title: 把等待与失败讲清楚
      action: 接入真实异步操作，运行时设置 isLoading；完成或失败后恢复，附近显示结果。明确 type，图标按钮加 aria-label。
      judge: 按 Enter 执行一次，运行时连点不会重复提交；失败后能看到原因并重新执行。
    - id: quiet
      title: 减少动效也能完成
      action: 保留有层级的基础按钮的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；示例中的六个按钮没有业务处理；默认也没有固定 type，放进表单时应明确 submit 或 button。纯图标按钮需补可读名称，加载状态需有文字提示。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 操作重要性
      - variant
      - 支持 primary、secondary、outline、ghost、destructive；不能只因好看就把多个操作都设为主按钮。
    - - 触发范围
      - size / className
      - 默认 md 高40px；icon 是40px正方形，实际触摸目标需结合周围间距检查。
    - - 执行状态
      - isLoading / disabled / onClick
      - 运行状态由业务提供，isLoading 与 disabled 任一为真都会禁用。
  glossary:
    button-mechanism:
      term: 'action-hierarchy'
      context: 视觉层级由颜色、边框和背景区分，交互能力仍来自原生按钮；loading 只是由外部传入的状态，不会自动执行异步任务。
      parameter: variant：支持 primary、secondary、outline、ghost、destructive；不能只因好看就把多个操作都设为主按钮。；size / className：默认 md 高40px；icon 是40px正方形，实际触摸目标需结合周围间距检查。；isLoading / disabled / onClick：运行状态由业务提供，isLoading 与 disabled 任一为真都会禁用。
      judgment: 示例中的六个按钮没有业务处理；默认也没有固定 type，放进表单时应明确 submit 或 button。纯图标按钮需补可读名称，加载状态需有文字提示。
---

## 拆解设计

### 它在做什么

同一个原生 button 根据 variant 和 size 切换外观。isLoading 为真时出现旋转图标、隐藏左右装饰图标，并同时禁用点击。

### 效果是怎么形成的

[[button-mechanism|操作层级]]：视觉层级由颜色、边框和背景区分，交互能力仍来自原生按钮；loading 只是由外部传入的状态，不会自动执行异步任务。

### 接进项目时要注意什么

示例中的六个按钮没有业务处理；默认也没有固定 type，放进表单时应明确 submit 或 button。纯图标按钮需补可读名称，加载状态需有文字提示。

### 适合用在哪里

表单提交、确认选择、工具栏等需要清楚操作层级的位置。

### 什么时候不用

把按钮样式当成业务能力；在一个区块中同时强调多个主操作。

### 试一次，就会更懂

用键盘遍历原作，留意 Loading 是否进入焦点顺序；比较 Primary 与 Ghost 对注意力的影响。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

承担操作入口，业务执行、校验和结果由其他环节负责，不能因为有按钮就认为任务完整。
