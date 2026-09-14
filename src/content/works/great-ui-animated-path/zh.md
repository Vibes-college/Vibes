---
locale: zh
status: published
title: 路径描画标志
summary: 让标志的线条依次出现，再逐渐填色，把静态图形变成一段可读的形成过程。
description: 让标志的线条依次出现，再逐渐填色，把静态图形变成一段可读的形成过程。
previewText:
  eyebrow: 视觉交互
  display: Animated Path
  note: Great UI · 交互学习
learning:
  category: 视觉交互
  classification:
    type: 组件
    purpose:
      - 作品展示
    behavior:
      - 路径描画
      - 错峰填色
  placementHint: 品牌标志、项目封面中的简短视觉介绍。
  changesHint: 保留少量主要轮廓先描画，次要细节直接显示或缩短 pathDelay，不要让最后几条线等待很久。
  preserve:
    - 刷新原作，观察线条从局部到完整，再核对填色后的形状没有缺失。
    - 路径顺序决定描画顺序，填色与描边的时间关系需要一起检查。
  checks:
    - 刷新原作，观察线条从局部到完整，再核对填色后的形状没有缺失。
    - 换入实际标志，记录首条与末条完成的时间，并确认小尺寸时仍可辨认。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 页面挂载后，各条 SVG 路径从未画出到完整描边，再按独立时序填色。原作眼睛示例有很多条路径，越靠后的线开始得越晚。 保留项目自己的内容与样式，先核对固定源码中的rawSvg / paths / viewBox、pathLengthDuration / pathDelay、fillDuration / fillDelay。
      judge: 刷新原作，观察线条从局部到完整，再核对填色后的形状没有缺失。
    - id: improve
      title: 复杂标志更快读懂
      action: 保留少量主要轮廓先描画，次要细节直接显示或缩短 pathDelay，不要让最后几条线等待很久。
      judge: 换入实际标志，记录首条与末条完成的时间，并确认小尺寸时仍可辨认。
    - id: quiet
      title: 减少动效也能完成
      action: 保留路径描画标志的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；rawSvg 只解析 g、path、rect 和 circle 的部分属性，不是完整 SVG 渲染器；带渐变、蒙版、单引号属性或其他形状的素材要先核对转换结果。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 换成自己的标志
      - rawSvg / paths / viewBox
      - 提供可支持的路径与正确画布范围；rawSvg 优先于 paths。
    - - 线条节奏
      - pathLengthDuration / pathDelay
      - 默认描边1.5秒，路径之间隔0.1秒；线条多时需缩短间隔。
    - - 填色时机
      - fillDuration / fillDelay
      - 默认填色0.8秒，基础延迟1.2秒，另加每条路径一半的错峰间隔。
  glossary:
    animated-path-mechanism:
      title: 路径描画
      english: Path drawing
      kind: 行为与原理
      definition: 通过改变可见的描边长度，让一条已有路径看起来正在被画出。
      context: 每条路径用 pathLength 表示已经描画的比例，用 fillOpacity 表示填色程度；两组动画各有时长和延迟，因此线条与填色可以重叠进行。
      parameter: rawSvg / paths / viewBox：提供可支持的路径与正确画布范围；rawSvg 优先于 paths。；pathLengthDuration / pathDelay：默认描边1.5秒，路径之间隔0.1秒；线条多时需缩短间隔。；fillDuration / fillDelay：默认填色0.8秒，基础延迟1.2秒，另加每条路径一半的错峰间隔。
      judgment: rawSvg 只解析 g、path、rect 和 circle 的部分属性，不是完整 SVG 渲染器；带渐变、蒙版、单引号属性或其他形状的素材要先核对转换结果。
---

## 拆解设计

### 它在做什么

页面挂载后，各条 SVG 路径从未画出到完整描边，再按独立时序填色。原作眼睛示例有很多条路径，越靠后的线开始得越晚。

### 效果是怎么形成的

[[animated-path-mechanism|路径描画]]：每条路径用 pathLength 表示已经描画的比例，用 fillOpacity 表示填色程度；两组动画各有时长和延迟，因此线条与填色可以重叠进行。

### 接进项目时要注意什么

rawSvg 只解析 g、path、rect 和 circle 的部分属性，不是完整 SVG 渲染器；带渐变、蒙版、单引号属性或其他形状的素材要先核对转换结果。

### 适合用在哪里

品牌标志、项目封面中的简短视觉介绍。

### 什么时候不用

必须立即读取的图标、复杂插画的无损导入、每次滚动都反复播放的标志。

### 试一次，就会更懂

刷新原作，注意轮廓描画和白色填充是否同时结束；再把 pathDelay 设为0比较节奏。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

承担作品展示中的短暂视觉引导；它不负责页面导航，也不提供真实加载进度。
