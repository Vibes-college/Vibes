---
locale: zh
status: published
title: Vibe Coding 网页动效与交互
summary: 从按钮、卡片到滚动与转场，看懂设计取舍，和 Agent 一起把合适的交互用进自己的网页。
description: 按学习路线入门，按十个分类查找参考。理解动效与组件行为，用真实内容练习，再观察结果、逐步打磨。
previewText:
  eyebrow: UI / UX
  display: 网页动效与交互
  note: 看懂设计 · 对齐 Agent · 做出体验
---

## 从一个真实任务开始

你不必先学会写组件代码。先看效果，判断它为什么适合你的页面，再把目标、内容和边界交给 Agent；实现后亲自操作，依据结果提出下一轮修改。

同一个案例会一起讲运动和行为：折叠问答既要展开得自然，也要决定是否允许同时读两段答案；按钮既要有反馈，也要让人分清正在处理、已经完成与执行失败。

本合集由 Vibes 组织学习说明，目前的独立案例来自 Great UI、beUI、Rare UI 和 MicroKit。每件保留原作、固定源码和许可，录屏用于观察参考；接到你的项目后仍需用真实内容与操作检查结果。

## 第一次学，先走这八站

从基础反馈开始，再逐步扩大到内容、导航和整页变化。默认顺序浏览按下面的路线起步；你也可以直接选择分类，或切换随机浏览寻找灵感。已经保存的浏览模式会继续保留。

1. [有层级的基础按钮](/zh/works/great-ui-button/) — 分清主次操作、等待与失败，让用户知道下一步。
2. [有分隔线反馈的图片卡](/zh/works/great-ui-card/) — 用轻微反馈提示内容入口，不让卡片与文字跳动。
3. [折叠问答](/zh/works/great-ui-accordion/) — 同时理解展开动画与单项、多项阅读的取舍。
4. [展开成面板的浮动导航](/zh/works/great-ui-floating-menu/) — 组织真实链接，把开关、手机与键盘使用一起考虑。
5. [分步状态清单](/zh/works/great-ui-deployment-checklist/) — 把真实任务的状态说清楚，区分等待、失败与恢复。
6. [滚动文字揭示](/zh/works/great-ui-text-reveal/) — 比较有无动效，判断它是否帮助读者理解这句话。
7. [错峰页面转场](/zh/works/great-ui-staggered-page-transition/) — 掌握遮挡、内容切换与揭开的顺序，控制导航等待。
8. [从一点展开的主题](/zh/works/great-ui-circular-theme-provider/) — 让运动回应触发位置，同时保持全站主题一致。

每站都可以换成自己的内容，让 Agent 做一次有明确目标的小改造。后面的分类提供不同场景与进一步比较；不需要把所有效果都塞进同一个页面。

## 01 按钮、链接与选择输入

先分清用户要执行什么、当前处于什么状态，再决定反馈的形状与强度。

- [有层级的基础按钮](/zh/works/great-ui-button/) — 操作层级与加载状态：把一个真实动作说清楚。
- [能搜索，也能确认的选择框](/zh/works/beui-combobox/) — 搜索、高亮与已选值：用真实候选完成一次选择。
- [就地展开的时长编辑器](/zh/works/rare-ui-duration-picker/) — 就地编辑与越界反馈，以及确认、取消、保存的区别。
- [有细节反馈的文字链接](/zh/works/great-ui-animated-link/) — 比较线条、填色与文字替换，保留清楚的链接目的。

延伸参考：[轻量立体按钮](/zh/works/great-ui-minimal-buttons/)、[带内发光的按钮](/zh/works/great-ui-aceternity-button/)。

## 02 菜单、导航与定位

帮助用户找到入口、辨认当前位置，并在打开与关闭之间保持清楚的层级。

- [展开成面板的浮动导航](/zh/works/great-ui-floating-menu/) — 容器展开与文字错峰如何解释导航层级。
- [按日期浏览的修订时间轴](/zh/works/great-ui-revision-timeline/) — 日期选择、当前位置与对应内容怎样保持一致。

延伸参考：[展开设置的浮动工具条](/zh/works/great-ui-floating-dock-menu/)、[黏连展开的圆形菜单](/zh/works/great-ui-radial-gooey-menu/)。

## 03 卡片、悬浮预览与人物展示

在有限空间里展示足够的信息；必要内容和操作不能只藏在鼠标悬停之后。

- [有分隔线反馈的图片卡](/zh/works/great-ui-card/) — 不改变布局的轻反馈，以及从内容摘要到真实入口。
- [带姓名提示的头像叠放](/zh/works/great-ui-avatar-stack/) — 头像重叠与姓名提示怎样兼顾紧凑和辨认。
- [悬停人物名单](/zh/works/great-ui-team-section/) — 桌面方向切换与手机完整展示怎样服务同一份人物内容。
- [GitHub 贡献悬浮卡](/zh/works/great-ui-github-card/) — 辅助预览的反馈、真实数据与失败边界。

