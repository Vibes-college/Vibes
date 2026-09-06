---
tense: 'frozen'
describes: '路由与Safari缓存取舍'
status: 'in-progress'
amended-by: []
---

# 路由与Safari缓存取舍

## 参考证据

2026-09-06在ego-browser从roadmap.sh/guides点击network-engineer/websocket-vs-http：performance.timeOrigin未变，请求文章.data，约130ms完成，标题约172ms插入。当前部署已不等同本地Astro参考快照；不把节点弹层等同文章导航，也不把电脑计时说成iPhone结果。

Astro官方：[页面切换](https://docs.astro.build/en/guides/view-transitions/)、[预取](https://docs.astro.build/en/guides/prefetch/)。本地核对node_modules/astro/components/ClientRouter.astro、dist/transitions/router.js、dist/prefetch/index.js。独立只读研究复核了生命周期、缓存及预算边界。

## 决定与理由

- 复用ClientRouter而非自写路由或内存HTML loader：默认实现已处理历史、资源、重定向与失败。替换loader容易漏掉样式准备、noscript清理和目标可导航校验。
- 公开HTML短缓存60秒：Safari可能不支持link prefetch而回退fetch，原有max-age=0要求重新验证。60秒减少完成预取后的再次网络等待，代价是正常导航可能短暂看到旧发布内容；不是离线保障。直接刷新、过期后按HTTP规则验证。哈希资源继续长期缓存。
- 自动只准备前6个可见目标，其余按用户意图：不依赖手机hover，也不提前下载全部目录。浏览器未暴露连接信息时不能识别Safari省流量，只能限制候选数量。
- Astro预取API不返回完成Promise，内部Set只去重，不是我们自己的HTML内存缓存。失败和60秒过期后不主动重试，点击由默认loader读取；进行中的预取与点击可能重复请求。验收不把这些情况描述成零网络。
- 初步实际构建为10,866 B gzip，超过旧10,000 B。用户明确授权按最终实现提高门槛；不改成自写路由只为少几个字节，不取消预算。最终本地构建JS为12,696 B gzip，设15,000 B门槛留约18%余量；首页9,375 B和交互源码9,681 B分别低于保留的40,000/12,000 B限制。

## 未采用方案

不引入React、Service Worker、独立内容接口、整站预渲染或无限缓存。无额外业务实体、接口合约或quickstart产物；验证路径写plan/tasks即可。

## WebKit验证环境

Playwright临时context无磁盘缓存，不能用它验证普通Safari的HTTP磁盘缓存收益。独立本机HTTP实验确认：相同60秒Cache-Control下，临时WebKit三次fetch发出三次服务器请求，持久化空profile只发出一次；后两次磁盘命中仍报告transferSize=300、encodedBodySize=0。原生prefetch不消费正文不是此实验的原因，显式text()也有相同行为。

自动化缓存用例采用测试独立空profile；临时context继续验收连续导航及失败回退。未读取用户Safari数据，未把WebKit视作真机iPhone。原生方案在缓存不可用时可能再请求正文，仍通过ClientRouter保持文档环境；不为了该测试环境引入自定义HTML loader。
