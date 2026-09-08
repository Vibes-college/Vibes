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

## R15：原生会话、工具与展示状态矩阵

2026-09-08，T015在真实同版mock协议上补齐模型选择（SDK读取实际model值）、两个独立Git工作区间的会话/目录选择和草稿隔离、工具完成及错误详情。资料附带/取消沿用三配置真实中继回归；审批允许/拒绝/未知沿用R14。工具错误仅改变一次mock timeline事件，保留真实seq/callId，采用固定上游tool-call-overview-sheet的协议夹具方式；只证明呈现，不宣称执行了失败命令。

测试定位按真实操作收窄：原生保留隐藏工作区，历史条目按agent-row定位；手机先打开模型设置再点模型子页，选完用设置页关闭按钮；工具行的文件入口与展开详情不同，WebKit鼠标悬停会显示文件按钮，因此使用左侧展开图标和手机触控。误点文件入口所得ENOENT及此前失败日志保留，均不是模型或文件读取功能通过证据。上游历史查询staleTime为30秒，跨客户端新建后已有列表可能短暂不含新会话；选择夹具在初次打开前准备两组会话，完整跨客户端恢复仍待T021/T024。

T022沿用已存在的宿主AppState/document/focus适配，新增三配置协议观察：收起时heartbeat appVisible=false、focusedAgentId=null，仍接收agent_stream；展开恢复焦点、复用同一HostRuntime且socket数不变，无cancel请求。受控document.visibilityState与visibilitychange验证组合通知和恢复后online/目录ready，不冒充实际浏览器挂起或iPhone后台证据。8项共同回归及修正定位后的3项工具选择回归均通过；日志host/h-chat-presentation-all.log（含旧WebKit误点失败）和h-selection-tools-final.log。

阶段检查：`h-chat-presentation-verify.log`的类型、lint、格式、文档及118项单元通过；整站E2E为184通过、61明确跳过、1失败。失败是既有WebKit原生音频暂停/恢复在60秒后再次暂停；trace显示play/playing后约124ms出现pause，原因尚未定位。原始trace保存在host/audio-recurrence；相同代码单独连续3次复测均通过，不将偶发未复现解释为已修复，整站首次失败保留。默认产物budget通过；助手专项选择/工具三配置和展示三配置证据独立有效。

## R16：Mermaid生产动态边界与原生呈现限制

`a1-mermaid-lazy.patch`仅延后加载原生host模块，保留上游渲染、源策略、请求驱动及隔离iframe。A1生产导出出现独立host资源；实际三配置验证普通聊天和Mermaid源码出现时不下载，主动展开才请求。第一次故意中断该chunk后可见错误且重新点击成功；源码/图表、收起/展开不重复请求。浏览器检查iframe不能访问parent.document，不以HTML属性单独代替隔离验证。

首次真实生产CSP阻止原生iframe内联脚本；`a1-csp-diagnostic.log`记录浏览器要求的固定脚本哈希。构建器从已验证上游源码的生成JSON字面量提取唯一脚本、计算哈希并随回执传给站点CSP；不eval源码、不增加任意inline/eval、frame来源或iframe的same-origin权限。原有iframe自身策略保留。未知格式/多脚本/外部脚本替代在单元验证中拒绝。资源拆包通过不代表安全策略或实际渲染自动通过。

源码往返测试发现透明图表工具栏截获“查看图表”，以inert限制隐藏测量区域及其后代，保留运行iframe。该次`a1-browser-all.log`中的桌面为真实遮挡失败；手机Chromium是测试点击canvas中心命中原生工具栏容器，改用左上画布；WebKit两项因测试尚未结束即启动重建、回执被严格失效机制移除而中断，不能归为产品失败。后续严格串行，`a1-controls-browser-all.log`三配置6项通过。内置浏览器另发现短中文图表高度26px、原生工具栏被裁；单独将数值height下限改为120仍被通用ZoomableViewport的flex:1压到26px，`a1-readable-browser-all.log`三配置均在新增的工具栏完整性断言失败。随后仅在内联图表容器覆盖flex-grow/shrink/basis，使其采用原本声明的测量高度并保留120px下限；原生图表引擎/缩放规则不变。

原始证据位于probe-mermaid/；真实浏览器通过直接连接本机禁用真实providers的同版mock实例，在独立Git目录发送固定图表内容。该合成数据不计Luna重任务，也不计最终10冷20暖性能样本。当前静态体积仅按冻结的node:zlib默认gzip口径比较原生文件，宿主和实际冷/暖等待仍需最终采样；不据单个chunk大小宣称减半或通过最终预算。

