---
locale: zh
status: published
title: Facebook 人物资料卡
summary: 悬停Facebook链接时展开封面、头像和简介，让外部个人链接更容易辨认。
description: 悬停Facebook链接时展开封面、头像和简介，让外部个人链接更容易辨认。
previewText:
  eyebrow: 卡片、悬浮预览与人物展示
  display: Facebook Card
  note: Great UI · 交互学习
learning:
  category: 卡片、悬浮预览与人物展示
  classification:
    type: 组件
    purpose:
      - 作品展示
    behavior:
      - 悬浮展开
      - 位置跟随
      - 资料摘要
  placementHint: 作品集、作者介绍或联系区中的外部账号链接。
  changesHint: 为浮层增加可聚焦的开关、关闭方式和触摸入口，限制宽度并按可用空间调整位置；移除无依据的默认资料和统计。
  preserve:
    - 悬停实际链接，核对展开资料与目标账号一致；离开后收起，链接可正常访问。
    - 核心链接始终可访问，资料为补充信息，不以动画或默认值冒充平台认证数据。
  checks:
    - 悬停实际链接，核对展开资料与目标账号一致；离开后收起，链接可正常访问。
    - 键盘与触摸可打开关闭，320px视口不溢出，缺图和长简介仍有可读结果。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 鼠标进入链接区域时卡片从轻微模糊、缩小变为清晰；离开区域后收起。姓名、朋友和共同朋友数量均是传入的展示内容；原作没有登录Facebook或读取关系数据。 保留项目自己的内容与样式，先核对固定源码中的name / bio / friends / mutualFriends、username / href / avatarUrl、enableLinkTilt / enableCardTilt / cardTiltMaxRotate。
      judge: 悬停实际链接，核对展开资料与目标账号一致；离开后收起，链接可正常访问。
    - id: improve
      title: 让资料在触摸和键盘下可读
      action: 为浮层增加可聚焦的开关、关闭方式和触摸入口，限制宽度并按可用空间调整位置；移除无依据的默认资料和统计。
      judge: 键盘与触摸可打开关闭，320px视口不溢出，缺图和长简介仍有可读结果。
    - id: quiet
      title: 减少动效也能完成
      action: 保留Facebook 人物资料卡的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；mutualFriends 默认12且不能代表当前访客真实关系；不应在无数据依据时显示个性化共同朋友数。 悬浮层只有鼠标入口，固定320px宽且向上展开，窄屏与靠近页面边缘时需要调整。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 人物与关系
      - name / bio / friends / mutualFriends
      - 替换全部示例值，无可靠关系数据时移除该行。
    - - 真实链接与图片
      - username / href / avatarUrl
      - 不读取平台账号；替换自有或有权使用的头像和真实目标。
    - - 跟随强度
      - enableLinkTilt / enableCardTilt / cardTiltMaxRotate
      - 默认最大5度；减少动态效果时关闭位移与倾斜。
  glossary:
    facebook-card-mechanism:
      term: 'hover-profile'
      context: 指针相对中心的位置经弹簧平滑，控制卡片横向跟随和旋转；上方浮层用透明度、位移及模糊完成出现。预览关闭卡片倾斜。
      parameter: name / bio / friends / mutualFriends：替换全部示例值，无可靠关系数据时移除该行。；username / href / avatarUrl：不读取平台账号；替换自有或有权使用的头像和真实目标。；enableLinkTilt / enableCardTilt / cardTiltMaxRotate：默认最大5度；减少动态效果时关闭位移与倾斜。
      judgment: mutualFriends 默认12且不能代表当前访客真实关系；不应在无数据依据时显示个性化共同朋友数。 悬浮层只有鼠标入口，固定320px宽且向上展开，窄屏与靠近页面边缘时需要调整。
---

## 拆解设计

### 它在做什么

鼠标进入链接区域时卡片从轻微模糊、缩小变为清晰；离开区域后收起。姓名、朋友和共同朋友数量均是传入的展示内容；原作没有登录Facebook或读取关系数据。

### 效果是怎么形成的

[[facebook-card-mechanism|悬浮资料]]：指针相对中心的位置经弹簧平滑，控制卡片横向跟随和旋转；上方浮层用透明度、位移及模糊完成出现。预览关闭卡片倾斜。

### 接进项目时要注意什么

mutualFriends 默认12且不能代表当前访客真实关系；不应在无数据依据时显示个性化共同朋友数。 悬浮层只有鼠标入口，固定320px宽且向上展开，窄屏与靠近页面边缘时需要调整。

### 适合用在哪里

作品集、作者介绍或联系区中的外部账号链接。

### 什么时候不用

依靠平台实时认证或个性化关系的业务界面，以及只有悬停才能看到的重要信息。

### 试一次，就会更懂

悬停链接后把指针移到卡片内部，再离开；比较关闭倾斜后可读性。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

与其他社交悬浮卡是相同交互家族，按真实账号选择，避免在同一区域重复堆叠装饰。
