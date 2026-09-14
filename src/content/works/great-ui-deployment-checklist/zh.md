---
locale: zh
status: published
title: 分步状态清单
summary: 把一项长任务拆成清楚的步骤，让用户看到哪一步正在运行、已经完成或需要处理。
description: 把一项长任务拆成清楚的步骤，让用户看到哪一步正在运行、已经完成或需要处理。
previewText:
  eyebrow: 布局与卡片
  display: Deployment Checklist
  note: Great UI · 交互学习
learning:
  category: 布局与卡片
  classification:
    type: 组件
    purpose:
      - 状态反馈
    behavior:
      - 分步反馈
      - 状态切换
  placementHint: 导入、资料检查、构建等有明确步骤和真实执行结果的任务。
  changesHint: 把 runPipeline 改成接收真实步骤执行器，每项返回成功、跳过或错误原因；关闭或离开时处理取消，重试不得残留上一轮结果。
  preserve:
    - 启动演示，确认状态逐项变化，结束后重置并再次启动；不能把演示失败当成真实部署失败。
    - 任务标题、当前状态和需要处理的原因放在同一行附近，失败后提供明确的下一步。
  checks:
    - 启动演示，确认状态逐项变化，结束后重置并再次启动；不能把演示失败当成真实部署失败。
    - 分别让一个步骤成功、跳过和失败，核对提示与实际结果一致；重试后旧请求不能覆盖新状态。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 点击 Deploy Pipeline 后，清单逐项进入运行状态；演示每项等待2秒，步骤之间再等0.8秒，第4项跳过，第5项失败，最后可以重置再运行。 保留项目自己的内容与样式，先核对固定源码中的initialTasks / Task、runPipeline / setTasks、resetChecklist / isOpen。
      judge: 启动演示，确认状态逐项变化，结束后重置并再次启动；不能把演示失败当成真实部署失败。
    - id: improve
      title: 让状态对应真实执行
      action: 把 runPipeline 改成接收真实步骤执行器，每项返回成功、跳过或错误原因；关闭或离开时处理取消，重试不得残留上一轮结果。
      judge: 分别让一个步骤成功、跳过和失败，核对提示与实际结果一致；重试后旧请求不能覆盖新状态。
    - id: quiet
      title: 减少动效也能完成
      action: 保留分步状态清单的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；runPipeline 是固定延时演示，没有克隆、构建或部署能力；initialTasks 只改变初始任务，运行时仍按数字ID预设结果。接入必须用真实任务结果驱动状态。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 任务内容
      - initialTasks / Task
      - 定义ID、标题和说明；不要把示例中的数字ID视为业务规则。
    - - 真实执行
      - runPipeline / setTasks
      - 替换固定延时和预设第4、第5项分支，绑定真实异步结果与取消。
    - - 重试与关闭
      - resetChecklist / isOpen
      - 重试需处理旧请求，关闭面板与取消任务应有明确区别。
  glossary:
    deployment-checklist-mechanism:
      title: 任务状态
      english: Task state
      kind: 行为与原理
      definition: 以明确状态记录一个步骤处于等待、运行、完成或异常中的哪一阶段。
      context: 每个任务有 pending、running、success、skipped、failed 五种状态；图标与补充说明根据状态替换，说明区通过网格行高度展开。
      parameter: initialTasks / Task：定义ID、标题和说明；不要把示例中的数字ID视为业务规则。；runPipeline / setTasks：替换固定延时和预设第4、第5项分支，绑定真实异步结果与取消。；resetChecklist / isOpen：重试需处理旧请求，关闭面板与取消任务应有明确区别。
      judgment: runPipeline 是固定延时演示，没有克隆、构建或部署能力；initialTasks 只改变初始任务，运行时仍按数字ID预设结果。接入必须用真实任务结果驱动状态。
---

## 拆解设计

### 它在做什么

点击 Deploy Pipeline 后，清单逐项进入运行状态；演示每项等待2秒，步骤之间再等0.8秒，第4项跳过，第5项失败，最后可以重置再运行。

### 效果是怎么形成的

[[deployment-checklist-mechanism|任务状态]]：每个任务有 pending、running、success、skipped、failed 五种状态；图标与补充说明根据状态替换，说明区通过网格行高度展开。

### 接进项目时要注意什么

runPipeline 是固定延时演示，没有克隆、构建或部署能力；initialTasks 只改变初始任务，运行时仍按数字ID预设结果。接入必须用真实任务结果驱动状态。

### 适合用在哪里

导入、资料检查、构建等有明确步骤和真实执行结果的任务。

### 什么时候不用

只有单次瞬时动作的按钮、没有后端却宣称已经部署的演示。

### 试一次，就会更懂

点击启动，留意第4项和第5项总是出现相同结果；然后查看源码如何决定它们。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

可以接在表单或任务入口之后展示真实结果；本地工具路径已把该模式用于资料检查，没有执行外部部署。
