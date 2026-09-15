---
locale: zh
status: published
title: 有细节反馈的文字链接
summary: 让链接在悬停时通过线条、文字填色或替换强调可点击性，保留正文式的轻量外观。
description: 让链接在悬停时通过线条、文字填色或替换强调可点击性，保留正文式的轻量外观。
previewText:
  eyebrow: 视觉交互
  display: Animated Link
  note: Great UI · 交互学习
learning:
  category: 视觉交互
  classification:
    type: 组件
    purpose:
      - 页面导航
    behavior:
      - 链接反馈
      - 裁切填色
  placementHint: 正文链接、作品入口、少量顶部导航。
  changesHint: 为键盘焦点加清晰状态，链接目标使用实际路由；减少动态效果时显示静态下划线或颜色强调。
  preserve:
    - 按原作的悬停或点击方式观察链接反馈，核对内容和结束状态；记录未覆盖的变体。
    - 主要内容与操作结果不依赖装饰动画才能取得。
  checks:
    - 按原作的悬停或点击方式观察链接反馈，核对内容和结束状态；记录未覆盖的变体。
    - 键盘能辨认当前链接并进入正确页面；长文字不被textRise裁切，读屏不重复读装饰副本。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 预览提供13种样式：线条伸缩、裁切填色、波浪循环与文字上移；目标都是#占位。 保留项目自己的内容与样式，先核对固定源码中的variant、href / next/link、isHovered / wavy transition。
      judge: 按原作的悬停或点击方式观察链接反馈，核对内容和结束状态；记录未覆盖的变体。
    - id: improve
      title: 明确可点击且不依赖鼠标
      action: 为键盘焦点加清晰状态，链接目标使用实际路由；减少动态效果时显示静态下划线或颜色强调。
      judge: 键盘能辨认当前链接并进入正确页面；长文字不被textRise裁切，读屏不重复读装饰副本。
    - id: quiet
      title: 减少动效也能完成
      action: 保留有细节反馈的文字链接的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；依赖next/link；多数反馈仅监听hover，需补focus-visible。showArrow只在基础分支出现，不适用于所有变体。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 选择风格
      - variant
      - 13种规则按需要选择，同一区域保持一致。
    - - 链接目标
      - href / next/link
      - 替换#，适配项目现有路由；复制文字层已有aria-hidden。
    - - 动效边界
      - isHovered / wavy transition
      - 波浪循环需在离开和减少动态效果时停下，键盘有等价强调。
  glossary:
    animated-link-mechanism:
      term: 'decoration-and-semantics'
      context: 简单变体用CSS伪元素，填色和文字替换用重叠文字及Motion裁切或位移。
      parameter: variant：13种规则按需要选择，同一区域保持一致。；href / next/link：替换#，适配项目现有路由；复制文字层已有aria-hidden。；isHovered / wavy transition：波浪循环需在离开和减少动态效果时停下，键盘有等价强调。
      judgment: 依赖next/link；多数反馈仅监听hover，需补focus-visible。showArrow只在基础分支出现，不适用于所有变体。
---

## 拆解设计

### 它在做什么

预览提供13种样式：线条伸缩、裁切填色、波浪循环与文字上移；目标都是#占位。

### 效果是怎么形成的

[[animated-link-mechanism|装饰与语义]]：简单变体用CSS伪元素，填色和文字替换用重叠文字及Motion裁切或位移。

### 接进项目时要注意什么

依赖next/link；多数反馈仅监听hover，需补focus-visible。showArrow只在基础分支出现，不适用于所有变体。

### 适合用在哪里

正文链接、作品入口、少量顶部导航。

### 什么时候不用

把持续动态当作唯一可点击提示，或每个链接使用不同风格。

### 试一次，就会更懂

比较基础下划线与文字上移，再用键盘检查是否有同样清晰的反馈。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

承担导航入口这一环节；业务动作、数据和异常仍由完整路径负责。
