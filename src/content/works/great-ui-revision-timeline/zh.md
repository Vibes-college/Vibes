---
locale: zh
status: published
title: 按日期浏览的修订时间轴
summary: 点击日期刻度或前后按钮切换一份记录，当前日期居中，附近刻度升高帮助定位。
description: 点击日期刻度或前后按钮切换一份记录，当前日期居中，附近刻度升高帮助定位。
previewText:
  eyebrow: 布局与卡片
  display: Revision Timeline
  note: Great UI · 交互学习
learning:
  category: 布局与卡片
  classification:
    type: 组件
    purpose:
      - 作品展示
    behavior:
      - 日期选择
      - 定位平移
  placementHint: 少量发布记录、项目里程碑或按日归档的内容。
  changesHint: 定义时区和同日记录规则，修复硬编码补位，限制跨度；正文链接校验协议、长内容可读到底，受控选择正确回写，静态模式直接切换。
  preserve:
    - 按原作的展示或切换方式观察日期选择，核对内容和结束状态；记录未覆盖的变体。
    - 主要内容与操作结果不依赖装饰动画才能取得。
  checks:
    - 按原作的展示或切换方式观察日期选择，核对内容和结束状态；记录未覆盖的变体。
    - 跨月跨年、同日多条、非法日期和空数组不误导；首尾按钮状态正确，受控点击确实换记录，底部正文不被渐隐永久遮住。
    - 键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。
    - 减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。
  goals:
    - id: faithful
      title: 保留原作核心行为
      action: 数据先排序，同一天只保留time字符串较晚的一项；默认选最新记录，点击有效刻度或箭头切换正文。 保留项目自己的内容与样式，先核对固定源码中的revisions / getSortedUniqueRevisions、defaultActiveId / onActiveIdChange、pastPaddingDays / futurePaddingDays / height。
      judge: 按原作的展示或切换方式观察日期选择，核对内容和结束状态；记录未覆盖的变体。
    - id: improve
      title: 让时间轴准确可浏览
      action: 定义时区和同日记录规则，修复硬编码补位，限制跨度；正文链接校验协议、长内容可读到底，受控选择正确回写，静态模式直接切换。
      judge: 跨月跨年、同日多条、非法日期和空数组不误导；首尾按钮状态正确，受控点击确实换记录，底部正文不被渐隐永久遮住。
    - id: quiet
      title: 减少动效也能完成
      action: 保留按日期浏览的修订时间轴的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；defaultActiveId实际上进入受控模式，必须配回调更新。补位日期硬编码May与July 2026；title和author未直接显示，不能当完整版本审计。长日期跨度会生成大量节点。
      judge: 打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。
  adjustments:
    - - 记录与同日策略
      - revisions / getSortedUniqueRevisions
      - 日期需合法，time用可排序格式，同日多记录会合并为最后一项。
    - - 当前选择
      - defaultActiveId / onActiveIdChange
      - 传入ID后由父组件负责更新，不是一次性的默认值。
    - - 可见范围
      - pastPaddingDays / futurePaddingDays / height
      - 补位日期需按真实边界生成，长跨度使用分页或窗口化。
  glossary:
    revision-timeline-mechanism:
      title: 离散时间选择
      english: Discrete time selection
      kind: 行为与原理
      definition: 通过可选时间点浏览一份对应内容，空日期只提供间隔不提供记录。
      context: 日期范围被补成每日刻度，平移让当前项居中，附近条高按距离衰减；正文用有限的Markdown规则逐行呈现。
      parameter: revisions / getSortedUniqueRevisions：日期需合法，time用可排序格式，同日多记录会合并为最后一项。；defaultActiveId / onActiveIdChange：传入ID后由父组件负责更新，不是一次性的默认值。；pastPaddingDays / futurePaddingDays / height：补位日期需按真实边界生成，长跨度使用分页或窗口化。
      judgment: defaultActiveId实际上进入受控模式，必须配回调更新。补位日期硬编码May与July 2026；title和author未直接显示，不能当完整版本审计。长日期跨度会生成大量节点。
---

## 拆解设计

### 它在做什么

数据先排序，同一天只保留time字符串较晚的一项；默认选最新记录，点击有效刻度或箭头切换正文。

### 效果是怎么形成的

[[revision-timeline-mechanism|离散时间选择]]：日期范围被补成每日刻度，平移让当前项居中，附近条高按距离衰减；正文用有限的Markdown规则逐行呈现。

### 接进项目时要注意什么

defaultActiveId实际上进入受控模式，必须配回调更新。补位日期硬编码May与July 2026；title和author未直接显示，不能当完整版本审计。长日期跨度会生成大量节点。

### 适合用在哪里

少量发布记录、项目里程碑或按日归档的内容。

### 什么时候不用

保留每次变更的审计日志、跨度很长的历史数据、把内置解析器当完整MDX执行器。

### 试一次，就会更懂

从最新一天向前浏览，观察没有记录的日期不可选；核对同一天两条记录是否都保留。

## 改造设计

选择你要改善的目标，再按实际项目填写接入位置与要求。修改后，用对应的检查确认结果。

## 串联设计

承担内容展示这一环节；业务动作、数据和异常仍由完整路径负责。
