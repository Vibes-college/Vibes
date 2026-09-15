---
locale: zh
status: published
title: 随滚动飞入的卡片
summary: 每张卡片随滚动进入、停留和离开，背景文字保持在视野中，让几个重点形成连续的阅读段落。
description: 每张卡片随滚动进入、停留和离开，背景文字保持在视野中，让几个重点形成连续的阅读段落。
previewText:
  eyebrow: 视觉交互
  display: Scroll Flying Cards
  note: Great UI · 交互学习
learning:
  category: 视觉交互
  classification:
    type: 组件
    purpose:
      - 作品展示
    behavior:
      - 滚动映射
      - 飞入淡出
  placementHint: 少量产品亮点、分步理念说明、编辑式作品展示。
  changesHint: 减少卡片数量与每卡占据的高度，扩大静止阅读区；减少动态效果时去掉位移模糊，将卡片排列为普通列表。
  preserve:
    - 在实际滚动容器中来回滚动，每张卡片都经过完整可读状态，不因容器选错而一直模糊或透明。
    - 每张卡片有足够稳定的阅读区，进入与退出不能遮住正在理解的关键信息。
  checks:
    - 在实际滚动容器中来回滚动，每张卡片都经过完整可读状态，不因容器选错而一直模糊或透明。
    - 手机上快速和慢速滚动均能读清全部标题；静态模式能直接看到所有内容，底部没有多余空白。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 向下滚动时，卡片从模糊、缩小和偏移的位置进入，中段恢复清晰并停留，随后向另一侧淡出；反向滚动可倒放这一过程。 保留项目自己的内容与样式，先核对固定源码中的animationConfig.direction / offset、animationConfig.rotation / scale / blur、scrollContainerRef / useScroll offset。
      judge: 在实际滚动容器中来回滚动，每张卡片都经过完整可读状态，不因容器选错而一直模糊或透明。
    - id: improve
      title: 缩短页面又保留节奏
      action: 减少卡片数量与每卡占据的高度，扩大静止阅读区；减少动态效果时去掉位移模糊，将卡片排列为普通列表。
      judge: 手机上快速和慢速滚动均能读清全部标题；静态模式能直接看到所有内容，底部没有多余空白。
    - id: quiet
      title: 减少动效也能完成
      action: 保留随滚动飞入的卡片的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；每张卡占用约一屏以上的滚动距离，数量一多会明显拖长页面；scrollContainerRef 必须指向真实滚动容器，减少动态效果时需保留静态内容。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 进入方向与幅度
      - animationConfig.direction / offset
      - 默认向上，偏移300px；窄屏应按实际可见区域缩小。
    - - 阅读时的清晰度
      - animationConfig.rotation / scale / blur
      - 默认10度、0.85与20px模糊，中段归零旋转和模糊并恢复正常大小。
    - - 实际滚动容器
      - scrollContainerRef / useScroll offset
      - 每卡依据 start end 到 end start 的进度变化，内嵌区域要传入它自己的滚动元素。
  glossary:
    scroll-flying-cards-mechanism:
      term: 'scroll-progress-mapping'
      context: 每张卡片的滚动进度分别控制位移、角度、透明度、缩放和模糊。0.4到0.6附近是稳定阅读区，奇偶卡片使用相反倾斜方向。
      parameter: animationConfig.direction / offset：默认向上，偏移300px；窄屏应按实际可见区域缩小。；animationConfig.rotation / scale / blur：默认10度、0.85与20px模糊，中段归零旋转和模糊并恢复正常大小。；scrollContainerRef / useScroll offset：每卡依据 start end 到 end start 的进度变化，内嵌区域要传入它自己的滚动元素。
      judgment: 每张卡占用约一屏以上的滚动距离，数量一多会明显拖长页面；scrollContainerRef 必须指向真实滚动容器，减少动态效果时需保留静态内容。
---

## 拆解设计

### 它在做什么

向下滚动时，卡片从模糊、缩小和偏移的位置进入，中段恢复清晰并停留，随后向另一侧淡出；反向滚动可倒放这一过程。

### 效果是怎么形成的

[[scroll-flying-cards-mechanism|滚动进度映射]]：每张卡片的滚动进度分别控制位移、角度、透明度、缩放和模糊。0.4到0.6附近是稳定阅读区，奇偶卡片使用相反倾斜方向。

### 接进项目时要注意什么

每张卡占用约一屏以上的滚动距离，数量一多会明显拖长页面；scrollContainerRef 必须指向真实滚动容器，减少动态效果时需保留静态内容。

### 适合用在哪里

少量产品亮点、分步理念说明、编辑式作品展示。

### 什么时候不用

几十条结果列表、快速查找工具、必须并排比较的方案。

### 试一次，就会更懂

缓慢滚动到一张卡片最清晰的位置，再继续向下，观察哪些属性先开始变化。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

在浏览或示例环节选择它时，应减少其他大范围运动；需要快速比较则改用静态卡片。