高度布局修正后，`a1-height-browser-all.log`和`a1-height-report.json`记录三配置6项全部通过，含请求路径/次数/预期失败；`a1-cua-readable-diagram.png`是内置浏览器实际显示并操作源码往返的证据。上游源策略/渲染模型/请求驱动/HTML四组16项单元通过；本站解析及构建测试6项通过。受控mock自定义响应在刷新后可能作为合成历史再次呈现，故本组只作为图表呈现/加载验收，不用于权威历史去重结论。

A1阶段整站`verify`的类型、格式、文档和119项单元通过；E2E为184通过、67跳过、1失败，仍是WebKit原生音频暂停后恢复测试。默认Explore预算通过（公开JS gzip 20,288字节）。音频单项附加pause调用追踪后5次中3次失败、2次通过，失败的第二个pause事件没有站点JavaScript的pause调用，不能据此声称已确定根因或豁免验收。完整证据保存在probe-mermaid/audio-diagnostic/。原生app额外类型检查发现早期宿主补丁3处类型问题，仍待修复；本站类型通过不代表原生app类型已通过。当前保持Draft，不构成整站验收完成。

附加音频诊断：原生play/playing之后，duration从205.1657秒降为60秒、ended变为true，随后pause/ended事件到达，没有站点pause调用。裸audio对照移除了本站播放器；通过标准206 Range响应并直接调用原生play后，3次中1次仍停在60秒、2次通过，故不能仅归因于本地服务无Range，也不能认定已修复。早一组裸audio采用未经验证的坐标点击，5次失败只作诊断过程，不作为根因证据。临时诊断测试及trace保存在audio-diagnostic/，正式测试断言保持原样。真实iPhone尚未验证此现象；该失败仍阻止最终验收，不以继续独立实现任务视为豁免。

## R17：终端与文件的激活边界

A2在A1上保留同步注册/描述和原生provider，只把TerminalPane与FilePane放进按激活加载的主体；失败清除模块Promise，显示重试，卸载或隐藏期间迟到响应不挂入界面。生产导出42文件，独立terminal-pane约943kB、pane约368kB原始体积；共享语法/图标仍在初始包，不能将局部拆分当作最终预算通过。

原生完整tsgo检查发现早期H补丁的Web unmount DOM类型、共享.ts导入规则与测试mock签名三处类型问题；h-native-types.patch在A2中修正，不改原生运行行为。固定react-native-web AppRegistry实现调用unmountComponentAtNode，故按HTMLElement做局部类型桥接而不伪造numeric root。A2草稿源码完整类型检查通过。

a2-features-all.json三配置18项通过，包含Mermaid回归、终端/编辑器按需、首次失败后重试、隐藏复用、刷新布局恢复、实际写文件；a2-file-deeplink-all.log另3项通过聊天文件链接打开第18行。最初终端测试误用宽屏tab按钮而超时，改为实际窄面板Workspace菜单；随后比较整份终端信息因原生shell补充title失败，改为核对同一个terminal id，没有忽略终端丢失。内置浏览器在自建隔离目录实际执行固定printf并看到输出，编辑fixture.txt后核对磁盘内容，截图a2-cua-terminal.png/a2-cua-file.png。均为mock-only daemon及自建文件，不计真实Luna重任务。卸载/未保存草稿和完整资源释放尚未验收，T029保持未完成。

A2资源补充：a2-resource-all.json三配置6项通过，首次打开前无terminal订阅；隐藏时renderer和stream仍保留，整页退出后renderer消失且原生模块未加载，远端terminal和Agent身份仍在，重新主动打开恢复。故不能声称隐藏已经释放renderer或stream。阻断fs.file.write.request后，未保存内容/光标跨隐藏及工作区切换保留；切换后hiddenEditors=1，属于原生保留，不作为编辑器真正卸载的证据。原生stream controller、editor/live file/preview模型及文件链接6组90项单元通过。T029的完整卸载边界仍未关闭。

A2整站verify首次184通过、82跳过、1项正文图片测试失败；trace显示该正文请求404。当时错误地并行执行npm run budget，它隐含build并替换了正在被测试消费的dist。此失败不能归于正文逻辑或跳过。串行重跑test:e2e为185通过、88跳过；新增A2测试需要显式夹具配置，已另行通过。检查含119项单元通过，默认预算通过。先前WebKit音频间歇失败在本轮未复现，保留裸audio对照和全部失败记录，不声称已修复。

## R18：共享语法按需与构建器的实际闭包

A3是累计工程探针，在A2上拆出语法高亮运行时，并加入编辑器位置恢复；这些阶段产物不直接当作冻结实验配置中的单变量A1—A6样本。最终消融必须按各自功能开关重建，校对完整补丁/输入/回执，不能把累计探针的差值声称为单项收益。

