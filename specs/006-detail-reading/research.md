---
tense: 'frozen'
describes: '详情滚动与手势取舍'
status: 'complete'
amended-by: []
---

# 详情滚动与手势取舍

## 两屏停靠

决定：文档根滚动，概览和正文入口使用proximity停靠，只有接近入口才辅助对齐；脚本在进入正文32px后切回普通滚动，回到入口恢复。区块至少一屏但允许内容增长。
理由：保留浏览器历史、锚点和无JS阅读，长正文作为一个大区块正常滚动。
替代：固定容器加嵌套滚动会使历史滚动恢复依赖新状态；逐次拦截wheel容易困住触控板和长正文，不采用。

验证差异：Chromium手机使用原生触摸、桌面使用wheel；Playwright手机WebKit没有原生wheel/滑动API，使用scrollTo验证CSS停靠及长正文可达。WebKit的scrollBy在本次复现中停在原始请求坐标，未吸附；对应[WebKit issue 293227](https://bugs.webkit.org/show_bug.cgi?id=293227)。不能把程序滚动验收当作真机手势验收。

方向过渡的裁切留在详情主元素，防止移动端动画临时越界改变视口并中断原生页面过渡；目录不受该样式影响。

## 跟手反馈

决定：单指横移明确后锁方向并显示对应边缘提示；空白长按按触点所在半屏提示，随后纵向跟随。达到横移阈值松手确认，短移或取消不跳转。
理由：参考视频显示边缘箭头随位置变化，不能从视频证明所有触发阈值，因此阈值属于本项目实现选择。多指、交互内容与系统边缘排除。
替代：长按立即跳转风险高；仅touchend切换缺少用户确认反馈。

## 阅读进度与章节目录

参考：[Rare UI Scroll Progress](https://www.rareui.com/components/scrollprogressindicator)，已读取页面代码面板。原版React/Motion通过尺寸弹簧、模糊淡入、逐项延迟与圆环弹簧形成手感。源码许可允许使用修改，保留组件来源注释。
决定：全部正文常显；使用原生DOM、SVG圆环和CSS/WAAPI还原上述核心动效，不安装React或Motion。接近正文时才初始化，避免封面首屏测量；仅尺寸切换时读取几何，正文边界由ResizeObserver缓存，滚动合并到requestAnimationFrame，弹簧静止后停止调度。减少动态偏好即时更新。正文外隐藏目录并不可聚焦，跳转保留原始锚点。
取舍：保留短时模糊与尺寸回弹以优先验证参考手感；与同机原构建比较体积、加载与滚动表现，不能承诺所有设备零性能变化。正文标题保持原文且降低字号，通用章节提供短导航名称，其余长名称在胶囊省略、目录换行并保留完整可访问名称。

## iPhone底部回弹

用户在iOS 26 Safari报告每次滚到底部后继续滑都会回到正文第一节。本地模拟WebKit的追加程序滚动未复现系统弹性回顶，不能宣称已复现真实iOS触摸；但旧实现会在整篇正文持续启用mandatory停靠。WebKit有[滚动停靠与rubber-banding相互影响的历史报告](https://bugs.webkit.org/show_bug.cgi?id=240235)，只作为排查线索，不当作本例根因的直接证明。

修正：进入正文后解除根滚动停靠，保留原生滚动与回弹；返回入口恢复停靠。不使用preventDefault拦截纵向触摸、不主动scrollTo纠偏。回归覆盖追加wheel/Chromium触摸/WebKit程序滚动、视口高度变化及返回入口；RED证明原实现仍强制停靠，不能替代真机问题复现。Cloudflare阶段预览供用户复测。

## 封面轻滑

用户在iPhone Safari报告封面轻微上滑就跳入正文。原实现使用mandatory，原生滑动终点由浏览器决定；改用proximity，允许中途停留，保留接近入口的吸附和真实向下锚点。[CSS Scroll Snap规范](https://www.w3.org/TR/css-scroll-snap-1/#scroll-snap-type)将具体吸附物理交由浏览器处理，不设置自定义纵向touch拦截或速度阈值。

桌面模拟的32px轻滑没有复现用户真机跳页，不能据此否定报告。回归额外检查停在封面45%处：旧mandatory会强制离开该位置，proximity保留自然位置；Chromium原生触摸与WebKit程序滚动分别检查，并保留原来的进入正文、末尾回弹与入口点击回归。iPhone Safari真机需用更新后的预览复测。
