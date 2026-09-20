---
tense: 'frozen'
describes: '开源UI指南的宿主接入与验证方案'
status: 'in-progress'
amended-by: []
---

# 开源UI指南实施计划

## 技术决定与职责

- 以用户包的src/features/ui-topic、TopicSection.astro及媒体为接入基线；保持Astro静态输出与TypeScript增强，不引入新依赖。公开来源记录、代码节选和许可留在public/ui-topic与public/licenses，数据只有一份维护来源。
- 预览仍为固定HTML、不透明源iframe；用构建期精确脚本哈希和局部HTTP响应策略适配现有CSP，直接打开预览也拒绝网络/表单/子框架。不要将演示策略扩到父页面。方案与取舍见research。
- ui-topic.css只影响此文章，画廊按宿主实际宽度布局；正文保持原有阅读列，助手并排时预留其占位。弹窗与方案入口移到合适的宿主层，避免祖先裁切及隐藏章节。
- client.ts沿现有页面生命周期清理监听、iframe、视频、图片URL和滚动锁；保留任务文本的错误退路。复用现有助手按钮，不修改原生助手内部。
- 原beUI回归使用仅测试构建输出的fixture，不把旧演示另发成新文章；生产预算仍覆盖新版文章全部资源。

## 宪章检查与预算

保持原文章身份、现有站壳、中文范围及不自动发送的边界。全量资产与JS按既有预算检查；源码和来源记录可审阅，不以缩减测试或放宽预算换取通过。包内许可和上游blob重新核对。

## 验证与交付

- 单元测试覆盖源码/许可/路径一致性、任务、HTML转义及局部响应策略；浏览器测试覆盖原页面目录、筛选、沙盒控件、参数、复制失败、选择编辑、图片拒绝、关闭焦点、离页重进、320px、减少动画与无JS。
- 本次涉及组件和构建/测试，运行完整verify与budget。独立审查围绕内容真实性、沙盒、页面生命周期、资源消耗及交付证明；修复后复核最终提交。
- 内置浏览器查看真实宿主，实际打开预览、选材及助手入口。保存本地原始证据在resources/evidence/017-open-source-ui-guide；真机iPhone未覆盖时明示。
- 同步article-read、content-maintenance、project-commands及对应系统说明，再据发布记录核验原地址与同版本资源。

## 交付引用

遵循docs/system/checks-and-release.md，PR记录动态进度。既有Wrangler中断经验继续使用统一串行Playwright和页面结束前网络空闲处理；阅读切页回跳仅按当前状态模型适配，不重新引入吸附或逐帧滚动。
