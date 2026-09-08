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

技术路线与实验设计已形成，固定源码构建、部分同版真实运行及直接挂载探针见R7—R10；尚无消融或性能目标通过结论。G0/G1/G2按各自完整证据判定，不能把部分兼容路径通过当作整个关卡通过。详细任务见[tasks.md](tasks.md)。

## R7 安装与实例隔离（T001）

固定源码HEAD与Git来源已核对，锁文件v3共3005条仓库记录（不等于本机实际安装数），SHA-256为`0e8d199c6c1b4f6ed99cc0cf524bb589602d0996466ef80e3a4ec62f29d77e8f`。受版本控制的`third_party/paseo-webui/upstream.json`记录源码/许可/锁文件摘要、9个工作区的直接依赖及开发依赖、安装脚本标记和授权命令。完整传递依赖及integrity以该摘要对应的官方锁文件为准。

**安装范围**：WebUI、server、cli、client、protocol、relay、highlight、plugin、expo-two-way-audio及根构建工具；不选择desktop和website工作区。固定锁版本含Expo54.0.33、Router6.0.23、React19.1.0、Metro0.83.3、Mermaid11.16.0，以及CodeMirror/xterm和daemon SDK。官方音频工作区仍是原始Web构建依赖，保留基线所需源码不表示新增语音承诺。

**脚本处理**：先在独立`.scratch/paseo-webui/upstream/`执行清单中的`npm ci --ignore-scripts`，不运行下载包中的生命周期脚本。下载后逐项核对实际脚本及平台需要，再显式准备esbuild、node-pty等构建所需模块并运行官方postinstall补丁。锁文件只有hasInstallScript标记，不能据此声称已审阅全部第三方脚本内容；实际解析依赖若超出范围，先查原因。根postinstall只针对已存在包应用官方patch-package补丁；根prepare的`lefthook install --force`会改Git hooks，与实验无关，跳过。Electron、官网、浏览器二进制和语音模型不在安装执行范围。

**实例边界**：盘点时6767的Paseo进程和4321的Node服务位于主项目，保留；全局CLI清单版本0.5.0不等于运行进程版本已验证。另有ChatGPT桥接及其他应用监听，不占用或清理。Node22.20.0/npm10.9.3可用；当前Vibes的node_modules是主项目软链接，不能作为上游依赖。实验拟用任务内daemon-home与127.0.0.1:6792，Web探针4392；启动前再次检查端口，无端口预占承诺。不复制用户登录配置，不覆盖现有daemon。

用户于2026-09-08明确同意所列安装方案；隔离安装2258个包，未生成Electron/desktop/website依赖目录。esbuild三版本平台二进制校验通过，node-pty预编译模块可加载，sharp0.34.5可加载；官方7项补丁应用成功，Git源码干净、锁文件摘要不变。未运行prepare、浏览器或语音模型下载。本机环境及安装日志保存于`resources/evidence/012-paseo-webui-loading/`。T001完成；当时构建、配对和测量尚未验收。后续构建见R8，G1执行顺序调整及接入证据见R10。

## R8 官方基线构建与重放

WebUI与daemon的官方构建命令均在固定源码上成功。Web导出39个文件，其中5个JS总计20554608 B，逐文件默认gzip合计4690481 B；入口文件20543603 B/gzip4686132 B。这是静态文件清单，不是浏览器实际传输、首开或完整实验基线通过结论。记录在`resources/evidence/012-paseo-webui-loading/b0-export-files.json`，不沿用旧版本数字。

`scripts/paseo-webui-build.ts`提供固定源码获取/校验和B0官方导出；检查HEAD、origin、锁文件、许可及干净状态，按摘要及Git上下文检查有序补丁，构建后只反向撤销自己应用的补丁。失败使既有受控产物失效，未知文件夹与源码变化保留检查，不重置。产物置`.scratch/paseo-webui/artifacts/B0`，包含原始导出清单、Paseo许可、固定锁文件和实际已安装依赖许可文本。B0保持独立未优化配置；后续G1实验产物见R10，尚未接入主站构建或部署。

