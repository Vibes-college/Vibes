---
tense: 'frozen'
describes: '独立样式与Markdown编译的取舍'
status: 'complete'
amended-by: []
---

# 技术取舍

## 决定与理由

使用官方 @prose-ui/style，以官网packages/react/src/mdx的结构作为原生HTML输出契约。源码的CSS包含组件样式，但不负责语法识别和交互，因此编译时转换扩展，浏览器仅增强Tabs/代码组/复制/图片。

当前Astro 7.3.1默认Sätteri；实际配置校验明确要求 @astrojs/markdown-remark 才能运行remark/rehype。依赖授权记录在PR，禁止配置看似有效但插件未执行。

参考 https://prose-ui.com/ 、https://prose-ui.com/docs/styling 及官方GitHub源码。核对全部docs/components与demo文件，不能只依赖overview（它遗漏Tabs/CodeGroup/Math）。

## 替代方案

Tailwind Typography有独立默认值，不能直接得到目标样式；React全套带入不必要运行时。仅手写HTML示例不能满足作者继续写Markdown的路径。

## 明确差异

保持现有网站浅色外壳，局部明暗对照演示主题。Next Image专用优化不作为CSS能力承诺；Astro侧图片保留尺寸、懒加载、放大与链接行为。语法采用Markdown directives而非MDX JSX。

## 覆盖边界

覆盖全部公开内容组件、枚举视觉变体及操作状态；不穷举无限CSS token组合，保留token与not-prose示例。Steps覆盖base/h1–h6，Callout五色×有无标题，CodeGroup含文件/语言/仅语言及同步，Tabs支持同组同步。

## 阅读色彩与中文字体

用户要求采用Arena截图的阅读底色。PNG主要像素为RGB(252,251,248)，文字为RGB(46,43,41)；浏览器实测Arena和本地中文均为PingFang SC Regular。选择暖白#FCFBF8配暖灰#2E2B29，明确中文苹方回退；保留原版组件语义色和局部明暗样本。拉丁字体继续采用Prose UI官网Geist，不另加载大型中文字体。

## 脚本预算

沿用户允许小幅放宽预算的决定，总JS gzip上限设为21000字节，包含复制、标签与图片增强，全部延迟模块仍计入；首页HTML与原交互源码限制不变。

## 编译缓存

实测仅修改本地remark/rehype插件时，Astro内容摘要可继续命中旧HTML（复制图标wrapper仍为旧span）。使用官方build --force全量刷新内容编译缓存，避免维护者改渲染器或图片后发布旧结构；不自行增加散列缓存层。构建速度以实际检查结果评估，开发服务改编译器后重启。

## 本地测试代理断连

整套测试多次在页面关闭附近出现ProxyController/Network connection lost，继而本地服务退出。单独手机与60秒缓存专项通过；上游[workers-sdk #15317](https://github.com/cloudflare/workers-sdk/issues/15317)记录同类代理将中断响应作为致命错误。测试共用fixture在关闭页面前等待有限静态资源结束，10秒仍未空闲则失败；保留全部用例、断言与零重试，不修改Wrangler源码或掩盖服务退出。
