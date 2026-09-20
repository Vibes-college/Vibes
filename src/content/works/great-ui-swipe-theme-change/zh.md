---
locale: zh
status: published
title: 沿方向扫开的主题
summary: 新主题从选定边缘或角落铺开，页面布局保持原位，用一条移动边界解释明暗变化。
description: 新主题从选定边缘或角落铺开，页面布局保持原位，用一条移动边界解释明暗变化。
previewText:
  eyebrow: 主题切换
  display: Swipe Theme Provider
  note: Great UI · 交互学习
learning:
  category: 主题切换
  classification:
    type: 组件
    purpose:
      - 主题切换
    behavior:
      - 方向扫过
      - 斜角裁切
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
      action: 点击方向按钮后，根主题立即更新，浏览器的新视图通过多边形裁切逐渐露出；普通四向还可设置斜角。 保留项目自己的内容与样式，先核对固定源码中的direction / triggerSwipe、angle / duration、getKeyframes。
      judge: 实际切换后根主题与显示文案一致，动画结束后可再次操作；减少动态效果或不支持API时应立即切换。
    - id: improve
      title: 接入唯一主题状态
      action: 把项目现有主题作为受控状态；统一根视图动画调度，在finished后交还后续动作，避免多个提供者同时写入根元素。
      judge: 从项目入口与系统偏好改变主题都一致，重复触发不重叠，减少动态效果下仍完成切换。
    - id: quiet
      title: 减少动效也能完成
      action: 保留沿方向扫开的主题的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；getKeyframes 虽声明支持对象形式，实际只读取数组前两项的 clipPath；自定义时应提供这两个端点。 它会写入整个根元素的dark类和data-theme，并共用根视图样式；需要唯一主题负责人。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 扫过方向
      - direction / triggerSwipe
      - 支持四边、四角和完整方向别名；名称表示新主题从哪边进入。
    - - 斜角与时长
      - angle / duration
      - 默认0度额外倾斜、650毫秒；角落模式使用固定三角形。
    - - 自定义边界
      - getKeyframes
      - 传入至少两个带 clipPath 的关键帧，核对最终覆盖整屏。
  glossary:
    swipe-theme-change-mechanism:
      term: 'polygon-clipping'
      context: clip-path polygon 的顶点变化形成扫过边界。left 表示从左向右；角落模式使用三角形展开，不受斜角参数影响。
      parameter: direction / triggerSwipe：支持四边、四角和完整方向别名；名称表示新主题从哪边进入。；angle / duration：默认0度额外倾斜、650毫秒；角落模式使用固定三角形。；getKeyframes：传入至少两个带 clipPath 的关键帧，核对最终覆盖整屏。
      judgment: getKeyframes 虽声明支持对象形式，实际只读取数组前两项的 clipPath；自定义时应提供这两个端点。 它会写入整个根元素的dark类和data-theme，并共用根视图样式；需要唯一主题负责人。
---

## 拆解设计

### 它在做什么

点击方向按钮后，根主题立即更新，浏览器的新视图通过多边形裁切逐渐露出；普通四向还可设置斜角。

### 效果是怎么形成的

[[swipe-theme-change-mechanism|多边形裁切]]：clip-path polygon 的顶点变化形成扫过边界。left 表示从左向右；角落模式使用三角形展开，不受斜角参数影响。

### 接进项目时要注意什么

getKeyframes 虽声明支持对象形式，实际只读取数组前两项的 clipPath；自定义时应提供这两个端点。 它会写入整个根元素的dark类和data-theme，并共用根视图样式；需要唯一主题负责人。

### 适合用在哪里

有明确明暗切换入口的作品集、内容站或设置页。

### 什么时候不用

同页并行运行多个独立主题提供者，或用主题动画代替页面导航和业务反馈。

### 试一次，就会更懂

分别点击边缘和角落按钮，再用15度斜角比较普通四向的边界。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

与其他主题转场是替代关系；组合导航时需协调根视图动画和主题写入。