首次构建与编排器重放的39个原始资源路径/大小/哈希一致。隔离同版daemon6792健康检查通过，原生WebUI能打开工作区入口；这些只证明启动与初始渲染，不代表完整配对、模型、工具、审批和恢复通过。现有6767实例保留。真实浏览器后续证据与T003的完整兼容矩阵分开记录。

## R9 同版真实会话阶段结果（2026-09-08）

用户当时要求结束当前测试结果整理，并停止继续测试现有daemon的直连路径；后续授权的G1见R10，旧daemon测试仍取消。当前记录是官方WebUI0.7.2、同版独立daemon与本机浏览器的部分兼容证据，T003仍未完整完成，PR保持Draft。

**环境限定**：固定官方源码未打产品补丁；独立daemon使用6792与任务内profile。全局Codex CLI0.144.1无法解析已有的`features.context_management`配置，实际测试改用已安装应用内CLI0.153.3，仅修改实验daemon的provider命令，没有修改用户Codex配置或全局CLI。模型为真实`gpt-5.6-luna`、Medium。目录发现曾超时，最终通过原生“直接打开所填路径”进入隔离compat夹具；这不表示目录搜索性能通过。

| 路径                         | 实际结果与限制                                                                                                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 创建会话、选模型、工具与测试 | 原生页面显示Shell读取源码、Edit新增`add.test.js`及Shell运行`node --test`；本地独立复核3项测试全部通过，仅该文件未提交。不是最终A/B各3次重任务验收。                                                                                                     |
| 新建默认权限会话的拒绝/允许  | 实际出现原生审批卡片；点拒绝后操作未执行，独立允许探针点接受后输出预期标记。两次命令仅输出文字，不访问网络或文件。                                                                                                                                      |
| 已有会话切换权限模式         | 从Auto-review切回Default permissions后，下一回合探针没有人工审批卡片而直接执行；同类探针在新建默认权限会话出现卡片。源码`applyApprovalsReviewerParam`仅在自动审查模式发送reviewer，可能保留旧线程值；这是待确认根因，尚未修复，不能把模式切换声称正常。 |
| 停止                         | 点击原生停止后UI显示回合结束，但已核实的Node子进程仍存活，随后按45秒上限自然退出；后续工具完成事件仍更新页面。只能确认回合停止，不能确认所有子进程终止；相关提示仍待T018处理。                                                                          |
| 刷新恢复                     | 一次实际刷新后原会话、模型、权限模式与拒绝/允许结果恢复可见；不等于断线权威核对或100次恢复验收。                                                                                                                                                        |

原始证据在`resources/evidence/012-paseo-webui-loading/compatibility/`：`observations.json`、`basic-node-test.log`及基础成功、审批待定/拒绝/允许、停止差异截图。浏览器网络离线模拟未能证明既有WebSocket已断开，不计为断线恢复通过。现有daemon直连探针遇到HTTP403，用户已取消继续测试；未绕过限制，也不据此推断协议版本不兼容。加密relay配对、完整断线恢复、真机iPhone与加载优化均未验收。

## R10 原生WebUI直接挂载探针（2026-09-08）

**决定**：依据用户后续授权，以已保存B0及同版部分会话证据先验证G1，选定受控模块直接挂载，不采用iframe。T004完整请求/依赖基线在拆包比较前完成；同版加密中继与完整恢复在正式接入后验收。旧daemon兼容不在范围内。

**有限适配的实际代价**：独立React仍来自官方导出，入口保留官方ExpoRoot、路由上下文及其原有providers，不修改HostRuntime、SessionProvider或同步/审批协议。补丁在`third_party/paseo-webui/patches/g1-direct-source.patch`（11个源码文件）和`g1-direct-dependencies.patch`（expo-router、react-native-web、react-native-unistyles中的9个文件）。后者按补丁摘要、完整文件清单及逐文件前后摘要校验；构建后恢复依赖和源码，失败不能复用旧产物。G1输出与原始B0分目录保存，39个资源成功重放导出；当前前缀只是探针专用地址。

直接挂载最初遇到两项实际失败：窄面板仍按整页宽度排版，Astro切页丢失动态CSS规则。修正将尺寸、断点、弹层坐标及主题根限定于助手容器，并在Astro交换前保留实际style节点（CSSOM规则不能靠复制文本保留）。宿主history、标题、favicon、viewport与滚动条样式隔离；全局快捷键仅在助手可见且焦点位于其中时响应。补丁涉及底层库，后续升级必须核对上下文及这些行为，不能描述为零维护封装。

