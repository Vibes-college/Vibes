# UI / UX 共享术语库

从这里查词、沿用解释和收录新词。词条按基础概念及「技术工具 → 触发方式 → 动效类型 → UX规则」排列；同一词只保留一份通用解释，具体作品继续说明本例怎么用、调什么、如何判断。

已收录84个词条：26个来自上篇完整词条，9个整理自其基础概念与工具概述，49个来自现有作品的案例解释。后者包含描述性用语，不代表全部都是行业统一标准名称。原文没有详细展开的后续动效与UX规则，不归到作者名下。

[完整原文（保留下载文件原样）](sources/adrian-punk-motion-part-1.md) · [新增词条模板](_TEMPLATE.md) · [维护操作](../../../docs/features/content-maintenance.md)

原文作者：Adrian Punk；原文日期：2026-09-14；[原始来源](https://x.com/adrianpunk115/article/2099485951701721585)。原文图片仍是外部链接，没有下载或随站发布。每个摘录词条标记来源段落；「什么时候不用」及部分适用说明明确为Vibes补充。概述整理词条中除原文定义与工具分工外，分类、场景与提示词为Vibes整理；案例词条由Vibes维护。

## 怎样收录

1. 先按中英文名称和别名查重；同义词补aliases，不复制解释。含义不同的变体可以单独建词，并在说明中写清区别。
2. 复制模板到terms/<稳定英文ID>.md，填写来源、第一段解释、常见变体、适用与不用场景、提示词，并更新本页分类索引与收录数量。第一段只写一段纯文本，页面和任务直接共用；标题与元数据一致。
3. 来源写作者、原始链接、具体段落及整理方式。完整下载文章放sources，原样保留；收录者补充的内容标明身份，未核对的部分不冒充原文或公认定义。
4. 在作品的learning.glossary中填写term与本例context、parameter、judgment，正文继续用已有的[[局部ID|显示文字]]。不得在作品里再写一份通用definition。
5. 运行npm run content:validate及相应检查，核对页面、任务和影响到的翻译/组合证据，再通过GitHub PR审阅。改词条时复核引用它的所有作品；被引用ID不直接删除或改名。

## 基础概念

| 词条                                       | 英文        | 来源方式     |
| ------------------------------------------ | ----------- | ------------ |
| [用户界面](terms/ui.md)                    | UI          | 原文概述整理 |
| [用户体验](terms/ux.md)                    | UX          | 原文概述整理 |
| [用自然语言描述网页](terms/vibe-coding.md) | Vibe coding | 原文概述整理 |

## 技术工具

| 词条                          | 英文     | 来源方式     |
| ----------------------------- | -------- | ------------ |
| [CSS](terms/css.md)           | CSS      | 原文概述整理 |
| [Motion](terms/motion.md)     | Motion   | 原文概述整理 |
| [GSAP](terms/gsap.md)         | GSAP     | 原文概述整理 |
| [Three.js](terms/three-js.md) | Three.js | 原文概述整理 |
| [Lottie](terms/lottie.md)     | Lottie   | 原文概述整理 |
| [Rive](terms/rive.md)         | Rive     | 原文概述整理 |

## 触发方式

| 词条                                         | 英文                       | 来源方式       |
| -------------------------------------------- | -------------------------- | -------------- |
| [鼠标悬停](terms/hover.md)                   | Hover                      | 原文摘录与补充 |
| [键盘焦点](terms/focus.md)                   | Focus                      | 原文摘录与补充 |
| [点击、轻触与按住](terms/click-tap-press.md) | Click / Tap / Press        | 原文摘录与补充 |
| [指针位置、移动与距离](terms/pointer.md)     | Pointer                    | 原文摘录与补充 |
| [进入视口](terms/in-view.md)                 | In view / Scroll-triggered | 原文摘录与补充 |
| [跟随滚动进度](terms/scroll-linked.md)       | Scroll-linked              | 原文摘录与补充 |
| [拖拽、滑动与缩放手势](terms/gesture.md)     | Gesture                    | 原文摘录与补充 |
| [页面加载与路由切换](terms/load-route.md)    | Load / Route               | 原文摘录与补充 |
| [组件状态变化](terms/state-change.md)        | State change               | 原文摘录与补充 |
| [延时、自动播放与空闲](terms/timer-idle.md)  | Timer / Idle               | 原文摘录与补充 |

## 动效类型

| 词条                                                    | 英文                       | 来源方式       |
| ------------------------------------------------------- | -------------------------- | -------------- |
| [缓动](terms/easing.md)                                 | Easing                     | 原文摘录与补充 |
| [时长](terms/duration.md)                               | Duration                   | 原文摘录与补充 |
| [延迟](terms/delay.md)                                  | Delay                      | 原文摘录与补充 |
| [交错出现](terms/stagger.md)                            | Stagger                    | 原文摘录与补充 |
| [弹簧动画](terms/spring.md)                             | Spring                     | 原文摘录与补充 |
| [淡入与淡出](terms/fade.md)                             | Fade in / Fade out         | 原文摘录与补充 |
| [交叉淡化](terms/crossfade.md)                          | Crossfade                  | 原文摘录与补充 |
| [滑入与滑出](terms/slide.md)                            | Slide in / Slide out       | 原文摘录与补充 |
| [缩放进入与离开](terms/scale.md)                        | Scale in / Scale out       | 原文摘录与补充 |
| [模糊显现](terms/blur-reveal.md)                        | Blur reveal                | 原文摘录与补充 |
| [裁剪揭示](terms/clip-path-reveal.md)                   | Clip-path reveal           | 原文摘录与补充 |
| [蒙版显现](terms/mask-reveal.md)                        | Mask reveal                | 原文摘录与补充 |
| [擦除转场](terms/wipe-transition.md)                    | Wipe transition            | 原文摘录与补充 |
| [文字显现](terms/text-reveal.md)                        | Text reveal                | 原文摘录与补充 |
| [按行显现](terms/line-reveal.md)                        | Line reveal                | 原文摘录与补充 |
| [按词显现](terms/word-reveal.md)                        | Word reveal                | 原文摘录与补充 |
| [遮挡层](terms/overlay.md)                              | Overlay                    | 案例整理       |
| [位移](terms/translate.md)                              | Translate                  | 案例整理       |
| [内容切换时机](terms/view-swap.md)                      | View swap                  | 案例整理       |
| [高度动画](terms/height-transition.md)                  | Height transition          | 案例整理       |
| [滚动进度](terms/scroll-progress.md)                    | Scroll progress            | 案例整理       |
| [逐字揭示](terms/character-reveal.md)                   | Character reveal           | 案例整理       |
| [模糊](terms/blur.md)                                   | Blur                       | 案例整理       |
| [路径描画](terms/path-drawing.md)                       | Path drawing               | 案例整理       |
| [位置映射](terms/position-mapping.md)                   | Position mapping           | 案例整理       |
| [视图过渡](terms/view-transition.md)                    | View Transition            | 案例整理       |
| [滚动进度映射](terms/scroll-progress-mapping.md)        | Scroll progress mapping    | 案例整理       |
| [运动前缘](terms/leading-edge.md)                       | Leading edge               | 案例整理       |
| [方向感知切换](terms/direction-aware-transition.md)     | Direction-aware transition | 案例整理       |
| [分行测量](terms/line-measurement.md)                   | Line measurement           | 案例整理       |
| [聚焦区间](terms/focus-interval.md)                     | Focus interval             | 案例整理       |
| [沿路径文字](terms/text-on-a-path.md)                   | Text on a path             | 案例整理       |
| [差异动画](terms/diff-animation.md)                     | Diff animation             | 案例整理       |
| [成对遮罩](terms/paired-masks.md)                       | Paired masks               | 案例整理       |
| [交替位移](terms/alternating-translation.md)            | Alternating translation    | 案例整理       |
| [图层错峰](terms/layer-staggering.md)                   | Layer staggering           | 案例整理       |
| [随机错峰](terms/shuffled-staggering.md)                | Shuffled staggering        | 案例整理       |
| [波形时序](terms/wave-timing.md)                        | Wave timing                | 案例整理       |
| [距离时序](terms/distance-based-timing.md)              | Distance-based timing      | 案例整理       |
| [缩放原点](terms/transform-origin.md)                   | Transform origin           | 案例整理       |
| [背景滤镜](terms/backdrop-filter.md)                    | Backdrop filter            | 案例整理       |
| [多边形裁切](terms/polygon-clipping.md)                 | Polygon clipping           | 案例整理       |
| [覆盖半径](terms/covering-radius.md)                    | Covering radius            | 案例整理       |
| [黏连滤镜](terms/gooey-filter.md)                       | Gooey filter               | 案例整理       |
| [布局动画](terms/layout-animation.md)                   | Layout animation           | 案例整理       |
| [裁切窗口](terms/clipping-window.md)                    | Clipping window            | 案例整理       |
| [亮度映射](terms/luminance-mapping.md)                  | Luminance mapping          | 案例整理       |
| [局部层级](terms/local-stacking.md)                     | Local stacking             | 案例整理       |
| [无缝循环](terms/seamless-loop.md)                      | Seamless loop              | 案例整理       |
| [不改变布局的强调](terms/layout-preserving-emphasis.md) | Layout-preserving emphasis | 案例整理       |

## UX规则

| 词条                                             | 英文                     | 来源方式 |
| ------------------------------------------------ | ------------------------ | -------- |
| [减少动态效果](terms/reduced-motion.md)          | Reduced motion           | 案例整理 |
| [渐进披露](terms/progressive-disclosure.md)      | Progressive disclosure   | 案例整理 |
| [单项展开](terms/single-open-accordion.md)       | Single-open accordion    | 案例整理 |
| [任务状态](terms/task-state.md)                  | Task state               | 案例整理 |
| [操作层级](terms/action-hierarchy.md)            | Action hierarchy         | 案例整理 |
| [演示状态](terms/demonstration-state.md)         | Demonstration state      | 案例整理 |
| [内容状态切换](terms/content-state-change.md)    | Content state change     | 案例整理 |
| [悬浮资料](terms/hover-profile.md)               | Hover profile            | 案例整理 |
| [外部资料状态](terms/external-profile-state.md)  | External profile state   | 案例整理 |
| [装饰与语义](terms/decoration-and-semantics.md)  | Decoration and semantics | 案例整理 |
| [不确定进度](terms/indeterminate-progress.md)    | Indeterminate progress   | 案例整理 |
| [场景模型](terms/scenario-mockup.md)             | Scenario mockup          | 案例整理 |
| [物件隐喻](terms/object-metaphor.md)             | Object metaphor          | 案例整理 |
| [离散时间选择](terms/discrete-time-selection.md) | Discrete time selection  | 案例整理 |
| [状态一致性](terms/state-consistency.md)         | State consistency        | 案例整理 |
