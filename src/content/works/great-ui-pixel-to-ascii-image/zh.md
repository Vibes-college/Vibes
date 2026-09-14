---
locale: zh
status: published
title: 从图像变成字符画
summary: 悬停图片时，画面先变为色块，再由亮度对应的字符重组，离开时恢复原图。
description: 悬停图片时，画面先变为色块，再由亮度对应的字符重组，离开时恢复原图。
previewText:
  eyebrow: 视觉交互
  display: Pixel To Ascii Image
  note: Great UI · 交互学习
learning:
  category: 视觉交互
  classification:
    type: 组件
    purpose:
      - 作品展示
    behavior:
      - 像素采样
      - 字符映射
  placementHint: 少量艺术肖像、科技主题装饰、图像原理演示。
  changesHint: 校验正数与最大格数，处理图片失败及旧请求；静止和离屏停止无用重绘，补图片替代文本与触摸入口，静态模式保留原图。
  preserve:
    - 按原作的悬停或点击方式观察像素采样，核对内容和结束状态；记录未覆盖的变体。
    - 主要内容与操作结果不依赖装饰动画才能取得。
  checks:
    - 按原作的悬停或点击方式观察像素采样，核对内容和结束状态；记录未覆盖的变体。
    - 0、负值、跨域失败不挂住页面；离开后恢复原图，触摸与减少动态效果可取得图像内容。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 弹簧进度前30%把像素分块，70%之后逐步换成字符；最终字符仍会少量随机闪动。预览600×600、字符24px。 保留项目自己的内容与样式，先核对固定源码中的src / img.crossOrigin、width / height / charSize、chars / textColor。
      judge: 按原作的悬停或点击方式观察像素采样，核对内容和结束状态；记录未覆盖的变体。
    - id: improve
      title: 让重绘可控且可访问
      action: 校验正数与最大格数，处理图片失败及旧请求；静止和离屏停止无用重绘，补图片替代文本与触摸入口，静态模式保留原图。
      judge: 0、负值、跨域失败不挂住页面；离开后恢复原图，触摸与减少动态效果可取得图像内容。
    - id: quiet
      title: 减少动效也能完成
      action: 保留从图像变成字符画的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；图片需要允许跨域读取像素；无失败处理。charSize为0或负数会让绘制循环无法推进，必须校验。持续逐帧重绘和小字符会增加成本；源码实际从framer-motion导入。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 源图与跨域
      - src / img.crossOrigin
      - 使用可读取像素的来源，并处理加载失败或canvas读取异常。
    - - 输出规模
      - width / height / charSize
      - 正尺寸和正字符大小，先预算width×height/charSize²格。
    - - 字符与颜色
      - chars / textColor
      - 默认按根dark类选黑白；可传固定颜色并核对背景对比。
  glossary:
    pixel-to-ascii-image-mechanism:
      title: 亮度映射
      english: Luminance mapping
      kind: 行为与原理
      definition: 把图像区域的明暗换成疏密不同的字符，以字符保留原图轮廓。
      context: canvas读取图片像素，每格采样颜色和亮度，再选择字符；坐标哈希让不同格子在不同阶段变化。
      parameter: src / img.crossOrigin：使用可读取像素的来源，并处理加载失败或canvas读取异常。；width / height / charSize：正尺寸和正字符大小，先预算width×height/charSize²格。；chars / textColor：默认按根dark类选黑白；可传固定颜色并核对背景对比。
      judgment: 图片需要允许跨域读取像素；无失败处理。charSize为0或负数会让绘制循环无法推进，必须校验。持续逐帧重绘和小字符会增加成本；源码实际从framer-motion导入。
---

## 拆解设计

### 它在做什么

弹簧进度前30%把像素分块，70%之后逐步换成字符；最终字符仍会少量随机闪动。预览600×600、字符24px。

### 效果是怎么形成的

[[pixel-to-ascii-image-mechanism|亮度映射]]：canvas读取图片像素，每格采样颜色和亮度，再选择字符；坐标哈希让不同格子在不同阶段变化。

### 接进项目时要注意什么

图片需要允许跨域读取像素；无失败处理。charSize为0或负数会让绘制循环无法推进，必须校验。持续逐帧重绘和小字符会增加成本；源码实际从framer-motion导入。

### 适合用在哪里

少量艺术肖像、科技主题装饰、图像原理演示。

### 什么时候不用

包含关键文字的图片、低性能设备上的大画布，或需要原图无损识别的内容。

### 试一次，就会更懂

悬停并观察色块先出现、字符后出现；比较24px与更大字符的轮廓清晰度。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

承担内容展示这一环节；业务动作、数据和异常仍由完整路径负责。
