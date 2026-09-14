---
locale: zh
status: published
title: 折叠问答
summary: 先露出问题，再按需展开答案。一次只打开一项，让密集信息保持清楚的阅读顺序。
description: 先露出问题，再按需展开答案。一次只打开一项，让密集信息保持清楚的阅读顺序。
previewText:
  eyebrow: 布局与卡片
  display: Accordion
  note: Great UI · 交互学习
learning:
  category: 布局与卡片
  classification:
    type: 组件
    purpose:
      - 信息阅读
    behavior:
      - 展开收起
      - 单项展开
  placementHint: 例如：定价页下方的常见问题
  changesHint: 例如：保留我的字体，把展开时长缩短到 0.2 秒
  preserve:
    - 问题标题始终可见
    - 同一时刻最多展开一项
    - 展开状态与按钮说明一致
  checks:
    - 标题支持键盘操作，aria-expanded 与答案状态一致。
    - 初始第二项展开；点击同项收起，点击其他项只保留新项。
    - 长答案、中文换行和 320px 屏幕不截断内容。
    - 原作点击外部与答案收起的行为需要按目标任务确认；不应误吞答案内链接。
    - 减少动态效果下直接显示结果，关闭区域不能留下可聚焦控件。
  goals:
    - id: faithful
      title: 先复现核心行为
      action: 保留下面列出的核心关系，用项目已有的字体、配色和布局接入。先验证静态内容可用，再加入动效。
      judge: 操作结果正确，视觉顺序能与参考对照，关掉动画仍能完成任务。
    - id: quicker
      title: 更快找到答案
      action: 把问题标题改成用户会问的话；展开时长从 0.2 秒试起。默认展开内容按实际问题优先级决定。
      judge: 让用户找指定答案，看能否从标题直接判断；长答案不被裁切。
    - id: compare
      title: 方便同时比较
      action: 将 activeIndex 改为可保存多个展开项的状态，保留已打开的答案；取消点击答案区域自动收起。
      judge: 两个答案能同时阅读，答案内链接可以点击，展开状态与辅助说明一致。这会有意改变原作的单项规则。
  adjustments:
    - - 展开节奏与间距
      - transition.duration / space-y
      - 是源码常量，需要修改或提为配置；上游没有同名时长与间距属性。
    - - 单项还是多项
      - activeIndex
      - 查一个答案用单项；需要比较时才改多项，同时更新交互说明。
    - - 如何关闭答案
      - outside click / answer click
      - 阅读和复制不应意外收起；保留明确的标题按钮控制。
  glossary:
    disclosure:
      title: 渐进披露
      english: Progressive disclosure
      kind: 交互方法
      definition: 先展示判断所需的线索，再让用户按需打开细节。
      context: 五个问题标题一直可见，答案只在展开时出现。
      parameter: items 中的 title 是入口，description 是补充内容；间距由源码样式控制。
      judgment: 重要限制和必读内容不应藏在默认关闭的答案里。
    single:
      title: 单项展开
      english: Single-open accordion
      kind: 行为
      definition: 一组折叠项中最多保留一个打开项。
      context: activeIndex 记录当前题目，点击同一题设为 null，点击另一题替换编号。
      parameter: 原作 activeIndex 初值为 1；点击答案或组件外部也会收起。
      judgment: 阅读对比任务可能更适合允许多项同时展开，需要按任务重新决定。
    height:
      title: 高度动画
      english: Height transition
      kind: 原语
      definition: 逐步改变内容区域占用的高度，让周围布局随之重新排列。
      context: '答案由 height: 0 变为 auto，opacity 同时从 0 到 1。'
      parameter: 原作 duration = 0.3 秒，ease = easeInOut。
      judgment: 真实文本高度会随语言和屏幕宽度变化，不要写死答案高度。
    easing:
      title: 缓动
      english: Easing
      kind: 原语
      definition: 描述动画过程中速度如何变化。即使总时长相同，匀速、先慢后快、先快后慢的感觉也不同。
      context: 答案展开与收起使用 easeInOut，在开始和结束时减速。
      parameter: 'transition = { duration: 0.3, ease: "easeInOut" }。'
      judgment: 阅读组件应迅速响应；时长太长会阻碍连续查阅。
    reduced:
      title: 减少动态效果
      english: Reduced motion
      kind: 使用规范
      definition: 尊重用户在系统中减少动画的偏好，为大范围运动提供更安静的替代方式。
      context: 样板尊重减少动态效果偏好，不自动播放录屏；接入时应直接展开答案。
      parameter: 原作未内置此处理；接入时给高度、透明度和图标动画提供替代。
      judgment: 保留操作结果和内容变化，让用户仍然能完成相同的任务。
---

## 拆解设计

### 先给线索，再给细节

问题标题始终可见，点击后才显示答案。这种 [[disclosure|渐进披露]] 让用户先判断哪些信息与自己有关。

### 一次只读一段

原作使用 [[single|单项展开]]：打开另一题会关闭上一题，再次点击当前题会收起。初始默认展开第二题。

### 让页面连续地腾出空间

答案通过 [[height|高度动画]] 从零展开，同时渐显；后面的题目随布局向下移动。[[easing|缓动]] 让变化有起点和收尾。

### 适合用在哪里

常见问题、设置帮助、非必读的补充说明。标题本身能说明内容时尤其合适。

### 什么时候不用

需要并排比较的方案、必须完整阅读的重要说明。频繁开关会增加查找成本。

### 试一次，就会更懂

请一个没看过页面的人找退款条件。记录他点了哪一题，先改标题，再考虑动画。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

放在页面后半段解答疑问。关键价格和限制直接展示，剩余问题再按需展开。
