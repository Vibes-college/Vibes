---
locale: zh
status: published
title: 轻量立体按钮
summary: 用细边框和内阴影形成轻微厚度，五种视觉层级共用同一组尺寸。
description: 用细边框和内阴影形成轻微厚度，五种视觉层级共用同一组尺寸。
previewText:
  eyebrow: 按钮、链接与选择输入
  display: Minimal Buttons
  note: Great UI · 交互学习
learning:
  category: 按钮、链接与选择输入
  classification:
    type: 组件
    purpose:
      - 触发操作
    behavior:
      - 操作层级
      - 立体反馈
  placementHint: 需要清楚主次层级的确认、提交或导航入口。
  changesHint: 将导航与提交分别实现，传递必要属性并处理禁用；明确button type、可读名称和focus-visible，接入真实运行状态，加载文字按页面语言提供。
  preserve:
    - 核对各样式与加载禁用，接入后确认链接和按钮分别执行对应的真实行为。
    - 视觉禁用必须对应实际不可执行，主次操作层级一致。
  checks:
    - 核对各样式与加载禁用，接入后确认链接和按钮分别执行对应的真实行为。
    - href加disabled不会继续导航，键盘有可见焦点；加载不重复提交，失败能恢复，中文界面状态文字一致。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 加载时保留children并加入转圈图标。 提供href且不在加载时改为Next Link，否则是原生button；预览只展示样式。 保留项目自己的内容与样式，先核对固定源码中的variant、size、href / isLoading / disabled。
      judge: 核对各样式与加载禁用，接入后确认链接和按钮分别执行对应的真实行为。
    - id: improve
      title: 修复链接和等待语义
      action: 将导航与提交分别实现，传递必要属性并处理禁用；明确button type、可读名称和focus-visible，接入真实运行状态，加载文字按页面语言提供。
      judge: href加disabled不会继续导航，键盘有可见焦点；加载不重复提交，失败能恢复，中文界面状态文字一致。
    - id: quiet
      title: 减少动效也能完成
      action: 保留轻量立体按钮的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；href分支忽略disabled与其余事件、可访问属性；加载还会把链接变成按钮。必须明确动作语义、恢复焦点边框，并替换next/link依赖。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 视觉层级
      - variant
      - primary、secondary、outline、ghost、destructive。
    - - 触发尺寸
      - size
      - default44px、xs24px、sm28px、lg48px；较小尺寸需结合触摸间距。
    - - 动作语义
      - href / isLoading / disabled
      - 明确采用链接或按钮，修复链接分支丢失属性和禁用处理。
  glossary:
    minimal-buttons-mechanism:
      term: 'state-consistency'
      context: variant与size组合CSS类，isLoading与disabled控制button分支；链接分支只收到href和外观类。
      parameter: variant：primary、secondary、outline、ghost、destructive。；size：default44px、xs24px、sm28px、lg48px；较小尺寸需结合触摸间距。；href / isLoading / disabled：明确采用链接或按钮，修复链接分支丢失属性和禁用处理。
      judgment: href分支忽略disabled与其余事件、可访问属性；加载还会把链接变成按钮。必须明确动作语义、恢复焦点边框，并替换next/link依赖。
---

## 拆解设计

### 它在做什么

加载时保留children并加入转圈图标。 提供href且不在加载时改为Next Link，否则是原生button；预览只展示样式。

### 效果是怎么形成的

[[minimal-buttons-mechanism|状态一致性]]：variant与size组合CSS类，isLoading与disabled控制button分支；链接分支只收到href和外观类。

### 接进项目时要注意什么

href分支忽略disabled与其余事件、可访问属性；加载还会把链接变成按钮。必须明确动作语义、恢复焦点边框，并替换next/link依赖。

### 适合用在哪里

需要清楚主次层级的确认、提交或导航入口。

### 什么时候不用

把默认样式当作业务功能，或在需要禁用时仍渲染可导航链接。

### 试一次，就会更懂

比较普通按钮与加载状态，再查href分支是否真的使用disabled。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

可作为工具路径的执行入口；不负责输入校验或结果反馈，必须与同一业务状态连接。