**实际证据**：真实浏览器在默认权限的新建Luna会话出现审批卡片；等待审批期间收起并经Astro切换文章，展开仍是原卡片，接受后工具输出预期标记并完成。自动化在桌面Chromium及手机配置Chromium/WebKit验证首次点击前无socket、并发打开只挂载一次、只保留一个socket、收起/文章跳转/后退后原根和CSSOM保留且文档未重载。最终探针9项通过，包括320px容器不越界；桌面滚轮能滚动文章且固定面板位置不变。容器420/720宽度与宿主输入快捷键隔离另行验证；手机项目内的这项尺寸测试显式使用1280宽视口，不冒称是手机键盘测试。证据保存在`resources/evidence/012-paseo-webui-loading/host/`的截图、构建和Playwright日志，自动化入口为`tests/paseo-mount.spec.ts`。

**边界**：这只是接入选择探针，测试夹具的打开按钮未加入Explore。尚未实现正式就绪/错误/重试契约、真正退出、公开作品草稿、完整活动信号合成及生产CSP；这些继续按T006及后续任务验收。原审批模式切换差异和停止后子进程可能继续的问题仍保留。没有真实iPhone、加密中继、最终恢复矩阵或A/B性能通过结论。

## R11 原始B0依赖与请求盘点

T004用官方Metro的只读experimentalSerializerHook采集实际解析图，固定为`patches/graph-capture.patch`；不替换编译器或序列化逻辑。单独B0-graph构建与原B0的39个文件路径/大小/哈希完全一致，原B0未覆盖，图文件自身摘要进入观察构建记录。实际源图有4986模块、同步闭包4980模块，4条异步边均来自attachments/store的存储平台分支；Mermaid、终端、编辑器等尚未形成这类外围加载边界。

文件盘点脚本严格验证完整图、全量资源和摘要，静态JS总大小20554608 B、逐文件默认gzip4690481 B；HTML入口单文件gzip4686132 B。首次打开的真实Chromium请求另加载了indexeddb-attachment-store异步chunk，说明“异步文件”不等于“首次不加载”。同次盘点记录了xterm样式、文档和两个JS请求，并逐个核对JS响应正文与原B0哈希一致；只有一个本机新上下文样本，不能作为冷暖性能收益结论。本机daemon的传输方式与最终Cloudflare不同，浏览器报告的网络字节不能替代统一压缩预算。

原始证据在`resources/evidence/012-paseo-webui-loading/baseline/`：b0-manifest.json、b0-source-graph.json及desktop-chromium/initial-requests.json。T007仍需冻结样本、输入和公式。G1整站回归另发现既有手机WebKit音频测试在原生恢复后再次暂停；184通过、13跳过、1失败，单独两次复查一过一败。诊断记录中页面可见，暂停不是本站再次调用audio.pause；媒体源码及该测试与main无差异，根因尚未确定，不擅自修改媒体逻辑或声明整站通过。该验证问题仍须在最终交付前解决。

## R12 负载与采样冻结

T007将W0—W5生成器、输出大小/哈希与协议版本固定；W1/W2事件逐个通过固定官方AgentStreamEventPayloadSchema，文字采用与官方mock provider相同的timeline增量语义。W1含1000条历史、1024000字符正文；W2持续20秒并有200次工具状态更新；W3为50文件、每侧10000行；W4保留31999/32000/32001/100000字符边界；W5保留6000条JSONL及同一多文件Luna提示。生成输入不等于UI呈现或真实模型验收。

未配对/已配对各按每配置10冷20暖，12配置合计720个首开样本计划，固定伪随机顺序与单worker；真实Luna、恢复/忘记、真机和资源循环独立列明数量。冻结数值以首次实际加载的两份JS计算标准gzip，初开4687382 B，减半目标2343691 B；总量上限4690481 B。没有采样结果时不能输出通过；完整采样覆盖也仍需T035及正确性关卡分析。冻结配置只描述待构建的候选，不代表A/B已经实现。

## R11：H接入的加载边界与公共预算

