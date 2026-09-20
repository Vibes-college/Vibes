---
tense: 'frozen'
describes: '固定UI预览与现有站点边界的适配取舍'
status: 'in-progress'
amended-by: []
---

# 宿主适配决定

## 固定预览与CSP

包内HTML使用meta CSP允许内联脚本，但宿主HTTP策略更严格，且全站frame-ancestors和X-Frame-Options会拒绝嵌套。直接复制文件不能证明预览可运行。

使用实际构建预览的精确脚本哈希，并为固定预览路径写局部响应头：default-src none、无网络、无提交、无子框架、sandbox allow-scripts、frame-ancestors self。父页保持无unsafe-inline/eval脚本策略；不套用权限较宽的Paseo任意HTML载体。样式仅在此沙盒允许内联，复制的Tailwind样式不会进入站内正文。

## 容器与生命周期

宿主文章max-width为780px且裁切横向溢出，助手在宽屏占432px；包内按100vw计算的宽版会被裁切。只对带ui-topic的文章扩大宿主，短文保留阅读列，画廊使用实际可用容器宽度；通过同一布局变量在助手展开时调整。

原包的弹窗与固定选材栏属于第一章节，文章切页会隐藏祖先，定位也受容器影响。增强初始化将这些覆盖层挂在body并在离页时移除；静态图文保留原章节。沿现有页面生命周期清理，不在连续导航后重复初始化。

## 来源与验证

上游Git blob是文件身份，不是仓库commit；任务提供对应Git blobs API，普通链接用于人阅读。保留模板首屏节选和Vibes演示外壳的区别。包内许可中的错误替换用官方完整许可纠正；不将上游图片随HTML许可一起分发。

已有beUI回归仍覆盖组件交互，把载体移动到测试构建，避免为测试改变公开内容目录和搜索数量。独立包的截图和测试仅作参考，当前站点的CSP、阅读路径与发布必须重新取得证据。
