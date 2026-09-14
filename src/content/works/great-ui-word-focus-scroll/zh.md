---
locale: zh
status: published
title: 词语逐个聚焦
summary: 词语随滚动从较小、模糊和透明变为正常大小，用连续的聚焦过程强调阅读顺序。
description: 词语随滚动从较小、模糊和透明变为正常大小，用连续的聚焦过程强调阅读顺序。
previewText:
  eyebrow: 文字效果
  display: Word Focus Scroll
  note: Great UI · 交互学习
learning:
  category: 文字效果
  classification:
    type: 组件
    purpose:
      - 内容介绍
    behavior:
      - 逐词聚焦
      - 滚动缩放
  placementHint: 少量强调语、产品理念、章节开头。
  changesHint: 保留可读底稿，用较小缩放差和较高初始透明度表达强调；中文按完整字素或短语分组，减少动态效果时直接显示。
  preserve:
    - 逐步滚动，词语按文本顺序变清晰，最后整段保持可读；倒滚时能看到对应回退。
    - 词序与正常排版一致，缩放不能挤压邻词或造成裁切。
  checks:
    - 逐步滚动，词语按文本顺序变清晰，最后整段保持可读；倒滚时能看到对应回退。
    - 每个词在开始和结束都能识别，中文不溢出，快速滚动不出现持续空白。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 文字先按空格拆词，每个词在自己的短滚动区间内变清晰并放大；已经完成的词保留清晰状态。 保留项目自己的内容与样式，先核对固定源码中的minScale / maxBlur / minOpacity、staggerFactor / wordDuration、text / scrollContainerRef / offset。
      judge: 逐步滚动，词语按文本顺序变清晰，最后整段保持可读；倒滚时能看到对应回退。
    - id: improve
      title: 把聚焦做得更轻
      action: 保留可读底稿，用较小缩放差和较高初始透明度表达强调；中文按完整字素或短语分组，减少动态效果时直接显示。
      judge: 每个词在开始和结束都能识别，中文不溢出，快速滚动不出现持续空白。
    - id: quiet
      title: 减少动效也能完成
      action: 保留词语逐个聚焦的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；默认 minOpacity 为0，不应直接用于必须立即可读的正文；中文会被当作一个长词，wordDuration 也不是播放秒数。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 聚焦强弱
      - minScale / maxBlur / minOpacity
      - 默认0.85、6px和0；提高初始透明度可改善可读性。
    - - 逐词推进
      - staggerFactor / wordDuration
      - 默认0.8和0.1，控制各词开始位置与完成所需进度。
    - - 阅读环境
      - text / scrollContainerRef / offset
      - 默认 start 90% 到 end 60%；换容器或语言时重新核对。
  glossary:
    word-focus-scroll-mechanism:
      title: 聚焦区间
      english: Focus interval
      kind: 行为与原理
      definition: 给每个词分配一小段滚动范围，在这段范围内完成强调变化。
      context: 同一进度同时控制 scale、opacity 和 blur。它没有把已读词重新模糊，因此更接近依次揭示，而不是只保留一个焦点词。
      parameter: minScale / maxBlur / minOpacity：默认0.85、6px和0；提高初始透明度可改善可读性。；staggerFactor / wordDuration：默认0.8和0.1，控制各词开始位置与完成所需进度。；text / scrollContainerRef / offset：默认 start 90% 到 end 60%；换容器或语言时重新核对。
      judgment: 默认 minOpacity 为0，不应直接用于必须立即可读的正文；中文会被当作一个长词，wordDuration 也不是播放秒数。
---

## 拆解设计

### 它在做什么

文字先按空格拆词，每个词在自己的短滚动区间内变清晰并放大；已经完成的词保留清晰状态。

### 效果是怎么形成的

[[word-focus-scroll-mechanism|聚焦区间]]：同一进度同时控制 scale、opacity 和 blur。它没有把已读词重新模糊，因此更接近依次揭示，而不是只保留一个焦点词。

### 接进项目时要注意什么

默认 minOpacity 为0，不应直接用于必须立即可读的正文；中文会被当作一个长词，wordDuration 也不是播放秒数。

### 适合用在哪里

少量强调语、产品理念、章节开头。

### 什么时候不用

依赖逐词节奏才能得到重要信息的正文，或需要稳定尺寸的表格。

### 试一次，就会更懂

把 minScale 改为1，比较只用清晰度和透明度时是否已足够表达节奏。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

与模糊滚动揭示和文字渐显竞争同一个介绍位置，根据可读性选择其中一个。