2026-09-08，H在G1直接挂载之上接入Explore/作品页，原生补丁绑定版本1契约、根可操作/错误事件、宿主locale与presentation。保留官方providers、独立React和HostRuntime；公开草稿仍未进入composer。收起及Astro导航保留同一实例、原生样式和连接，退出整页刷新但不删除设备。

实际H生产导出在同版本地daemon托管下通过27项加载回归（三配置各9项），另补3项非空registry摘要退出回归。覆盖普通浏览零专用资源/连接、无JS、并发、离线、下载失败重试、加载中收起、404刷新、退出、外部搜索焦点和320px容器。真实内置浏览器从Explore打开、收起、进入论文详情再重开仍显示原会话；截图h-article-reopen.png。这里未应用Cloudflare响应头，也没有真机iPhone、正式中继或完整恢复证据，不能据此完成T011/T014及最终验收。

发现仅用Astro条件隐藏入口，仍输出未使用的客户端chunk，默认公共JS达到24763字节gzip，原门槛拒绝。采用构建前入口别名选择空组件，默认产物不再含助手客户端图。启用H时轻量按钮仍计公共预算；将原有公共小模块和助手轻量启动器按明确源码列表合并为site-boot，非递归合并保留动态边界，H公共JS为20874字节，低于21000原门槛。该打包调整需要整站MDX、媒体和导航回归，不能只靠助手测试。

预算从匹配源码/补丁的真实资源清单验证每个脚本哈希，拒绝未知资源和静态泄漏；原生全部JS、宿主独有依赖总量4690654字节gzip。首次打开暂采用同一总量的保守上界，不使用未绑定的单次网络样本推导收益。因此完整H仍超过冻结初开2343691目标及总量4690481最大值，正确返回失败；不放宽基线，不把H选为交付候选。A/B完成后须绑定各自首开证据才能报告实际拆包收益。

原始日志在resources/evidence/012-paseo-webui-loading/host/：h-loading-grouped-final.log、h-exit-storage-nonempty.log、h-budget-grouped-second.log及默认构建预算日志。受H补丁影响的上游10组/294项单元测试通过（h-native-unit.log），测试后检查来源/补丁已恢复；这不替代真实运行或全量上游测试。源码配置拒绝发布H、错误摘要/未知格式/符号链接的独立临时目录测试见paseo-build-config.test.ts。已有WebKit原生音频继续播放回归失败仍须在整体交付前定位，不能清空已有失败证据。

## R12：同版中继与实际安全头

2026-09-08，仅本任务专用daemon启用官方relay.paseo.sh:443的TLS中继；主目录服务保留。固定H放到本地Worker后，原生欢迎页正常，配对被connect-src self拒绝，CDP确认是CSP阻断。构建仅在助手启用时添加固定wss://relay.paseo.sh，普通构建不扩大连接来源；未添加任意WS、eval、frame或worker许可。版本化资源使用一年immutable缓存。

真实内置浏览器经原生配对表单成功连接，恢复已有会话/审批结果，gpt-5.6-luna回复PASEO_RELAY_OK。实际请求中的原生入口、IndexedDB附件chunk均为200 JavaScript，xterm样式为200 text/css，缓存头正确；本路径没有独立WASM、字体或worker下载，不冒称外围能力已验证。脱敏证据在host/h-csp-relay-connected.json、h-csp-resource-responses.json及h-relay-restored-session.png。

三配置中继自动回归通过配对、历史、语言导航、整页刷新后恢复及对blocked.invalid的CSP拒绝。最初把旧Playwright WebSocket对象仍留在Set误判为未关闭；真实CDP也未收到旧文档的close事件，但daemon对应relay_data_disconnected已出现。现在同时核对daemon对应通道已关闭、新文档零新连接，再验证重开，未取消关闭门槛。私有日志/配对文件不进入产物，记录只保存原生资源路径、公开中继origin和结果。

中继恢复仅是基础路径，不完成T003完整恢复或最终100次矩阵。实验daemon展示目录改为独立probes/web，保留B0根入口与H站点，避免后续上游构建覆盖体验页。真正退出由原生dispose执行刷新，宿主只在失败时兜底，避免双重刷新；对应测试额外要求一次主文档请求。

