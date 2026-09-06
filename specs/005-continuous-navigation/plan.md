---
tense: 'frozen'
describes: '连续导航实现方案'
status: 'in-progress'
amended-by: []
---

# 连续导航实现方案

## 技术决定与职责

使用已安装 Astro 7.3.1 ClientRouter，Layout启用fallback=swap并禁用默认过渡动画。保留相同文档环境，由框架处理HTML获取、标题/语言/head/body更新、滚动历史、资源准备与失败整页回退，不照搬 roadmap 的后端数据接口。

src/scripts/page-lifecycle.ts提供每次astro:page-load初始化和before-swap清理。explore.ts清理计时器、全局监听与旧搜索响应；detail.ts清理键盘/手势/hash监听并使用Astro navigate。Pagefind按语言保留独立实例，避免在同一JS环境内跨语言串用索引。

src/scripts/reading-prefetch.ts使用公开astro:prefetch API，自动观察每个列表前6个链接（可见300ms后才预取），不自动扩散到整个目录。其余链接按悬停/聚焦/触摸意图准备，搜索动态结果同样适用。每批自动候选最多6个而非承诺网络并发队列。目标仅本站作品详情，无外站或Pagefind资源；连接信息可用时遵守saveData/2g。框架与浏览器负责重复预取去重、HTTP缓存和失败后的普通导航。

public/_headers对zh/en公开页面设max-age=60,must-revalidate，使Safari fetch预取的已完成响应短暂可复用；哈希资源继续使用immutable长期缓存。原生prefetch曾失败或过期后不再次主动预取，实际点击正常加载，不承诺在途请求合并。

## 宪章检查与预算

仅Explore阅读与搜索生命周期，无新增npm依赖、服务、内容或UI改版。用户授权提高脚本预算：完成实现后按gzip实测值加合理余量，保留首页限制。无JS正常页面路径继续有效。桌面/手机Chromium和WebKit自动化分别报告，真机Safari需独立验收。

## 验证与交付

先为同文档连续导航、异步竞态、脚本重复监听、语言索引及预取写Playwright失败证据；再实现。覆盖缓存完成/过期/失败、禁用脚本、修饰键/外站、滚动历史、慢响应下连续点击。运行verify与budget，ego-browser体验并记录。代码、功能/系统说明、规格和索引同PR交付；当前branch以PR #3为基线，合并前同步其最终main，用户决定合并。

## PR工作台与经验复核

PR #4已建立，tasks.md为执行清单，更新PR进度和可体验预览。未发现直接相关失败经验，不追加条目。
