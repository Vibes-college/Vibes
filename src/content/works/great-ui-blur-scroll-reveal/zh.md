---
locale: zh
status: published
title: 滚动文字由模糊到清晰
summary: 把段落拆成词或行，随滚动依次提高可见度、减少模糊，让文字逐段进入阅读状态。
description: 把段落拆成词或行，随滚动依次提高可见度、减少模糊，让文字逐段进入阅读状态。
previewText:
  eyebrow: 文字效果
  display: Blur Scroll Reveal
  note: Great UI · 交互学习
learning:
  category: 文字效果
  classification:
    type: 组件
    purpose:
      - 内容介绍
    behavior:
      - 滚动映射
      - 模糊揭示
  placementHint: 短介绍、章节标题、少量可慢读的文案。
  changesHint: 提高初始可见度，减小或移除模糊；核心内容直接显示，只对短介绍添加渐进强调，系统减少动态效果时使用静态正文。
  preserve:
    - 滚动到结束范围后全文清晰可读，反向滚动时变化按原路径回退。
    - 阅读顺序稳定，任何静态或异常状态都能取得完整文字。
  checks:
    - 滚动到结束范围后全文清晰可读，反向滚动时变化按原路径回退。
    - 滚动前仍能理解基本内容，滚动后每一词清晰；快速滚动和减少动态效果不丢失正文。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 默认按词处理，滚动经过指定范围后，词从透明、模糊和轻微偏移变为清晰。line 模式会先测量排版，再整行处理。 保留项目自己的内容与样式，先核对固定源码中的variant / text、opacity / blur / y / scale、offset / staggerFactor / animationDuration。
      judge: 滚动到结束范围后全文清晰可读，反向滚动时变化按原路径回退。
    - id: improve
      title: 先可读，再强调
      action: 提高初始可见度，减小或移除模糊；核心内容直接显示，只对短介绍添加渐进强调，系统减少动态效果时使用静态正文。
      judge: 滚动前仍能理解基本内容，滚动后每一词清晰；快速滚动和减少动态效果不丢失正文。
    - id: quiet
      title: 减少动效也能完成
      action: 保留滚动文字由模糊到清晰的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；默认初始透明度为0，重要内容可能暂时不可见；分词依赖空格，减少动态效果、中文分词和字体变化需要额外处理。animationDuration 是进度跨度。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 按词还是按行
      - variant / text
      - word 逐词处理，line 依实际 offsetTop 分行；中文需要适配分段。
    - - 变化起止值
      - opacity / blur / y / scale
      - 默认0到1透明度、12px到0模糊、10px到0位移，缩放保持1。
    - - 滚动触发范围
      - offset / staggerFactor / animationDuration
      - 默认 start end 到 end 60%，错峰0.85，单项进度跨度0.12。
  glossary:
    blur-scroll-reveal-mechanism:
      term: 'blur-reveal'
      context: 每个词或行有自己的起止进度，分别映射透明度、模糊、纵向位移和缩放；这些属性可以独立调节。
      parameter: variant / text：word 逐词处理，line 依实际 offsetTop 分行；中文需要适配分段。；opacity / blur / y / scale：默认0到1透明度、12px到0模糊、10px到0位移，缩放保持1。；offset / staggerFactor / animationDuration：默认 start end 到 end 60%，错峰0.85，单项进度跨度0.12。
      judgment: 默认初始透明度为0，重要内容可能暂时不可见；分词依赖空格，减少动态效果、中文分词和字体变化需要额外处理。animationDuration 是进度跨度。
---

## 拆解设计

### 它在做什么

默认按词处理，滚动经过指定范围后，词从透明、模糊和轻微偏移变为清晰。line 模式会先测量排版，再整行处理。

### 效果是怎么形成的

[[blur-scroll-reveal-mechanism|清晰度揭示]]：每个词或行有自己的起止进度，分别映射透明度、模糊、纵向位移和缩放；这些属性可以独立调节。

### 接进项目时要注意什么

默认初始透明度为0，重要内容可能暂时不可见；分词依赖空格，减少动态效果、中文分词和字体变化需要额外处理。animationDuration 是进度跨度。

### 适合用在哪里

短介绍、章节标题、少量可慢读的文案。

### 什么时候不用

使用说明、价格、错误提示等必须立即读清的信息。

### 试一次，就会更懂

比较只改透明度与同时改模糊的版本，判断模糊是否真的帮助理解。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

可替代文字渐显或词语聚焦；不要在同一段文字上同时叠加两套滚动进度。
