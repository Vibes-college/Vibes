---
tense: 'frozen'
describes: '详情交互实施方案'
status: 'complete'
amended-by: []
---

# 详情交互实施方案

## 技术决定与职责

沿用Astro、TypeScript、原生DOM与Web Animations及Heroicons静态资源，无新增依赖。
WorkDetail.astro负责顶部真实导航、边缘提示和封面下滑入口；正文不显示引导语和末尾原站入口；作品路由保留章节容器与完整标题，全部正文展开；ReadingProgress.astro提供正文目录与圆环。
detail.css负责独立页面显隐、导航与阅读排版；detail-paging.ts以当前页状态管理纵向切页，72px位移门槛、280ms位移淡入、键盘及wheel等价操作；不使用scroll-snap或逐帧scrollTo，长正文使用文档原生滚动；detail-gestures.ts负责触摸/鼠标长按与横向方向锁定，两者共用交互内容排除规则，reading-progress.ts负责进度弹簧、目录尺寸过渡、可取消文字切换与交互；detail.ts延后到接近正文才初始化进度组件，并保留键盘和历史生命周期，正文锚点使用真实链接。

## 宪章检查与预算

只改详情体验及其测试和说明，不改内容语言状态或Explore。采用正常文档滚动加两处停靠点，避免固定高度容器裁切长内容及破坏历史。原生边缘触摸留给浏览器。动画尊重减少动态偏好，脚本监听随页面离开清理。

## 验证与交付

tests/explore.spec.ts与navigation.spec.ts验证新详情行为及原目录历史；verify和budget为必要检查。内置浏览器核对桌面/手机与参考；原始截图与报告在resources/evidence/006-detail-reading。同步article-read及受影响系统说明源码对应。

## PR工作台与经验复核

PR #6维护进度，阶段推送；spec/tasks完成状态以真实验证为准。复用005返回目录滚动回归。用户决定合并，阶段预览与正式部署分开。
