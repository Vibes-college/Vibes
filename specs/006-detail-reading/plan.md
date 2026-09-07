---
tense: 'frozen'
describes: '详情交互实施方案'
status: 'in-progress'
amended-by: []
---

# 详情交互实施方案

## 技术决定与职责

沿用Astro、TypeScript、原生details及Heroicons静态资源，无新增依赖。
WorkDetail.astro负责顶部真实导航、边缘提示和封面下滑入口；正文不显示引导语和末尾原站入口；作品路由给章节添加图标与正文容器，第一章默认展开。
detail.css负责文档级两屏scroll-snap、导航与阅读排版；detail-gestures.ts负责触摸/鼠标长按与横向方向锁定，detail-disclosure.ts负责可取消展开动画；detail.ts保留键盘、历史和锚点生命周期。

## 宪章检查与预算

只改详情体验及其测试和说明，不改内容语言状态或Explore。采用正常文档滚动加两处停靠点，避免固定高度容器裁切长内容及破坏历史。原生边缘触摸留给浏览器。动画尊重减少动态偏好，脚本监听随页面离开清理。

## 验证与交付

tests/explore.spec.ts与navigation.spec.ts验证新详情行为及原目录历史；verify和budget为必要检查。内置浏览器核对桌面/手机与参考；原始截图与报告在resources/evidence/006-detail-reading。同步article-read及受影响系统说明源码对应。

## PR工作台与经验复核

PR #6维护进度，阶段推送；spec/tasks完成状态以真实验证为准。复用005返回目录滚动回归。用户决定合并，阶段预览与正式部署分开。
