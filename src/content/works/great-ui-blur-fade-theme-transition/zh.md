---
locale: zh
status: published
title: 模糊淡化的主题切换
summary: 旧主题渐渐模糊淡出，新主题同时从模糊中变清晰，适合不强调方向的短暂切换。
description: 旧主题渐渐模糊淡出，新主题同时从模糊中变清晰，适合不强调方向的短暂切换。
previewText:
  eyebrow: 主题切换
  display: Blur Fade Theme Transition
  note: Great UI · 交互学习
learning:
  category: 主题切换
  classification:
    type: 组件
    purpose:
      - 主题切换
    behavior:
      - 交叉淡化
      - 主题模糊
  placementHint: 有明确明暗切换入口的作品集、内容站或设置页。
  changesHint: 把项目现有主题作为受控状态；统一根视图动画调度，在finished后交还后续动作，避免多个提供者同时写入根元素。
  preserve:
    - 实际切换后根主题与显示文案一致，动画结束后可再次操作；减少动态效果或不支持API时应立即切换。
    - 主题是真实状态变化，文字、图片与按钮在新主题中仍可辨认。
  checks:
    - 实际切换后根主题与显示文案一致，动画结束后可再次操作；减少动态效果或不支持API时应立即切换。
    - 从项目入口与系统偏好改变主题都一致，重复触发不重叠，减少动态效果下仍完成切换。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 触发后更新根主题，新旧视图同时播放：旧画面从清晰到模糊并消失，新画面反向变化。 保留项目自己的内容与样式，先核对固定源码中的maxBlur、duration / triggerTransition、easing / onTransition。
      judge: 实际切换后根主题与显示文案一致，动画结束后可再次操作；减少动态效果或不支持API时应立即切换。
    - id: improve
      title: 接入唯一主题状态
      action: 把项目现有主题作为受控状态；统一根视图动画调度，在finished后交还后续动作，避免多个提供者同时写入根元素。
      judge: 从项目入口与系统偏好改变主题都一致，重复触发不重叠，减少动态效果下仍完成切换。
    - id: quiet
      title: 减少动效也能完成
      action: 保留模糊淡化的主题切换的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；整个根视图都参与模糊，长页面和复杂内容需实测绘制成本；不能靠降低透明度解决实际主题配色对比度问题。 它会写入整个根元素的dark类和data-theme，并共用根视图样式；需要唯一主题负责人。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 清晰度变化
      - maxBlur
      - 默认16px，可先减小再判断是否仍需要模糊。
    - - 整体速度
      - duration / triggerTransition
      - 默认500毫秒，触发函数可单次覆盖时长与模糊强度。
    - - 过渡曲线
      - easing / onTransition
      - 默认ease-in-out；onTransition在主题应用时发生，不表示动画结束。
  glossary:
    blur-fade-theme-transition-mechanism:
      title: 交叉淡化
      english: Cross-fade
      kind: 行为与原理
      definition: 让旧画面逐渐减少、新画面逐渐增加，在短时间内共同构成可见结果。
      context: View Transition 的 old(root) 与 new(root) 各有一套 filter 和 opacity 关键帧，两者共享时长。
      parameter: maxBlur：默认16px，可先减小再判断是否仍需要模糊。；duration / triggerTransition：默认500毫秒，触发函数可单次覆盖时长与模糊强度。；easing / onTransition：默认ease-in-out；onTransition在主题应用时发生，不表示动画结束。
      judgment: 整个根视图都参与模糊，长页面和复杂内容需实测绘制成本；不能靠降低透明度解决实际主题配色对比度问题。 它会写入整个根元素的dark类和data-theme，并共用根视图样式；需要唯一主题负责人。
---

## 拆解设计

### 它在做什么

触发后更新根主题，新旧视图同时播放：旧画面从清晰到模糊并消失，新画面反向变化。

### 效果是怎么形成的

[[blur-fade-theme-transition-mechanism|交叉淡化]]：View Transition 的 old(root) 与 new(root) 各有一套 filter 和 opacity 关键帧，两者共享时长。

### 接进项目时要注意什么

整个根视图都参与模糊，长页面和复杂内容需实测绘制成本；不能靠降低透明度解决实际主题配色对比度问题。 它会写入整个根元素的dark类和data-theme，并共用根视图样式；需要唯一主题负责人。

### 适合用在哪里

有明确明暗切换入口的作品集、内容站或设置页。

### 什么时候不用

同页并行运行多个独立主题提供者，或用主题动画代替页面导航和业务反馈。

### 试一次，就会更懂

触发两次恢复原主题，观察文字从模糊回到清晰后是否完整且对比度足够。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

与其他主题转场是替代关系；组合导航时需协调根视图动画和主题写入。
