---
locale: zh
status: published
title: 文字分行飞入
summary: 一段文字按行从两侧进入，逐渐收拢字距并变清晰，把阅读展开成有方向的节奏。
description: 一段文字按行从两侧进入，逐渐收拢字距并变清晰，把阅读展开成有方向的节奏。
previewText:
  eyebrow: 文字效果
  display: Split Line Fly In
  note: Great UI · 交互学习
learning:
  category: 文字效果
  classification:
    type: 组件
    purpose:
      - 内容介绍
    behavior:
      - 分行飞入
      - 滚动揭示
  placementHint: 短篇宣言、少量品牌文字、章节引言。
  changesHint: 使用适合实际语言的分词和测量，等待字体就绪并监听容器尺寸；在窄屏缩短位移，减少动态效果时直接展示完整段落。
  preserve:
    - 在滚动容器中来回滚动，所有行能完整进入；换到窄屏后行长与页面宽度匹配。
    - 文字最终回到正确顺序与正常字距，不依赖横向溢出才能读完。
  checks:
    - 在滚动容器中来回滚动，所有行能完整进入；换到窄屏后行长与页面宽度匹配。
    - 中文、长单词、字体载入和容器变宽后都不缺字、不裁行，静态模式保留正常阅读顺序。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 组件测量单词换行位置，按行分别映射滚动进度；默认奇偶行从相反方向进入，也可以直接传入指定的行。 保留项目自己的内容与样式，先核对固定源码中的text / lines / calculateLines、direction / flyInDistance / blurStart、staggerFactor / animationDuration / wordSpacingEnd。
      judge: 在滚动容器中来回滚动，所有行能完整进入；换到窄屏后行长与页面宽度匹配。
    - id: improve
      title: 中文与窄屏更自然
      action: 使用适合实际语言的分词和测量，等待字体就绪并监听容器尺寸；在窄屏缩短位移，减少动态效果时直接展示完整段落。
      judge: 中文、长单词、字体载入和容器变宽后都不缺字、不裁行，静态模式保留正常阅读顺序。
    - id: quiet
      title: 减少动效也能完成
      action: 保留文字分行飞入的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；animationDuration 表示滚动进度区间，不是秒数。自动分行以空格拆词，中文、字体迟加载及同词数换文案需要重新分词和测量；每行禁止换行，过长行可能被裁掉。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 文字如何分组
      - text / lines / calculateLines
      - 自动分组按空格拆词并读取 offsetTop，或用 lines 明确每行。
    - - 进入幅度
      - direction / flyInDistance / blurStart
      - 默认交替方向、70vw距离、12px模糊，移动端应缩小。
    - - 阅读节奏
      - staggerFactor / animationDuration / wordSpacingEnd
      - 默认0.6错峰因子、0.4进度跨度，结束字距0.25em。
  glossary:
    split-line-fly-in-mechanism:
      term: 'line-measurement'
      context: 同一行共享横向位移、透明度、模糊和 wordSpacing。每行的起点由行号与 staggerFactor 决定，因此行与行依次到位。
      parameter: text / lines / calculateLines：自动分组按空格拆词并读取 offsetTop，或用 lines 明确每行。；direction / flyInDistance / blurStart：默认交替方向、70vw距离、12px模糊，移动端应缩小。；staggerFactor / animationDuration / wordSpacingEnd：默认0.6错峰因子、0.4进度跨度，结束字距0.25em。
      judgment: animationDuration 表示滚动进度区间，不是秒数。自动分行以空格拆词，中文、字体迟加载及同词数换文案需要重新分词和测量；每行禁止换行，过长行可能被裁掉。
---

## 拆解设计

### 它在做什么

组件测量单词换行位置，按行分别映射滚动进度；默认奇偶行从相反方向进入，也可以直接传入指定的行。

### 效果是怎么形成的

[[split-line-fly-in-mechanism|分行测量]]：同一行共享横向位移、透明度、模糊和 wordSpacing。每行的起点由行号与 staggerFactor 决定，因此行与行依次到位。

### 接进项目时要注意什么

animationDuration 表示滚动进度区间，不是秒数。自动分行以空格拆词，中文、字体迟加载及同词数换文案需要重新分词和测量；每行禁止换行，过长行可能被裁掉。

### 适合用在哪里

短篇宣言、少量品牌文字、章节引言。

### 什么时候不用

正文长文、表格、需要复制或快速检索的关键说明。

### 试一次，就会更懂

缓慢滚动，观察每一行的位移和字距是否同时完成；再改为全部从同侧进入比较。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

与其他滚动文字属于替代关系，同一段落只选择一种主要揭示规则。
