---
tense: 'frozen'
describes: 'Paseo原生助手版本与加载技术取舍'
status: 'in-progress'
amended-by: []
---

# Paseo原生助手版本与加载技术取舍

## R1 固定版本与两候选

**决定**：官方v0.7.2，提交`9400a49af670fdb5db4af58e73f8df98588dbea9`。只比较完整WebUI按需加载与构建精简；两者共同延后整个助手并减少更新工作。不继承011实现，PR #10保持暂停。

**理由与证据**：2026-09-08核对官方release与固定源码。发布说明包含手机流式输出、复杂diff及超长消息修复；这是选版理由，不是当前设备验收。源码在本任务`.scratch/paseo-v0.7.2`只读克隆，HEAD核对一致，未安装、构建或运行。旧项目4.79 MB gzip和功能归因只供排查方向，新版必须重新建立基线。

**替代方案**：旧fork有定制挂载便利，但版本与上游修复不同；assistant-ui + SDK已被用户排除。当前daemon0.5.0与新版WebUI的运行兼容性留给G0；主实验优先同版daemon独立实例，两个候选固定一致，不把服务端升级效果归因于前端。

来源：[官方发布说明](https://github.com/getpaseo/paseo/releases/tag/v0.7.2)、[固定源码](https://github.com/getpaseo/paseo/tree/9400a49af670fdb5db4af58e73f8df98588dbea9)。

## R2 保留Metro构建，先做生产拆包探针

**决定**：沿官方Expo54/Router6/Metro生产导出，优先用已有`PASEO_WEB_PLATFORM`覆盖能力构建两个配置。先验证Mermaid动态边界，成功再铺开；不先搬到Vite，也不手改导出JS。

**理由与证据**：`packages/app/package.json`的`build:web`先构建工作区依赖，再`expo export --platform web`；`app.config.js:134-137`的`web.output: single`表示SPA输出，不代表只有一个JS文件。`metro.config.cjs:54-76`支持自定义web扩展覆盖，且34-39固定React解析。Expo54官方文档确认生产web支持动态import拆包，但项目残留静态引用、资源前缀和实际网络时机仍需实测。

**替代方案**：一次性迁移构建器增加原生模块、别名、Router和样式兼容工作；仅加React.lazy或仅隐藏面板无法证明模块退出入口闭包。框架能力已确认，具体生产结果是有明确成功/失败条件的G2任务，不伪称已完成。

来源：[Metro配置](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/metro.config.cjs)、[Expo54拆包文档](https://docs.expo.dev/versions/v54.0.0/config/metro/)。

## R3 接入先验证，运行所有权完整保留

**决定**：G1先验证受控模块入口及外层history隔离；若需侵入核心路由/providers，则验证同源独立文档容器，按计划门槛择一。两个功能候选共享接入结果；旧fork的`mountPaseoApp`仅作经验，不能声称官方已提供。

**理由与证据**：`packages/app/index.ts:1-11`初始化polyfill和Unistyles后进入`expo-router/entry`，官方app中未找到挂载API。`src/runtime/host-runtime.ts:2377-2393`保持模块/globalThis单例；`src/app/_layout.tsx:269-321,376-388,667`分别承担ManagedDaemonSession/SessionProvider、bootstrap及HostSessionManager。保留SDK单例却卸掉provider并不等于保留完整运行机制。

`src/contexts/session-context.tsx:253-312`共同管理focused agent/terminal、viewed timeline、恢复核对、活动与push。`src/utils/app-visibility.ts:14-44`只看AppState/document/focus，所以宿主CSS隐藏不能自动代表上游后台状态，必须有显式展示信号。

**替代方案**：直接重复挂载根、宿主自建连接、只靠display:none或把整个根随弹层卸载都会使所有权或后台成本不明。iframe保留路由的收益要与Astro导航是否重载、焦点、消息桥和CSP代价实测比较；它不保证连接稳定。

来源：[官方入口](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/index.ts)、[根布局](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/app/_layout.tsx)、[可见性](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/utils/app-visibility.ts)。

## R4 外围功能按真实依赖切分

**决定**：先拆图表，再面板注册与重实现，再处理共享语法、语言、图标；B在A相同边界上构建排除，功能差异明确列出。按需加载与卸载运行资源分别验收。

| 功能        | 固定版本源码证据（相对packages/app，另注明者除外）                                                                                     | 对计划的约束                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Mermaid     | `src/components/markdown/fence/index.tsx:4,12`，`mermaid/host.web.tsx:11,95`，`mermaid/build-runtime.mjs:12-19,69-75`                  | 当前静态携带生成HTML字符串，须把重实现置于异步边界；保留原隔离与桥接校验                                   |
| 终端/编辑器 | `src/panels/register-panels.ts:9-38`，`src/terminal/runtime/terminal-emulator-runtime.ts:1-9`，`src/file-pane/editor/view.web.tsx:2-9` | 同步注册列表分离元数据和重实现；审计路径点击、旧保存布局、草稿与回退                                       |
| 语法        | `src/utils/highlight-cache.ts:1-6,18-21,45`，仓库`packages/highlight/src/parsers.ts:1-23`                                              | 聊天/工具/预览共用；删编辑器不等于删解析器；已有100k退化与LRU，不盲目重复实现                              |
| 语言        | `src/i18n/i18next.ts:4-12,21-30`                                                                                                       | 九语言静态导入；A按需保留，B中英及回退                                                                     |
| 图标        | `src/plugins/icons.ts:2,6-18`                                                                                                          | namespace+Reflect.get支持插件动态图标，A不能用固定白名单偷偷破坏兼容；B未知图标给具名回退且不影响工具/审批 |
| 运行资源    | `src/components/terminal-pane.tsx:548-572`，`src/terminal/runtime/terminal-emulator-runtime.ts:548-606`                                | 已有controller/renderer dispose；验证隐藏、卸载、重新打开的差别，UI卸载不得结束远端进程                    |

**替代方案**：全量删除基础富文本会牺牲可读性；运行时布尔开关不能证明退出构建；把每个小图标拆成请求会产生碎片网络成本。采用功能级边界，实验清单记录共享依赖，不用模块分组gzip直接预测净节省。

来源：[面板注册](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/panels/register-panels.ts)、[动态图标](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/plugins/icons.ts)。

## R5 更新优化先测已有机制

**决定**：保留既有虚拟化、文字呈现与diff优化；用回放和浏览器trace定位仍存在的重复工作，改动仅针对已确认热点，同时应用到A/B，零额外补丁也是可接受研究结果。

**理由与证据**：`src/agent-stream/strategy-web.tsx:10,403-404,1245-1261`已用TanStack虚拟列表；`text-reveal.ts:1-29`与`hooks/use-revealed-text.ts:25-85`按rAF控制呈现并在结束清理；官方server的`agent-stream-coalescer.ts:3`默认60ms合并，当前旧daemon不一定具有相同行为。`src/git/diff-document/surface.web.tsx:132-244`有窗口化与rAF绘制，`workspace-cache.tsx`有有界缓存，`text-measurement.ts`有分块测量。`src/components/assistant-message-render-limit.ts:3`有32000字符呈现上限，`message.tsx`实际导入；代码点确认不等于手机回归通过。

**替代方案**：重写虚拟列表、删canonical事件、扩大截断或只提高更新节流间隔可能损伤审批/状态和信息完整性。先复用上游`e2e/browser/agent-stream-smoothness.spec.ts`及`diff-performance.spec.ts`负载与断言，接入现有Playwright链路。

来源：[流式实现](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/agent-stream/strategy-web.tsx)、[消息呈现上限](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/components/assistant-message-render-limit.ts)。

## R6 缓存、预算与真实证据

**决定**：保留原生缓存恢复，同时明确存储范围和忘记设备验收；版本/配置隔离。主站预算不放宽，新增助手预算分类必须验证完整资源清单，初开与总量分别约束，具体实验及门槛见[plan.md](plan.md)。

**理由与证据**：`host-runtime.ts:1319`使用`@paseo:daemon-registry`，`replica-cache/row-store.web.ts:14-18`使用IndexedDB。host删除在`host-runtime.ts:1924-1935,2032-2047`停止controller并清运行数据，`replica-cache/index.ts:1054-1065`异步排队删除持久行；还需核对迟到事件与其他草稿/布局存储，不能声称所有本地数据已清除。

Vibes当前`scripts/script-budget.ts`将未分类脚本计入普通预算；`scripts/budget-policy.ts`普通脚本21000 B等门槛不含尚未合并011的700000 B助手预算。`public/_headers`当前connect-src仅同源，且不允许本站iframe；无论采用哪种接入都须测实际CSP，不能靠开发服务器可达宣布上线可用。

**替代方案**：把所有vendor排除预算、清空原生缓存以省内存、用同一profile交叉测试不同版本、只验UI停止而不核对子进程，都会使结论失真。CPU与堆指标不是耗电测量，模拟手机不是真机。

## 研究边界

技术路线与实验设计已形成，固定源码构建及部分同版真实运行结果见R7—R9；尚无消融或性能目标通过结论。G0/G1/G2按各自完整证据判定，不能把部分兼容路径通过当作整个关卡通过。详细任务见[tasks.md](tasks.md)。

## R7 安装与实例隔离（T001）

固定源码HEAD与Git来源已核对，锁文件v3共3005条仓库记录（不等于本机实际安装数），SHA-256为`0e8d199c6c1b4f6ed99cc0cf524bb589602d0996466ef80e3a4ec62f29d77e8f`。受版本控制的`third_party/paseo-webui/upstream.json`记录源码/许可/锁文件摘要、9个工作区的直接依赖及开发依赖、安装脚本标记和授权命令。完整传递依赖及integrity以该摘要对应的官方锁文件为准。

**安装范围**：WebUI、server、cli、client、protocol、relay、highlight、plugin、expo-two-way-audio及根构建工具；不选择desktop和website工作区。固定锁版本含Expo54.0.33、Router6.0.23、React19.1.0、Metro0.83.3、Mermaid11.16.0，以及CodeMirror/xterm和daemon SDK。官方音频工作区仍是原始Web构建依赖，保留基线所需源码不表示新增语音承诺。

**脚本处理**：先在独立`.scratch/paseo-webui/upstream/`执行清单中的`npm ci --ignore-scripts`，不运行下载包中的生命周期脚本。下载后逐项核对实际脚本及平台需要，再显式准备esbuild、node-pty等构建所需模块并运行官方postinstall补丁。锁文件只有hasInstallScript标记，不能据此声称已审阅全部第三方脚本内容；实际解析依赖若超出范围，先查原因。根postinstall只针对已存在包应用官方patch-package补丁；根prepare的`lefthook install --force`会改Git hooks，与实验无关，跳过。Electron、官网、浏览器二进制和语音模型不在安装执行范围。

**实例边界**：盘点时6767的Paseo进程和4321的Node服务位于主项目，保留；全局CLI清单版本0.5.0不等于运行进程版本已验证。另有ChatGPT桥接及其他应用监听，不占用或清理。Node22.20.0/npm10.9.3可用；当前Vibes的node_modules是主项目软链接，不能作为上游依赖。实验拟用任务内daemon-home与127.0.0.1:6792，Web探针4392；启动前再次检查端口，无端口预占承诺。不复制用户登录配置，不覆盖现有daemon。

用户于2026-09-08明确同意所列安装方案；隔离安装2258个包，未生成Electron/desktop/website依赖目录。esbuild三版本平台二进制校验通过，node-pty预编译模块可加载，sharp0.34.5可加载；官方7项补丁应用成功，Git源码干净、锁文件摘要不变。未运行prepare、浏览器或语音模型下载。本机环境及安装日志保存于`resources/evidence/012-paseo-webui-loading/`。T001完成；构建、配对和测量尚未验收，G0未通过，不能展开产品接入实现。

## R8 官方基线构建与重放

WebUI与daemon的官方构建命令均在固定源码上成功。Web导出39个文件，其中5个JS总计20554608 B，逐文件默认gzip合计4690481 B；入口文件20543603 B/gzip4686132 B。这是静态文件清单，不是浏览器实际传输、首开或完整实验基线通过结论。记录在`resources/evidence/012-paseo-webui-loading/b0-export-files.json`，不沿用旧版本数字。

`scripts/paseo-webui-build.ts`提供固定源码获取/校验和B0官方导出；检查HEAD、origin、锁文件、许可及干净状态，按摘要及Git上下文检查有序补丁，构建后只反向撤销自己应用的补丁。失败使既有受控产物失效，未知文件夹与源码变化保留检查，不重置。产物置`.scratch/paseo-webui/artifacts/B0`，包含原始导出清单、Paseo许可、固定锁文件和实际已安装依赖许可文本。当前只有未优化B0配置，尚未接入主站构建或部署。

首次构建与编排器重放的39个原始资源路径/大小/哈希一致。隔离同版daemon6792健康检查通过，原生WebUI能打开工作区入口；这些只证明启动与初始渲染，不代表完整配对、模型、工具、审批和恢复通过。现有6767实例保留。真实浏览器后续证据与T003的完整兼容矩阵分开记录。

## R9 同版真实会话阶段结果（2026-09-08）

用户要求结束当前测试结果整理，并停止继续测试现有daemon的直连路径；不继续扩大测试或优化范围。当前记录是官方WebUI0.7.2、同版独立daemon与本机浏览器的部分兼容证据，T003仍未完整完成，PR保持Draft。

**环境限定**：固定官方源码未打产品补丁；独立daemon使用6792与任务内profile。全局Codex CLI0.144.1无法解析已有的`features.context_management`配置，实际测试改用已安装应用内CLI0.153.3，仅修改实验daemon的provider命令，没有修改用户Codex配置或全局CLI。模型为真实`gpt-5.6-luna`、Medium。目录发现曾超时，最终通过原生“直接打开所填路径”进入隔离compat夹具；这不表示目录搜索性能通过。

| 路径                         | 实际结果与限制                                                                                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 创建会话、选模型、工具与测试 | 原生页面显示Shell读取源码、Edit新增`add.test.js`及Shell运行`node --test`；本地独立复核3项测试全部通过，仅该文件未提交。不是最终A/B各3次重任务验收。                                                                                                     |
| 新建默认权限会话的拒绝/允许  | 实际出现原生审批卡片；点拒绝后操作未执行，独立允许探针点接受后输出预期标记。两次命令仅输出文字，不访问网络或文件。                                                                                                                                      |
| 已有会话切换权限模式         | 从Auto-review切回Default permissions后，下一回合探针没有人工审批卡片而直接执行；同类探针在新建默认权限会话出现卡片。源码`applyApprovalsReviewerParam`仅在自动审查模式发送reviewer，可能保留旧线程值；这是待确认根因，尚未修复，不能把模式切换声称正常。 |
| 停止                         | 点击原生停止后UI显示回合结束，但已核实的Node子进程仍存活，随后按45秒上限自然退出；后续工具完成事件仍更新页面。只能确认回合停止，不能确认所有子进程终止；相关提示仍待T018处理。                                                                          |
| 刷新恢复                     | 一次实际刷新后原会话、模型、权限模式与拒绝/允许结果恢复可见；不等于断线权威核对或100次恢复验收。                                                                                                                                                        |

原始证据在`resources/evidence/012-paseo-webui-loading/compatibility/`：`observations.json`、`basic-node-test.log`及基础成功、审批待定/拒绝/允许、停止差异截图。浏览器网络离线模拟未能证明既有WebSocket已断开，不计为断线恢复通过。现有daemon直连探针遇到HTTP403，用户已取消继续测试；未绕过限制，也不据此推断协议版本不兼容。加密relay配对、完整断线恢复、真机iPhone与加载优化均未验收。
