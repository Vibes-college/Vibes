---
locale: zh
status: published
title: 黏连展开的圆形菜单
summary: 点击中心按钮，几个图标向四周散开；圆之间的黏连效果让展开过程显得连续。
description: 点击中心按钮，几个图标向四周散开；圆之间的黏连效果让展开过程显得连续。
previewText:
  eyebrow: 菜单、导航与定位
  display: Radial Gooey Menu
  note: Great UI · 交互学习
learning:
  category: 菜单、导航与定位
  classification:
    type: 组件
    purpose:
      - 触发操作
    behavior:
      - 径向展开
      - 黏连滤镜
      - 位置跟随
  placementHint: 少量次级操作、空间充足的展示界面。
  changesHint: 收起时移除子项焦点，中心按钮加aria-expanded；为真实链接使用a，为操作使用button，加入Escape、焦点恢复和减少动态效果。
  preserve:
    - 点击中心按钮展开和关闭，五个图标位置不重叠；选中后的实际动作由项目明确提供。
    - 中心开关与菜单项可辨认，收起的控件不能悄悄接受键盘操作。
  checks:
    - 点击中心按钮展开和关闭，五个图标位置不重叠；选中后的实际动作由项目明确提供。
    - 仅用键盘完成展开、选择、关闭；关闭后Tab不会落到隐藏项，触摸目标不重叠。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 中心按钮切换开合，菜单项等角度分布在圆周上；鼠标移动时中心按钮会轻微跟随。预览五个图标没有业务操作。 保留项目自己的内容与样式，先核对固定源码中的items / radius、blur / RadialGooeyFilter、onItemSelect / item.onClick。
      judge: 点击中心按钮展开和关闭，五个图标位置不重叠；选中后的实际动作由项目明确提供。
    - id: improve
      title: 补齐可操作的菜单
      action: 收起时移除子项焦点，中心按钮加aria-expanded；为真实链接使用a，为操作使用button，加入Escape、焦点恢复和减少动态效果。
      judge: 仅用键盘完成展开、选择、关闭；关闭后Tab不会落到隐藏项，触摸目标不重叠。
    - id: quiet
      title: 减少动效也能完成
      action: 保留黏连展开的圆形菜单的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；关闭时子按钮只变透明，仍可能获得焦点；href虽存在于类型却未使用。没有自动选择后关闭、Escape或展开状态语义，必须补齐。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 菜单数量与距离
      - items / radius
      - 默认半径80px；项目越多，间距越小，要限制数量。
    - - 黏连强度
      - blur / RadialGooeyFilter
      - 默认模糊10，过大可能让图标模糊或增加绘制成本。
    - - 真实动作
      - onItemSelect / item.onClick
      - 目前只调用回调，href不会自动导航。
  glossary:
    radial-gooey-menu-mechanism:
      term: 'gooey-filter'
      context: SVG先模糊图形再增强透明度对比，形成类似液体连接；菜单位置由正弦和余弦按半径计算。
      parameter: items / radius：默认半径80px；项目越多，间距越小，要限制数量。；blur / RadialGooeyFilter：默认模糊10，过大可能让图标模糊或增加绘制成本。；onItemSelect / item.onClick：目前只调用回调，href不会自动导航。
      judgment: 关闭时子按钮只变透明，仍可能获得焦点；href虽存在于类型却未使用。没有自动选择后关闭、Escape或展开状态语义，必须补齐。
---

## 拆解设计

### 它在做什么

中心按钮切换开合，菜单项等角度分布在圆周上；鼠标移动时中心按钮会轻微跟随。预览五个图标没有业务操作。

### 效果是怎么形成的

[[radial-gooey-menu-mechanism|黏连滤镜]]：SVG先模糊图形再增强透明度对比，形成类似液体连接；菜单位置由正弦和余弦按半径计算。

### 接进项目时要注意什么

关闭时子按钮只变透明，仍可能获得焦点；href虽存在于类型却未使用。没有自动选择后关闭、Escape或展开状态语义，必须补齐。

### 适合用在哪里

少量次级操作、空间充足的展示界面。

### 什么时候不用

数量很多或必须立即发现的主导航，以及用图标隐藏难理解的动作。

### 试一次，就会更懂

先展开再收起，用Tab核对隐藏图标是否仍获得焦点；观察移动鼠标与点击开合的区别。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

可以作为操作入口，但不提供表单、导航结果或任务反馈；与其他紧凑菜单比较选择。