延伸参考：[X 账号悬浮资料卡](/zh/works/great-ui-twitter-card/)、[滑出唱片的专辑卡](/zh/works/great-ui-vinyl-album-card/)、[Facebook 人物资料卡](/zh/works/great-ui-facebook-card/)、[Instagram 账号资料卡](/zh/works/great-ui-instagram-card/)、[LinkedIn 职业资料卡](/zh/works/great-ui-linkedin-card/)、[手机里的对话演示](/zh/works/great-ui-mobile-mockup/)、[笔记本里的对话演示](/zh/works/great-ui-macbook-mockup/)。

## 04 展开、切换与布局变化

让内容按任务出现，也让用户理解哪些内容展开了、哪些内容被替换。

- [折叠问答](/zh/works/great-ui-accordion/) — 单项或多项展开的阅读选择，与高度变化的节奏。

- [滑动指示的内容标签](/zh/works/microkit-sliding-content-tabs/) — 局部内容切换，以及中文、键盘和长短面板。

## 05 文字、图形与内容动效

用运动表达文字或图形的组织；真实内容、换行和最终可读性始终优先。

- [文字分行飞入](/zh/works/great-ui-split-line-fly-in/) — 文字分行与错峰，需要怎样适配中文和不同宽度。

延伸参考：[路径描画标志](/zh/works/great-ui-animated-path/)、[多语言引语切换](/zh/works/great-ui-multilingual-quote/)、[扰动字形的命令切换](/zh/works/great-ui-scrambled-install-command/)。

## 06 滚动与连续叙事

让滚动推进内容的出现与停留，检查阅读收益是否值得增加滚动距离。

- [滚动文字揭示](/zh/works/great-ui-text-reveal/) — 逐字揭示怎样跟随滚动，并让完整句子最终清晰可读。
- [随滚动飞入的卡片](/zh/works/great-ui-scroll-flying-cards/) — 安排入场、阅读停留与退场，比较普通列表的成本。

延伸参考：[滚动文字由模糊到清晰](/zh/works/great-ui-blur-scroll-reveal/)、[词语逐个聚焦](/zh/works/great-ui-word-focus-scroll/)、[沿曲线滚动的文字](/zh/works/great-ui-text-on-path-scroll/)。

## 07 图片、画廊与循环展示

用揭示或循环组织视觉材料，给触屏、键盘与需要停下来看的人保留入口。

- [按方向揭开的图片](/zh/works/great-ui-image-hover-reveal/) — 进入方向与裁切窗口怎样建立图片之间的联系。

延伸参考：[斜向循环图片墙](/zh/works/great-ui-diagonal-marquee-carousel/)、[从图像变成字符画](/zh/works/great-ui-pixel-to-ascii-image/)。

## 08 加载、进度与状态反馈

表达真实任务正在发生什么；循环动画、确定进度与分步结果承担不同职责。

- [分步状态清单](/zh/works/great-ui-deployment-checklist/) — 状态变化来自任务结果；失败时说明下一步。

延伸参考：[字符轨迹等待动画](/zh/works/great-ui-terminal-loader/)。

## 09 页面转场

先明确内容何时可以切换，再比较遮挡、方向和节奏；控制反复导航的成本。

- [错峰页面转场](/zh/works/great-ui-staggered-page-transition/) — 先遮住、再换内容、最后揭开，建立有秩序的变化。

延伸参考：[双帘开合转场](/zh/works/great-ui-curtain-page-transition/)、[交叉模糊转场](/zh/works/great-ui-cross-blur-page-transition/)、[交错插入转场](/zh/works/great-ui-interlocking-page-transition/)、[对称阶梯转场](/zh/works/great-ui-cascade-page-transition/)、[彩色边缘页面转场](/zh/works/great-ui-color-wipe-page-transition/)、[像素格溶解转场](/zh/works/great-ui-pixel-page-transition/)、[波浪节奏转场](/zh/works/great-ui-sine-wave-page-transition/)、[多层扫过转场](/zh/works/great-ui-sweep-page-transition/)、[百叶条带转场](/zh/works/great-ui-venetian-blinds-page-transition/)。

## 10 主题切换

先保证明暗状态和全站风格一致，再选择能回应操作的变化方式。

- [从一点展开的主题](/zh/works/great-ui-circular-theme-provider/) — 从操作位置扩散，连接局部触发与全页状态。

延伸参考：[沿方向扫开的主题](/zh/works/great-ui-swipe-theme-change/)、[模糊淡化的主题切换](/zh/works/great-ui-blur-fade-theme-transition/)、[分割展开主题](/zh/works/great-ui-split-theme-provider/)。

## 怎样和 Agent 一起学

看完一件案例，先回答三个问题：我的页面要完成什么任务？参考里哪一处值得保留？哪些地方必须适应我的内容和用户？

到「改造设计」选择这次要改善的目标，补充使用位置和要求，再生成给 Agent 的任务。任务会带上同一份说明、固定来源和检查要求。Agent 实现后，请它提供能操作的结果；你观察真实内容、手机布局、键盘和失败情况，指出具体不合适的地方，再决定是否继续调整。

需要把几件组合起来时，在「串联设计」从完整路径出发，查看它们各自承担什么、需要怎样衔接。一个效果没有帮助就省略，已有示例也不等于你的项目已经通过验证。

说明由 Vibes 编写。各来源许可分别保留，具体作者、固定源码和使用说明在每件案例中查看。
