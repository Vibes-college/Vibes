---
locale: zh
status: published
title: 多语言引语切换
summary: 在同一位置切换不同语言的短句，用轻微模糊和位移连接文本变化，同时保留作者信息。
description: 在同一位置切换不同语言的短句，用轻微模糊和位移连接文本变化，同时保留作者信息。
previewText:
  eyebrow: 文字效果
  display: Multilingual Quote
  note: Great UI · 交互学习
learning:
  category: 文字效果
  classification:
    type: 组件
    purpose:
      - 内容介绍
    behavior:
      - 语言切换
      - 文本过渡
  placementHint: 有已核对译文和出处的短引语、产品短句展示。
  changesHint: 给语言按钮加 aria-pressed 或正确的标签页语义，正文设置 lang；减少动态效果时直接替换，长短译文不互相遮挡。
  preserve:
    - 切换任意语言后，正文与所选语种一致，作者信息与来源链接仍保持正确。
    - 译文含义和引语归属由维护者核对，语言切换不能截断或叠住文字。
  checks:
    - 切换任意语言后，正文与所选语种一致，作者信息与来源链接仍保持正确。
    - 键盘切换各语言，读屏能知道当前语种；最长文本完整显示，空列表也有明确处理。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 点击语言按钮更新 activeQuoteId，新语言文本进入，旧文本退出；作者署名保持在下方，只有多种语言时才出现选择器。 保留项目自己的内容与样式，先核对固定源码中的quotes / defaultLanguage、authorName / authorLink、quoteClassName / motion.p transition。
      judge: 切换任意语言后，正文与所选语种一致，作者信息与来源链接仍保持正确。
    - id: improve
      title: 切换状态更清楚
      action: 给语言按钮加 aria-pressed 或正确的标签页语义，正文设置 lang；减少动态效果时直接替换，长短译文不互相遮挡。
      judge: 键盘切换各语言，读屏能知道当前语种；最长文本完整显示，空列表也有明确处理。
    - id: quiet
      title: 减少动效也能完成
      action: 保留多语言引语切换的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；组件只切换预先提供的译文，不会翻译或验证引语来源。语言按钮缺少选中语义，正文也没有自动设置 lang，需要明确语言和准确来源。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 语种和文本
      - quotes / defaultLanguage
      - 每项提供id、label、text，默认语言应存在于列表。
    - - 归属与来源
      - authorName / authorLink
      - 只显示传入值，引用前需独立核实作者与出处。
    - - 排版与动效
      - quoteClassName / motion.p transition
      - 默认0.4秒、8px模糊及5px位移，长译文需核对容器高度。
  glossary:
    multilingual-quote-mechanism:
      term: 'content-state-change'
      context: 每个语种有稳定ID，AnimatePresence 用这个ID区分新旧文本，通过同一网格区域叠放完成过渡。
      parameter: quotes / defaultLanguage：每项提供id、label、text，默认语言应存在于列表。；authorName / authorLink：只显示传入值，引用前需独立核实作者与出处。；quoteClassName / motion.p transition：默认0.4秒、8px模糊及5px位移，长译文需核对容器高度。
      judgment: 组件只切换预先提供的译文，不会翻译或验证引语来源。语言按钮缺少选中语义，正文也没有自动设置 lang，需要明确语言和准确来源。
---

## 拆解设计

### 它在做什么

点击语言按钮更新 activeQuoteId，新语言文本进入，旧文本退出；作者署名保持在下方，只有多种语言时才出现选择器。

### 效果是怎么形成的

[[multilingual-quote-mechanism|内容状态切换]]：每个语种有稳定ID，AnimatePresence 用这个ID区分新旧文本，通过同一网格区域叠放完成过渡。

### 接进项目时要注意什么

组件只切换预先提供的译文，不会翻译或验证引语来源。语言按钮缺少选中语义，正文也没有自动设置 lang，需要明确语言和准确来源。

### 适合用在哪里

有已核对译文和出处的短引语、产品短句展示。

### 什么时候不用

把预设语言切换当作自动翻译，或未经核对就归因给知名人物。

### 试一次，就会更懂

切换长短不同的语言，观察作者行是否跳动；再关闭模糊比较阅读清晰度。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

属于多语言内容展示，可替代普通静态引语；页面语言策略应与站点保持一致。
