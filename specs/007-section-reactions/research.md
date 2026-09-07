---
tense: 'frozen'
describes: '表情动画与加载取舍'
status: 'in-progress'
amended-by: []
---

# 参考与取舍

已查看[Rare UI Emoji Reaction](https://www.rareui.com/components/emojireaction)的可操作页面和源码面板。原版使用React、Motion、react-apple-emojis与Radix；默认5个表情，每批5粒、长按间隔550ms、最多60粒，飞行1.4–1.8s、错开发射250ms、距离约450px。顶部空间不足时工具条下翻；本功能进一步让第一章粒子向下飞。

默认图片源直接请求返回403，不绕过访问限制。本实现用系统emoji（iPhone为Apple图形），避免远端图片请求和字体依赖，其他系统图形可能不同。按钮复用参考的微笑加号SVG几何并记录来源。

采用原生DOM与Web Animations/CSS复现运动，弹层放在顶层以避免详情overflow裁切。只保存当前浏览器的选择，后续公共统计是新的后端需求，不提前建服务。

既有全站脚本gzip预算15,000B、基线14,932B；用户允许小幅放宽后调整为19,000B，仍统计所有延迟块，不排除动画文件。首页与原交互源码预算保持。用户进一步选择正文空闲预加载：先等整页完成与正文可见，停留1.5秒后requestIdleCallback（3秒超时，无此API则直接准备），省流量模式仅点击，提前点击立即请求。菜单只在点击时创建。未开始的定时准备在后台、离开正文或换页取消。

## 弱网络与构建边界

增加第二个动态模块后，构建开始为搜索目标生成modulepreload。本地WebKit在中断请求后，即使普通刷新也不再请求该资源，旧版5a2d9c4同一测试通过；现象与[WebKit 270357](https://bugs.webkit.org/show_bug.cgi?id=270357)记录一致。Astro客户端构建通过Vite的configEnvironment筛掉动态目标自身的modulepreload，保留依赖并行准备和原生import请求；不关闭全部预加载，也不修改搜索业务或跳过失败测试。调整后原有失败下载再重试测试恢复通过。表情模块由入口传入本地保存函数，避免延迟模块反向导入页面入口。

## 实测范围

2026-09-06本地构建全站全部JS为17,924B gzip（包含延迟搜索与表情模块），低于19,000B；表情菜单与动画块2,101B。详情首开的实测脚本请求对应gzip合计11,719B，5a2d9c4静态依赖合计10,370B，增加1,349B；还增加少量标题HTML、图标与CSS，因此不宣称首屏零开销。

一次本机Chromium iPhone 13模拟采样：停在封面1.8秒未请求表情模块，进入正文后空闲准备；工具条打开耗时44ms（包括自动化往返），动画P95帧间隔16.7ms，采样97帧、无超过33.4ms间隔，结束后粒子为0。未做设备降速，且同机运行其他检查，不能代表真实iPhone或弱网络保证；原始数据在resources/evidence/007-section-reactions/performance.json。
