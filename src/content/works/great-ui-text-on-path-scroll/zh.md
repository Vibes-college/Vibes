---
locale: zh
status: published
title: 沿曲线滚动的文字
summary: 让文字贴着一条曲线移动，用滚动推动文字经过画面，形成一段有空间感的排版。
description: 让文字贴着一条曲线移动，用滚动推动文字经过画面，形成一段有空间感的排版。
previewText:
  eyebrow: 滚动与连续叙事
  display: Text On Path Scroll
  note: Great UI · 交互学习
learning:
  category: 滚动与连续叙事
  classification:
    type: 组件
    purpose:
      - 内容介绍
    behavior:
      - 路径排版
      - 滚动位移
  placementHint: 品牌标语、活动视觉、可作为装饰补充的短句。
  changesHint: 缩短滚动区域和文字长度，补普通文本版本；为每个实例分配唯一路径ID，在减少动态效果时直接呈现静态排版。
  preserve:
    - 在原作滚动，文字沿同一曲线移动；反向滚动时轨迹反向，静止后不继续漂移。
    - 路径ID与 textPath 引用一致，文字内容完整，滚动方向与阅读意图协调。
  checks:
    - 在原作滚动，文字沿同一曲线移动；反向滚动时轨迹反向，静止后不继续漂移。
    - 两实例同时出现不串轨迹；手机能读到文本，不需要滚动很多屏才进入下一段。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 文字通过 SVG textPath 绑定到曲线，页面滚动进度经弹簧平滑后改变 startOffset，使同一段文字沿路径移动。 保留项目自己的内容与样式，先核对固定源码中的path / scroll-path、text / textProps / scrollOffsets、springOptions / className。
      judge: 在原作滚动，文字沿同一曲线移动；反向滚动时轨迹反向，静止后不继续漂移。
    - id: improve
      title: 更短的装饰段落
      action: 缩短滚动区域和文字长度，补普通文本版本；为每个实例分配唯一路径ID，在减少动态效果时直接呈现静态排版。
      judge: 两实例同时出现不串轨迹；手机能读到文本，不需要滚动很多屏才进入下一段。
    - id: quiet
      title: 减少动效也能完成
      action: 保留沿曲线滚动的文字的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；默认区域高800dvh，阅读成本很大；固定 id 为 scroll-path，多实例会冲突。路径文字不适合承担唯一正文，需要静态可读替代。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 曲线形状
      - path / scroll-path
      - 传入带指定ID的SVG路径，多实例时需改成唯一ID并同步引用。
    - - 文字与距离
      - text / textProps / scrollOffsets
      - 文字字号由 textProps 调整；示例将起止位置设为100%到-100%。
    - - 平滑与滚动长度
      - springOptions / className
      - 默认弹簧刚度50、阻尼20；外层默认800dvh，可按内容缩短。
  glossary:
    text-on-path-scroll-mechanism:
      term: 'text-on-a-path'
      context: 曲线形状决定文字轨迹，startOffset 决定文字在路径上的起点；外层较长的滚动区域与内部 sticky 画面共同形成持续展示。
      parameter: path / scroll-path：传入带指定ID的SVG路径，多实例时需改成唯一ID并同步引用。；text / textProps / scrollOffsets：文字字号由 textProps 调整；示例将起止位置设为100%到-100%。；springOptions / className：默认弹簧刚度50、阻尼20；外层默认800dvh，可按内容缩短。
      judgment: 默认区域高800dvh，阅读成本很大；固定 id 为 scroll-path，多实例会冲突。路径文字不适合承担唯一正文，需要静态可读替代。
---

## 拆解设计

### 它在做什么

文字通过 SVG textPath 绑定到曲线，页面滚动进度经弹簧平滑后改变 startOffset，使同一段文字沿路径移动。

### 效果是怎么形成的

[[text-on-path-scroll-mechanism|沿路径文字]]：曲线形状决定文字轨迹，startOffset 决定文字在路径上的起点；外层较长的滚动区域与内部 sticky 画面共同形成持续展示。

### 接进项目时要注意什么

默认区域高800dvh，阅读成本很大；固定 id 为 scroll-path，多实例会冲突。路径文字不适合承担唯一正文，需要静态可读替代。

### 适合用在哪里

品牌标语、活动视觉、可作为装饰补充的短句。

### 什么时候不用

唯一的操作说明、长段正文、高频工具界面。

### 试一次，就会更懂

先只改变曲线，再只改变 scrollOffsets，区分轨迹形状和移动距离的影响。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

属于排版原理示例，不提供导航或业务动作；若与其他滚动效果共用长区域，需要重新安排阅读长度。
