---
locale: zh
status: published
title: 字符轨迹等待动画
summary: 一块色条在等宽字符间来回移动，尾部留下逐渐变淡的字符，营造终端风格的等待感。
description: 一块色条在等宽字符间来回移动，尾部留下逐渐变淡的字符，营造终端风格的等待感。
previewText:
  eyebrow: 视觉交互
  display: Terminal Loader
  note: Great UI · 交互学习
learning:
  category: 视觉交互
  classification:
    type: 组件
    purpose:
      - 状态反馈
    behavior:
      - 循环等待
      - 字符轨迹
  placementHint: 终端式工具中持续时间未知的短等待。
  changesHint: 由真实任务挂载和停止动画，旁边显示正在做什么；离开视口和减少动态效果时静态显示状态，成功失败由真实结果决定。
  preserve:
    - 按原作的展示或切换方式观察循环等待，核对内容和结束状态；记录未覆盖的变体。
    - 主要内容与操作结果不依赖装饰动画才能取得。
  checks:
    - 按原作的展示或切换方式观察循环等待，核对内容和结束状态；记录未覆盖的变体。
    - 任务结束后不再循环，失败有说明；减少动态效果下仍知道当前状态，320px宽不溢出。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 默认每50毫秒推进一列，到边缘折返；预览是5行40列，各行显示相同轨迹。 保留项目自己的内容与样式，先核对固定源码中的rows / cols / blockWidth、speed、charEmpty / charTrail / color / bgColor。
      judge: 按原作的展示或切换方式观察循环等待，核对内容和结束状态；记录未覆盖的变体。
    - id: improve
      title: 等待有原因也能结束
      action: 由真实任务挂载和停止动画，旁边显示正在做什么；离开视口和减少动态效果时静态显示状态，成功失败由真实结果决定。
      judge: 任务结束后不再循环，失败有说明；减少动态效果下仍知道当前状态，320px宽不溢出。
    - id: quiet
      title: 减少动效也能完成
      action: 保留字符轨迹等待动画的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；没有百分比或完成信号，只能表示不确定等待。cols和blockWidth缺边界校验，固定字符宽度也会在窄屏溢出。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 字符范围
      - rows / cols / blockWidth
      - 默认5×60、色块3列；保证cols大于色块并限制总字符。
    - - 运行速度
      - speed
      - 每步间隔，单位毫秒；越小推进越快。
    - - 轨迹样式
      - charEmpty / charTrail / color / bgColor
      - 等宽字符才能保持对齐，字符与色块需足够对比。
  glossary:
    terminal-loader-mechanism:
      term: 'indeterminate-progress'
      context: 计时器改变position与direction，字符数组形成尾迹，色块用绝对定位覆盖当前列。
      parameter: rows / cols / blockWidth：默认5×60、色块3列；保证cols大于色块并限制总字符。；speed：每步间隔，单位毫秒；越小推进越快。；charEmpty / charTrail / color / bgColor：等宽字符才能保持对齐，字符与色块需足够对比。
      judgment: 没有百分比或完成信号，只能表示不确定等待。cols和blockWidth缺边界校验，固定字符宽度也会在窄屏溢出。
---

## 拆解设计

### 它在做什么

默认每50毫秒推进一列，到边缘折返；预览是5行40列，各行显示相同轨迹。

### 效果是怎么形成的

[[terminal-loader-mechanism|不确定进度]]：计时器改变position与direction，字符数组形成尾迹，色块用绝对定位覆盖当前列。

### 接进项目时要注意什么

没有百分比或完成信号，只能表示不确定等待。cols和blockWidth缺边界校验，固定字符宽度也会在窄屏溢出。

### 适合用在哪里

终端式工具中持续时间未知的短等待。

### 什么时候不用

假装显示真实进度，或把无限循环当成任务完成结果。

### 试一次，就会更懂

观察来回折返，确认它没有朝完成比例推进；尝试把速度翻倍理解毫秒间隔。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

承担等待反馈这一环节；业务动作、数据和异常仍由完整路径负责。
