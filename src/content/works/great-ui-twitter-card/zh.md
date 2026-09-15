---
locale: zh
status: published
title: X 账号悬浮资料卡
summary: 鼠标停在X链接上方时展示资料卡，也能改成常驻卡片，给作者链接补充背景。
description: 鼠标停在X链接上方时展示资料卡，也能改成常驻卡片，给作者链接补充背景。
previewText:
  eyebrow: 社交卡片
  display: Twitter(X) Card
  note: Great UI · 交互学习
learning:
  category: 社交卡片
  classification:
    type: 组件
    purpose:
      - 作品展示
    behavior:
      - 悬浮展开
      - 外部资料
      - 常驻变体
  placementHint: 允许读取外部公开资料的作者简介或联系页。
  changesHint: 显式记录加载、失败和更新时间，校验外部链接；取消旧请求或按账号版本忽略过期响应，常驻模式支持本地完整资料。
  preserve:
    - 悬停X链接查看实际显示；记录数据加载情况，不能将默认0值视为已核实统计。
    - 账号地址与资料一致，加载和失败状态不伪装成真实资料。
  checks:
    - 悬停X链接查看实际显示；记录数据加载情况，不能将默认0值视为已核实统计。
    - 阻断请求出现失败提示而不是0值；快速换账号不会显示前一个账号的资料，键盘和触摸能取得核心信息。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 挂载时从api.fxtwitter.com读取用户资料，成功后替换初始姓名、头像和计数；悬停展开卡片，staticCard模式直接显示。 保留项目自己的内容与样式，先核对固定源码中的username / profile / useEffect、staticCard / enableCardTilt、name / avatarUrl / joinedDate / year。
      judge: 悬停X链接查看实际显示；记录数据加载情况，不能将默认0值视为已核实统计。
    - id: improve
      title: 让资料失败可见且可恢复
      action: 显式记录加载、失败和更新时间，校验外部链接；取消旧请求或按账号版本忽略过期响应，常驻模式支持本地完整资料。
      judge: 阻断请求出现失败提示而不是0值；快速换账号不会显示前一个账号的资料，键盘和触摸能取得核心信息。
    - id: quiet
      title: 减少动效也能完成
      action: 保留X 账号悬浮资料卡的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；失败被静默处理，0关注数或默认简介可能只是未加载；请求没有取消及过期结果保护。bannerUrl虽然在接口声明中出现，实际没有被读取。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 账号与来源
      - username / profile / useEffect
      - 第三方请求与账号绑定，换用户名需取消或忽略旧响应。
    - - 呈现方式
      - staticCard / enableCardTilt
      - 常驻模式无须悬停，但仍会读取外部资料。
    - - 备用信息
      - name / avatarUrl / joinedDate / year
      - 只是初始或缺失时的备用值，bannerUrl属性没有实际实现。
  glossary:
    twitter-card-mechanism:
      term: 'external-profile-state'
      context: 外部请求负责资料，鼠标位置负责弹簧跟随与倾斜；staticCard只改变呈现方式，并不关闭请求。
      parameter: username / profile / useEffect：第三方请求与账号绑定，换用户名需取消或忽略旧响应。；staticCard / enableCardTilt：常驻模式无须悬停，但仍会读取外部资料。；name / avatarUrl / joinedDate / year：只是初始或缺失时的备用值，bannerUrl属性没有实际实现。
      judgment: 失败被静默处理，0关注数或默认简介可能只是未加载；请求没有取消及过期结果保护。bannerUrl虽然在接口声明中出现，实际没有被读取。
---

## 拆解设计

### 它在做什么

挂载时从api.fxtwitter.com读取用户资料，成功后替换初始姓名、头像和计数；悬停展开卡片，staticCard模式直接显示。

### 效果是怎么形成的

[[twitter-card-mechanism|外部资料状态]]：外部请求负责资料，鼠标位置负责弹簧跟随与倾斜；staticCard只改变呈现方式，并不关闭请求。

### 接进项目时要注意什么

失败被静默处理，0关注数或默认简介可能只是未加载；请求没有取消及过期结果保护。bannerUrl虽然在接口声明中出现，实际没有被读取。

### 适合用在哪里

允许读取外部公开资料的作者简介或联系页。

### 什么时候不用

必须离线、必须实时准确、或把第三方资料当作官方认证的场景。

### 试一次，就会更懂

比较悬浮与常驻模式，留意常驻并不等于离线；核对显示用户名与资料来源。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

在允许外部数据时可作为展示补充；与GitHub卡片类似，需要额外的数据失败和输入方式适配。
