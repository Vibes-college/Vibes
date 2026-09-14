---
locale: zh
status: published
title: GitHub 贡献悬浮卡
summary: 鼠标停在 GitHub 链接上时展开资料卡，用小格子呈现近期贡献，让个人链接带上更多背景。
description: 鼠标停在 GitHub 链接上时展开资料卡，用小格子呈现近期贡献，让个人链接带上更多背景。
previewText:
  eyebrow: 社交卡片
  display: Github Card
  note: Great UI · 交互学习
learning:
  category: 社交卡片
  classification:
    type: 组件
    purpose:
      - 作品展示
    behavior:
      - 悬浮展开
      - 位置跟随
      - 数据日历
  placementHint: 开发者简介、作品集个人链接、可补充阅读的作者资料。
  changesHint: 给卡片增加键盘和触摸入口；让外部数据读取显式区分加载、失败与真实零值，并写清统计时间范围。
  preserve:
    - 悬停 GitHub 链接后能看到卡片，再悬停某个格子看到该日日期与次数；离开后卡片收起。
    - 链接仍可直接访问，贡献时间范围、总数与数据源必须彼此一致。
  checks:
    - 悬停 GitHub 链接后能看到卡片，再悬停某个格子看到该日日期与次数；离开后卡片收起。
    - 键盘或触摸能打开关闭；阻断请求后出现失败说明而不是把全零显示为真实贡献。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 页面挂载时读取用户资料与贡献数据；悬停链接展开卡片，移动鼠标可产生轻微倾斜，停在某一天的小格上显示日期和次数。 保留项目自己的内容与样式，先核对固定源码中的username / contributionsData / year、enableLinkTilt / enableCardTilt / linkTiltMaxRotate / cardTiltMaxRotate、themeScheme / calendarTheme / totalContributions。
      judge: 悬停 GitHub 链接后能看到卡片，再悬停某个格子看到该日日期与次数；离开后卡片收起。
    - id: improve
      title: 手机和失败状态也能读
      action: 给卡片增加键盘和触摸入口；让外部数据读取显式区分加载、失败与真实零值，并写清统计时间范围。
      judge: 键盘或触摸能打开关闭；阻断请求后出现失败说明而不是把全零显示为真实贡献。
    - id: quiet
      title: 减少动效也能完成
      action: 保留GitHub 贡献悬浮卡的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；year 只改变底部年份文案，不会筛选那一年的数据；默认截取最近119天。即使传入 contributionsData，资料请求仍会发生；请求失败被静默处理，零格不等于确认没有贡献。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 数据与时间范围
      - username / contributionsData / year
      - year 是显示文本；需要年度数据时应实际筛选并同步总数。
    - - 跟随倾斜
      - enableLinkTilt / enableCardTilt / linkTiltMaxRotate / cardTiltMaxRotate
      - 链接与卡片分别控制，默认最大5度；作者示例关闭了卡片倾斜。
    - - 颜色与计数
      - themeScheme / calendarTheme / totalContributions
      - 颜色数组对应 level；自定义总数要说明与格子的统计范围。
  glossary:
    github-card-mechanism:
      title: 位置映射
      english: Position mapping
      kind: 行为与原理
      definition: 把指针在某个区域里的位置转换为角度、位移等反馈值。
      context: 鼠标相对链接或卡片中心的位置被映射为弹簧跟随的旋转角度。119个日期按7行排列，颜色深浅来自数据中的 level。
      parameter: username / contributionsData / year：year 是显示文本；需要年度数据时应实际筛选并同步总数。；enableLinkTilt / enableCardTilt / linkTiltMaxRotate / cardTiltMaxRotate：链接与卡片分别控制，默认最大5度；作者示例关闭了卡片倾斜。；themeScheme / calendarTheme / totalContributions：颜色数组对应 level；自定义总数要说明与格子的统计范围。
      judgment: year 只改变底部年份文案，不会筛选那一年的数据；默认截取最近119天。即使传入 contributionsData，资料请求仍会发生；请求失败被静默处理，零格不等于确认没有贡献。
---

## 拆解设计

### 它在做什么

页面挂载时读取用户资料与贡献数据；悬停链接展开卡片，移动鼠标可产生轻微倾斜，停在某一天的小格上显示日期和次数。

### 效果是怎么形成的

[[github-card-mechanism|位置映射]]：鼠标相对链接或卡片中心的位置被映射为弹簧跟随的旋转角度。119个日期按7行排列，颜色深浅来自数据中的 level。

### 接进项目时要注意什么

year 只改变底部年份文案，不会筛选那一年的数据；默认截取最近119天。即使传入 contributionsData，资料请求仍会发生；请求失败被静默处理，零格不等于确认没有贡献。

### 适合用在哪里

开发者简介、作品集个人链接、可补充阅读的作者资料。

### 什么时候不用

把贡献数量当作能力评分；需要精确年度统计却只改年份文本；把关键信息仅放在悬停层。

### 试一次，就会更懂

先悬停链接再移到小格子，比较两处反馈；对照源码确认 year 有没有参与网络请求或日期筛选。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

属于展示背景的辅助内容，可接在作者介绍附近；涉及外部数据与悬停，不能直接假设适合离线或触摸场景。
