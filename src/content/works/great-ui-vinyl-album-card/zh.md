---
locale: zh
status: published
title: 滑出唱片的专辑卡
summary: 鼠标经过专辑封面时，唱片向右滑出并旋转，封面轻微倾斜，把平面图片变成可感知的物件。
description: 鼠标经过专辑封面时，唱片向右滑出并旋转，封面轻微倾斜，把平面图片变成可感知的物件。
previewText:
  eyebrow: 卡片、悬浮预览与人物展示
  display: Vinyl Album Card
  note: Great UI · 交互学习
learning:
  category: 卡片、悬浮预览与人物展示
  classification:
    type: 组件
    purpose:
      - 作品展示
    behavior:
      - 物件隐喻
      - 弹簧位移
  placementHint: 音乐项目作品展示、专辑介绍。
  changesHint: 保留可读专辑资料，触摸可展开或直接显示唱片；需要播放时单独提供实际播放器，限制位移和容器，静态模式保留封面。
  preserve:
    - 按原作的悬停或点击方式观察物件隐喻，核对内容和结束状态；记录未覆盖的变体。
    - 主要内容与操作结果不依赖装饰动画才能取得。
  checks:
    - 按原作的悬停或点击方式观察物件隐喻，核对内容和结束状态；记录未覆盖的变体。
    - 键盘与触摸能取得资料，手机不溢出，封面失败有替代，展示状态不冒充正在播放。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 悬停时唱片移动140px、转180度，封面左移20px并倾斜；离开后两者恢复。 保留项目自己的内容与样式，先核对固定源码中的title / artist / releaseType / year / coverImage、x / rotate / spring、useTheme / w-[500px]。
      judge: 按原作的悬停或点击方式观察物件隐喻，核对内容和结束状态；记录未覆盖的变体。
    - id: improve
      title: 把展示接到真实入口
      action: 保留可读专辑资料，触摸可展开或直接显示唱片；需要播放时单独提供实际播放器，限制位移和容器，静态模式保留封面。
      judge: 键盘与触摸能取得资料，手机不溢出，封面失败有替代，展示状态不冒充正在播放。
    - id: quiet
      title: 减少动效也能完成
      action: 保留滑出唱片的专辑卡的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；没有播放、购买或跳转；固定500px容器容易超出手机。依赖原站ThemeProvider和framer-motion，需要适配项目环境。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 专辑信息
      - title / artist / releaseType / year / coverImage
      - 替换示例专辑、未来年份和有权使用的封面。
    - - 唱片动作
      - x / rotate / spring
      - 默认140px及180度，只往目标旋转，不会持续播放转动。
    - - 主题与尺寸
      - useTheme / w-[500px]
      - 替换原站主题依赖，按可用宽度限制整体尺寸。
  glossary:
    vinyl-album-card-mechanism:
      term: 'object-metaphor'
      context: 两层独立弹簧控制唱片和封面，唱片圆环及反光由CSS组成，封面和中心标签共用图片。
      parameter: title / artist / releaseType / year / coverImage：替换示例专辑、未来年份和有权使用的封面。；x / rotate / spring：默认140px及180度，只往目标旋转，不会持续播放转动。；useTheme / w-[500px]：替换原站主题依赖，按可用宽度限制整体尺寸。
      judgment: 没有播放、购买或跳转；固定500px容器容易超出手机。依赖原站ThemeProvider和framer-motion，需要适配项目环境。
---

## 拆解设计

### 它在做什么

悬停时唱片移动140px、转180度，封面左移20px并倾斜；离开后两者恢复。

### 效果是怎么形成的

[[vinyl-album-card-mechanism|物件隐喻]]：两层独立弹簧控制唱片和封面，唱片圆环及反光由CSS组成，封面和中心标签共用图片。

### 接进项目时要注意什么

没有播放、购买或跳转；固定500px容器容易超出手机。依赖原站ThemeProvider和framer-motion，需要适配项目环境。

### 适合用在哪里

音乐项目作品展示、专辑介绍。

### 什么时候不用

完整音乐播放器、唱片交易操作或依靠悬停完成业务的入口。

### 试一次，就会更懂

悬停后等几秒，留意唱片只转到目标角度而非持续播放。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

承担内容展示这一环节；业务动作、数据和异常仍由完整路径负责。
