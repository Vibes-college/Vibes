---
locale: zh
status: published
title: 扰动字形的命令切换
summary: 切换安装方式时，让命令中的字符短暂变化再还原，用局部动态强调文字已经更新。
description: 切换安装方式时，让命令中的字符短暂变化再还原，用局部动态强调文字已经更新。
previewText:
  eyebrow: 文字、图形与内容动效
  display: Scrambled Install Command
  note: Great UI · 交互学习
learning:
  category: 文字、图形与内容动效
  classification:
    type: 组件
    purpose:
      - 触发操作
    behavior:
      - 字符扰动
      - 差异强调
      - 复制反馈
  placementHint: 文档中的安装方式切换、配置命令示例。
  changesHint: 使用 smart 保留未变化的文本；等待复制承诺成功，失败则显示可选全文。命令从已验证项目配置生成，替换预览中的本机地址。
  preserve:
    - 切换包管理器后命令正确更新，复制内容是完整命令而不是正在扰动的字符。
    - 可执行文本由真实配置产生，复制结果与最终显示一致，动效不改变命令本身。
  checks:
    - 切换包管理器后命令正确更新，复制内容是完整命令而不是正在扰动的字符。
    - 连续切换后复制文本与当前选项一致；拒绝剪贴板权限时显示失败且仍可手动复制。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 选择包管理器后，由父组件提供新的完整命令；full 模式重播整段扰动，smart 模式只处理前后相同部分之外的差异。复制按钮复制完整原文。 保留项目自己的内容与样式，先核对固定源码中的installCommand / pkgManager / setPkgManager、animationVariant / scrambleIntervalMs、handleCopyInstall / onCopy。
      judge: 切换包管理器后命令正确更新，复制内容是完整命令而不是正在扰动的字符。
    - id: improve
      title: 只强调变化并可靠复制
      action: 使用 smart 保留未变化的文本；等待复制承诺成功，失败则显示可选全文。命令从已验证项目配置生成，替换预览中的本机地址。
      judge: 连续切换后复制文本与当前选项一致；拒绝剪贴板权限时显示失败且仍可手动复制。
    - id: quiet
      title: 减少动效也能完成
      action: 保留扰动字形的命令切换的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；复制处理没有等待 clipboard.writeText 成功就显示完成，需要增加失败分支。作者预览命令含 localhost 地址，只用于演示，不应照抄执行。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 真实命令
      - installCommand / pkgManager / setPkgManager
      - 父组件负责选项与命令一致性，组件不会自动推导安装命令。
    - - 扰动范围
      - animationVariant / scrambleIntervalMs
      - full 或 smart，默认每32毫秒推进，最长48步。
    - - 复制反馈
      - handleCopyInstall / onCopy
      - 应等待剪贴板写入成功再显示完成；失败时提供手动复制。
  glossary:
    scrambled-install-command-mechanism:
      term: 'diff-animation'
      context: 文本按字素分段，计时器逐步增加已揭示数量，未揭示字符暂时显示符号。最多48步避免长命令无限延长。
      parameter: installCommand / pkgManager / setPkgManager：父组件负责选项与命令一致性，组件不会自动推导安装命令。；animationVariant / scrambleIntervalMs：full 或 smart，默认每32毫秒推进，最长48步。；handleCopyInstall / onCopy：应等待剪贴板写入成功再显示完成；失败时提供手动复制。
      judgment: 复制处理没有等待 clipboard.writeText 成功就显示完成，需要增加失败分支。作者预览命令含 localhost 地址，只用于演示，不应照抄执行。
---

## 拆解设计

### 它在做什么

选择包管理器后，由父组件提供新的完整命令；full 模式重播整段扰动，smart 模式只处理前后相同部分之外的差异。复制按钮复制完整原文。

### 效果是怎么形成的

[[scrambled-install-command-mechanism|差异动画]]：文本按字素分段，计时器逐步增加已揭示数量，未揭示字符暂时显示符号。最多48步避免长命令无限延长。

### 接进项目时要注意什么

复制处理没有等待 clipboard.writeText 成功就显示完成，需要增加失败分支。作者预览命令含 localhost 地址，只用于演示，不应照抄执行。

### 适合用在哪里

文档中的安装方式切换、配置命令示例。

### 什么时候不用

自动执行未审核命令，或让扰动效果掩盖复制失败。

### 试一次，就会更懂

在 full 与 smart 间比较相同前后缀是否保持稳定；复制后粘贴到普通文本区核对，不运行命令。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

可承担文档的复制操作，但它不是表单输入或命令执行器；完整工具路径仍需要真实执行与结果。