## R13：公开作品草稿与生产历史状态失效

2026-09-08，h-public-work.patch在原生composer中显示当前公开作品，用户点击后通过replaceUserInput插入有标签的JSON引用文本；发送、排队、失败恢复仍由原生submitAgentInput处理，未增加RPC或系统消息。4项边界单元、3项原生组件测试，以及三配置真实中继草稿测试通过附带、取消、跨文章与刷新恢复。内置浏览器主动附带Attention Is All You Need并通过原生发送按钮提交，gpt-5.6-luna回复PASEO_PUBLIC_WORK_OK: Attention Is All You Need；本轮没有工具调用。截图在chat/public-work-before-send.png及后续回复证据，模型小验证不计最终重任务。

审阅发现中继测试手动newContext未继承设备参数，早期“三配置”只证明对应浏览器引擎，不能证明手机视口；已显式传递viewport/userAgent/deviceScaleFactor/isMobile/hasTouch。真实手机视口下，历史页偶发停在“无法加载历史”，不是等待不足：失败时HostRuntime为online、agentDirectoryStatus为ready，页面仍保留初始未连接结果。分别保存三轮失败/成功日志、history-mobile-chromium.png及脱敏运行状态；不删失败、不自动重试。

固定H生产包中useAgentHistory的useSyncExternalStore返回值被丢弃，编译缓存只比较hosts/serverId等稳定引用，原手动useMemo依赖的runtimeVersion消失；同样模式出现在useHostRuntimeConnectionStatuses。history-compiled-before.json保存产物哈希及对应函数。tests/paseo-recovery.spec.ts延迟第二条真实加密连接的下行帧，先进入历史页，再原样释放：连接与目录已恢复后错误仍不消失，确定性复现。帧只暂存在内存，不解析、不落盘，不伪造daemon响应。

最小修正h-reactive-history.patch只对上述两个读取可变外部状态的hook加函数级use no memo，保留既有手动依赖；不关闭全局编译优化，不重写运行时或同步协议。这是[React官方支持的函数级退出机制](https://react.dev/reference/react-compiler/directives/use-no-memo)，升级时只有相同生产延迟恢复用例通过才可移除。修正后生产函数保留useSyncExternalStore返回值及useMemo版本依赖，三配置的草稿/中继/确定性延迟恢复共9项通过（host/h-history-after-fix.log）；相关上游13组/321项单元通过。没有把普通Vitest当作编译产物验证。

根providers层级保留；SessionProvider及composer/submit.ts与固定上游字节一致。HostRuntime的变化只有嵌入模式跳过隐式localhost发现，以及聚合连接状态hook的上述编译边界；原有显式配置/配对、注册、单例与同步保留。chat/provider-boundary.json记录源码核验范围，chat/history-compiled-after.json记录生产函数；T016通过不代表T003/T024完整恢复完成。

## R14：停止与审批的请求反馈

2026-09-08，h-operation-feedback.patch保留原生cancelComposerAgent及respondToPermissionAndWait路径，仅补充请求反馈：取消响应不宣称进程全部结束，未确认显示未知，审批禁止自动重试。新回合、切会话和卸载隔离迟到回执；4项组件边界测试与原生actions等15组/368项通过，来源补丁恢复检查通过（host/h-operation-native-unit.log）。

固定0.7.2开发mock daemon禁用全部真实provider，独立Git夹具避免项目发现越界；同源测试宿主保留H的生产CSP，转发本机6793的真实协议。初始127.0.0.1页面被上游连接地址规范为localhost后触发CSP拒绝；将测试页面使用相同localhost域名后通过，不扩大站点CSP。初版临时探针未建内层Git时曾由原生项目发现读到父仓库；正式夹具在创建workspace前先git init，模型不操作父目录。

三配置测试通过真实mock停止响应、审批允许/拒绝；在原生WebSocket上丢弃一次请求并断线，恢复后停止/审批显示未知，请求计数证明没有自动重发。旧停止反馈在新回合消失，收起没有发送取消；错误回合仍由原生界面显示。测试使用生产导出及手机模拟参数，未将合成回合算作Luna重任务、真实子进程结束或最终100次恢复；日志host/h-operation-browser-complete.log。