首次拆分仍因设置页AppearancePreview静态引用tokenizer把语法带入主包；移除后，Expo又把FilePane和高亮异步块的共有依赖升为首开`__common`，HTML含runtime/common/index三条脚本。两次均未达到按需边界，不通过放宽单入口校验或忽略共享资源来处理。a3-lazy-common-dependencies.patch使纯异步交集成为单份异步资源，消费者的路径表携带前置资源列表；原生asyncRequire在全部定义到达后才执行importAll，既有URL缓存负责去重及失败清除。worker入口尚未适配，遇到时构建拒绝。这个维护成本涉及序列化器和加载器两个精确版本文件，升级必须成对复核，不表示任意Expo版本兼容。

颜色/主题、语言支持信息与语法执行分离。支持列表与原生parser映射受Record类型约束；不支持的代码语言不加载语法。当前可见、激活内容稳定160ms后才请求运行时，原文同步可读，失败可重试；保留LRU 200项、100000字符限制、完整旧/新diff语法上下文及复制原文。设置预览也使用同一边界，不让外围设置反向拖入初始包。

生产导出44文件，初始HTML只有入口脚本；浏览器实际证明入口/普通聊天不请求共有语法，聊天代码或工具详情使用时才加载，文件编辑器复用已取得的共有定义。a3-editor-layout-build.log、a3-final-native-checks.log及a3-language-guard-build.log保留阶段回执；最终原生tsgo、7组89项单元及实际安装版Expo加载器的前置顺序、并发去重、失败/重试、字符串路径兼容检查通过。源码及依赖在构建退出后恢复原始字节。

三配置专项证据在probe-mermaid：a3-features-resources-all.log为36项，a3-highlight-all.log为9项，含原文复制到剪贴板API、工具120000字符内容、工具差异展开和文件共享。内置浏览器真实呈现彩色代码，点击复制后用系统剪贴板读取核对原文，截图a3-cua-highlight.png；只使用隔离mock及自建文件，不计Luna重任务。原生聊天本身在32000字符截断呈现并显示提示，所以不能拿100000字符聊天测试代替高亮器上限测试；最初错误假设导致的a3-highlight-copy-limit.log保留。完整长消息查看路径仍属于后续持续输出验收。

静态体积按冻结node:zlib默认逐文件gzip计算：A2原生JS总量4692991字节，A3为4689880，A3入口2934336、共有语法416452字节。记录a3-static-sizes.json；未含宿主，也不是实际冷暖样本。入口单项已经超过冻结初开2343691目标，因此不声称当前A3通过最终预算或减半。

## R19：真实卸载位置与浏览器像素密度校准

A2编辑器源码/预览切换会真正移除CodeMirror节点：草稿由原生模型保留，但光标和滚动重置。a2-editor-unmount-before.log保存失败。a2-editor-lifecycle.patch用原生模型作WeakMap弱键，仅记录选择、滚动快照和导航代次；layout清理在DOM移除前保存并destroy。首次用普通effect清理虽恢复光标，仍偏354px（a3-editor-unmount.log）；改为layout阶段后，80行未保存草稿、第45行光标和滚动差≤2px通过。新行定位优先，不新增草稿仓库或持久存储。

终端测试通过真实输入执行固定printf、核对daemon capture、退出后模块/renderer消失、远端terminal和Agent身份保留，再打开复核输出。初期仅检查加载提示和远端输出会漏掉空白画面；桌面及WebKit截图可读，3倍像素的Chromium截图空白，可见浏览器的OS截图也为空白（a3-terminal-os-blank.png）。禁用WebGL的诊断恢复文字，但未据此修改生产渲染；普通像素密度正常，桌面改为3倍同样失败。

独立固定xterm、无Paseo/宿主、带或不带ImageAddon均复现；保留绘图缓冲也无效。a3-xterm-pixel-observer-before.json记录devicePixelRatio=3而280×112 CSS画布的devicePixelContentBoxSize仍为280×112，原生WebGL观察器据此缩小画布。仅给Chromium进程加`--force-device-scale-factor=3`后，device box变为840×336，独立及真实终端均显示文字。最终只校准Playwright进程与context像素密度，不关闭WebGL、不改写页面API，也不降低手机DPR。a3-terminal-calibrated.log三配置通过，终端测试增加像素比例和截图对比度断言，保留截图人工核对固定输出；原生控制器/文件模型的卸载测试在89项中通过。真实iPhone和100次资源/恢复循环仍未计入通过。

## R20：本地代理收尾与外部媒体分离

A3整站verify的类型、lint、格式、文档及单元通过，浏览器180通过、109明确跳过、5项收尾失败；五项均为browser-test的全页面networkidle超时，其中Chromium trace明确显示YouTube/Spotify/Prose远端封面超过10秒。本地请求与业务断言已完成，不能把外部请求是否结束当作本地Wrangler代理的退出条件。原始trace保存在probe-mermaid/a3-drain-before/；没有把失败当通过。

