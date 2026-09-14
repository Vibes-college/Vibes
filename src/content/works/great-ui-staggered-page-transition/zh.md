---
locale: zh
status: published
title: 错峰页面转场
summary: 把一次页面切换拆成一组有先后顺序的动作，让旧内容退场、新内容出现得更从容。
description: 把一次页面切换拆成一组有先后顺序的动作，让旧内容退场、新内容出现得更从容。
previewText:
  eyebrow: 页面转场
  display: Staggered Page Transition
  note: Great UI · 交互学习
learning:
  category: 页面转场
  classification:
    type: 组件
    purpose:
      - 页面导航
    behavior:
      - 错峰
      - 遮挡揭示
  placementHint: 例如：作品集的首页与项目详情之间
  changesHint: 例如：保留我的黑白配色，改成三块，从左侧进入
  preserve:
    - 完全遮住之后再切换内容
    - 同组面板使用一致的运动规则
    - 一次操作只完成一次切换
  checks:
    - 内容只在完全遮住后切换，且一次操作只切换一次。
    - 动画结束后遮挡层不再拦截点击和键盘操作。
    - 连续点击、前进后退、修饰键新开链接不会产生错乱。
    - 加载慢或失败时有可理解的反馈，不能假设计时结束就已加载完成。
    - 减少动态效果偏好下直接切换或采用轻量过渡。
    - 在手机宽度和目标项目的真实路由中检查，说明未覆盖的环境。
  goals:
    - id: faithful
      title: 先复现核心行为
      action: 保留下面列出的核心关系，用项目已有的字体、配色和布局接入。先验证静态内容可用，再加入动效。
      judge: 操作结果正确，视觉顺序能与参考对照，关掉动画仍能完成任务。
    - id: quicker
      title: 切换更利落
      action: 从 3 块、每段 0.4 秒、间隔 0.04 秒试起，先保留原曲线。等全部遮住且新内容就绪再揭开。
      judge: 总动画约 1.01 秒；慢加载有反馈，连续点击不重复导航。该数值是待比较的起点。
    - id: quieter
      title: 降低视觉干扰
      action: 减少分块和错峰，遮挡层使用项目背景色；高频页面直接切换。减少动态效果时跳过大面积运动。
      judge: 切换清楚，操作没有多余等待；离场后遮挡层不拦截点击。
  adjustments:
    - - 块数与间隔
      - columns / staggerDelay
      - 增加块数会延长末块等待。两者一起算，再决定是否保留错峰。
    - - 运动时长与方向
      - duration / direction / exitOpposite
      - 先改时长，再改方向；方向应符合页面之间的关系。
    - - 内容交接
      - onViewSwap
      - 遮挡完成与目标内容就绪是两个条件；回调不是加载完成的证明。
  glossary:
    stagger:
      title: 错峰
      english: Stagger
      kind: 行为
      definition: 同组元素按顺序、带着时间间隔开始运动。差异来自开始时间，元素本身可以使用相同的动画。
      context: 原作的五块遮挡层每隔 75 毫秒启动一块，让一次页面切换产生连续的节奏。
      parameter: staggerDelay = 0.075 秒；第 i 块的延迟 = i × staggerDelay（i 从 0 开始）。
      judgment: 间隔太大会让最后一块迟迟不到位。增加块数时，也要检查整体等待时间。
    overlay:
      title: 遮挡层
      english: Overlay
      kind: 原语
      definition: 放在内容上方的独立视觉层。它可以暂时盖住底下的内容，而不用移动内容本身。
      context: 原作把全屏遮挡层分成五块；先盖住旧页面，再从同一位置揭开新页面。
      parameter: columns 控制分块数量，panelClassName 控制遮挡层的颜色与外观。
      judgment: 遮挡只是视觉手段。它本身不会让目标页面的数据更快加载完成。
    transform:
      title: 位移
      english: Translate
      kind: 原语
      definition: 改变元素在画面里的显示位置，同时保留它在布局中的占位。
      context: 顶部进入时，每块面板从视口上方移动到中央，再向下离开。底下的文字并没有一起滑动。
      parameter: '原作使用 y: -100dvh → 0 → 100dvh；左右方向改用 x 与 dvw。'
      judgment: 方向应帮助读者理解变化。普通列表刷新通常不需要全屏位移。
    easing:
      title: 缓动
      english: Easing
      kind: 原语
      definition: 描述动画过程中速度如何变化。即使总时长相同，匀速、先慢后快、先快后慢的感觉也不同。
      context: 原作使用两端慢、中段快的曲线，让面板有一个明确的起步和收尾。
      parameter: ease = [0.85, 0, 0.15, 1]，对应 cubic-bezier(0.85, 0, 0.15, 1)。
      judgment: 先保留原曲线，再调整时长；同时改变太多参数，会很难判断节奏为什么变了。
    swap:
      title: 内容切换时机
      english: View swap
      kind: 交互术语
      definition: 把旧视图替换成新视图的时刻。它需要与动画的遮挡状态协调。
      context: 等最后一块面板也完全到位，调用 onViewSwap，再停留 50 毫秒后开始退场。
      parameter: 完全遮住的时刻 = duration + (columns − 1) × staggerDelay。原始参数下为 1.05 秒。
      judgment: onViewSwap 只是回调，不能保证异步路由已经渲染完。接入真实项目时要单独处理加载与失败。
    reduced:
      title: 减少动态效果
      english: Reduced motion
      kind: 使用规范
      definition: 尊重用户在系统中减少动画的偏好，为大范围运动提供更安静的替代方式。
      context: 这个样板在系统开启此偏好时不自动播放录屏。接入项目时，直接完成内容切换。
      parameter: 通过 prefers-reduced-motion 检查偏好。原作该文件没有内置此处理，实际接入时应补上。
      judgment: 保留操作结果和内容变化，让用户仍然能完成相同的任务。
---

## 拆解设计

### 它在做什么

原作把 [[overlay|遮挡层]] 分成五块，通过 [[stagger|错峰]] 依次盖住旧页面。等整个画面被遮住，才替换内容，再让面板依次离开。

### 为什么会有这种节奏

每块面板使用同一套 [[transform|位移]] 和 [[easing|缓动]]，只把开始时间错开。秩序来自一致的运动规则，变化来自时间差。

### 最需要保留的关系

保留“完全遮住 → 切换内容 → 揭开”的顺序。[[swap|内容切换时机]] 比粉色、块数和方向更关键；提前切换会让用户看见底下突然跳变。

### 适合用在哪里

作品集、品牌展示、低频的页面导航。适合给一次明确的场景变化留出过渡。

### 什么时候不用

高频筛选、表格操作、搜索结果更新。反复遮住整个画面会拖慢操作；移动端也应缩短等待。

### 试一次，就会更懂

做快、慢两版，让别人连续打开三个项目。记录哪一版更容易等待，保留一条理由。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

用于作品集的页面交接。先确定进入哪个内容页，再决定转场是否值得占用时间。