browser-test及独立缓存profile改为从请求开始追踪本地同源请求，完成或失败后移除，全部排空并稳定500ms才关闭；10秒仍未排空继续失败，其他功能断言不变。新增真实浏览器路由探针同时挂住本地与远端图片，证明本地未结束必须等待、仅远端未结束时可收尾。与原搜索历史用例三配置共6项通过，a3-drain-targeted.log；整站需在此修正后重跑。语言草稿只在.scratch准备，未混入A3生产包。

首次同源计数实现又在视频冷暖测试收尾失败；a3-drain-own-diagnostic.log显示旧文档的full.mp4仍留在计数中，真实HTTP trace已完成。检查固定Playwright的_onClearLifecycle发现新文档提交会重置旧文档请求。修正为只在真实顶层HTTP导航提交后移除替换前的请求，保留新请求；同文档hash/ClientRouter导航不重置，子frame销毁清除其旧请求，非HTTP的blob不算代理活动。视频冷暖、搜索历史及受控排空三配置9项通过（a3-drain-navigation-fixed.log）。有已知失败的整站重跑已主动中止并保存结果，必须再完成一轮全量验收。

最终A3整站verify通过类型、lint、格式、文档及122项单元，浏览器188通过、109按设备或实验配置明确跳过（a3-phase-verify-lifecycle.log）；单独A3最终生产包48项全通过，默认Explore的budget通过（a3-phase-budget.log）。这一轮WebKit音频恢复通过，仍保留既有间歇失败与裸audio对照，不宣称根因已修复；A3本身仍未达到最终首开预算。

## R21：语言资源与精确共享边界

A4在A3累计配置上保留英文静态回退，按实际选择下载八种其他翻译；provider以effect有效期隔离迟到结果，失败保留当前界面与显式重试。翻译共用插件设置表与语法的使用者不同，因此共享块按完整消费者集合分组，再从真实同步边建立前置依赖及传递闭包，不能沿用单个全局common。构建回执为53文件，原生类型检查、144项原生单元测试和实际Expo运行时/分组检查通过（probe-mermaid/a4-language-build.log）。这仍是工程探针，不计最终A/B消融、性能或预算通过。

2026-09-08，桌面三项语言专项通过；三配置联合57项中56通过，一项mobile-webkit文件深链接未打开（a4-all-browser.log/json），九项语言覆盖均通过。保持产物不变的3次原用例及8次事件诊断全部通过（a4-deeplink-diagnostic.log、a4-deeplink-events.log），未确定最初失败原因；不能把偶发未复现当修复。手机用例随后按设备hasTouch使用tap，桌面保持click。内置浏览器在同一A4生产站实际完成中英日切换，保存a4-cua-english/japanese/chinese.png；没有新建真实模型任务。

第二轮a4-final-browser.log/json仍为56通过1失败：触摸文件链接及九项语言用例通过；mobile-webkit终端用例在SDK createWorkspace等待60000ms超时，未进入浏览器功能断言。原轮同一终端用例通过；保留两轮原始记录，不把组合覆盖描述为单轮全绿。

## R22：原生插件执行与网站CSP的实际冲突

准备T032时发现固定上游plugins/evaluate.ts通过globalThis.eval执行从daemon取得的插件clientBundle。用同版mock隔离daemon安装一个仅显示文本和Settings图标的本地插件、在A4真实生产CSP下打开原生设置→插件，实际显示失败及unsafe-eval未获允许。证据为probe-mermaid/a4-plugin-csp-settings.log和plugin-csp/trace.zip；首次只检查侧栏未出现的a4-plugin-csp.log不足以单独证明原因，第二次设置错误才确认。探针结束已移除该测试插件并恢复原pluginsEnabled值，未改真实daemon或网站CSP。

当前直接挂载方案不能同时保持网站现有禁止eval策略与FR003完整Web插件界面；这不是图标拆包可以解决的问题。已向用户呈现两个具体范围：保留插件界面并改成独立来源文档嵌入（需要重新验收宿主/来源/导航），或明确排除客户端插件界面、仍保留后端工具插件。用户选择前不修改CSP、不把未完成的T032或A/B配置标成完成；现有加载、聊天和语言结果仍按各自覆盖保留。

A4阶段整站verify通过类型、lint、格式、文档、122项单元和188项浏览器测试，118项按设备或未启用实验明确跳过（a4-phase-verify.log）。随后串行运行默认Explore budget通过（a4-phase-budget.log）。A4原生入口静态gzip为2712275字节、全部原生JS为4695727字节，尚未包括宿主；与最终门槛相比仍未达标，不能把普通网站预算通过当助手预算通过（a4-static-size.json）。
