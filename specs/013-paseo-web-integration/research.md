---
tense: 'frozen'
describes: 'Paseo原生接入的来源证据与维护边界'
status: 'draft'
amended-by: []
---

# 来源、取舍与待验证事项

## R1 从main重新接入，历史尝试作为证据

2026-09-08核对main为`0c210ee4742a6c80de7938688fb34f58674a0e8d`，当前没有助手。PR #10头为`e6e3bf863f6bb81b7b5a3206a31010cfca2e9214`；PR #11头为`c8f9d8c522226f6658b37d003b5f7b566185bd4a`；均为未合并Draft。本规格使用013，保留011/012编号与原分支，不修改其状态或清理资源。

**决定**：独立新PR，不整批cherry-pick旧实现。按固定源码选择可复用UI、宿主边界和回归场景，逐项记录本地补丁。用户这次明确选择官方Web协调能力，替代早先assistant-ui方向。

**理由**：PR #10的[连接所有权](https://github.com/Vibes-college/Vibes/blob/e6e3bf863f6bb81b7b5a3206a31010cfca2e9214/src/lib/assistant/connection-owner.ts)、[恢复器](https://github.com/Vibes-college/Vibes/blob/e6e3bf863f6bb81b7b5a3206a31010cfca2e9214/src/lib/assistant/recovery.ts)、[会话store](https://github.com/Vibes-college/Vibes/blob/e6e3bf863f6bb81b7b5a3206a31010cfca2e9214/src/lib/assistant/store.ts)、[操作账本](https://github.com/Vibes-college/Vibes/blob/e6e3bf863f6bb81b7b5a3206a31010cfca2e9214/src/lib/assistant/operation-ledger.ts)已承担连接代次、生命周期、订阅和快照竞争、权威历史及未知结果。这些是原生协调层应覆盖的验收清单，不再作为新架构移植。

**证据限度**：PR #10最终头未完成整体验证，其预览是较早SHA；PR #11的静态构建与部分中继、审批等证据不能证明新接入完整恢复或长期性能通过。模型任务中的预设测试失败、停止后子进程继续，与客户端重复卡片和恢复问题分开记录。

## R2 固定官方版本，保留应用协调层

**拟定基准**：官方v0.7.2，提交`9400a49af670fdb5db4af58e73f8df98588dbea9`。这是可追溯、已有构建证据的比较基准，不宣称它是届时最新版本或已经验收。实现开始前核实对应官方App/CLI发行支持与同版daemon，避免混用服务端版本把差异归因于UI。

保留完整根providers、HostRuntimeController、HostSessionManager、SessionProvider、timeline/directory同步与原生操作路径；官方[根布局](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/app/_layout.tsx)、[host-runtime](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/runtime/host-runtime.ts)、[session-context](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/contexts/session-context.tsx)是核对入口。

来源和锁定方法参考PR #11固定[upstream.json](https://github.com/Vibes-college/Vibes/blob/c8f9d8c522226f6658b37d003b5f7b566185bd4a/third_party/paseo-webui/upstream.json)：官方锁文件SHA256为`0e8d199c6c1b4f6ed99cc0cf524bb589602d0996466ef80e3a4ec62f29d77e8f`，许可Apache-2.0。记录源、锁、补丁与产物摘要，升级时复核差异与恢复矩阵；官方源码也可能有bug。

PR #11已发现生产编译导致两个外部状态hook不更新，见其[research R13](https://github.com/Vibes-college/Vibes/blob/c8f9d8c522226f6658b37d003b5f7b566185bd4a/specs/012-paseo-webui-loading/research.md#r13公开作品草稿与生产历史状态失效)。候选先运行同类延迟恢复复现，确实仍失败才采纳函数级精确补丁；不照搬全部实验补丁，不因为出自官方就忽略缺口。

## R3 旧UI可参考，但Chat不是纯界面

只读来源：`/Users/jachi/Desktop/Vibecoding-College/paseo-complete-root`，当前HEAD `0e3318a94feb4d6def3d8266a8faffc8dc98e0d6`；`docs/vibes-embedding.md`与Git对象指向官方基线v0.7.0-beta.1 / `1860a6f3afdf7710a7e86677dd183dc7eb9b8a0d`。该HEAD是定制fork，不是官方版本。

以下路径均相对该旧项目的`packages/app/src/`：

| 参考内容         | 具体位置                                                                 | 采用边界                                                         |
| ---------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 极简顶部         | components/headers/paseo-product-header.tsx:37、paseo-mode-switch.tsx:13 | 参考排列、图标与44px点击目标；不连带复制模式后端                 |
| 完整根接入       | embedded/mount.tsx:69、86、194，module-entry.ts:17                       | 证明旧实现保留完整应用；不冒称官方存在同名挂载API                |
| compact/full/FAB | embedded/compact-host-shell.web.ts:409、web-entry.ts:68                  | 参考原根持续存在及尺寸切换；Full关闭返回compact、compact关闭收起 |
| 草稿选区与滚动   | embedded/surface-retention.web.ts:18                                     | 作为切尺寸/重开的验收与适配参考                                  |
| 真正释放         | embedded/app-owner.ts:45                                                 | 与收起区分；不直接复制定制owner体系                              |

**实际问题**：`chat-runtime/chat-runtime-resolution.ts:79`要求`server_info.features.chatWorkspace`，随后调用`resolveChatWorkspace()`；旧server的`hidden-chat-workspace-service.ts:40`在Paseo运行目录建立Chat专用工作区。这是新增client/protocol/server协作，不是顶部tab或颜色变更。旧Build则回到完整工作区表面。

**先问用途，再谈选择**：先确认旧Chat是为了免选目录、避免动文件还是区分讨论/执行。若普通官方会话可满足目的，可省去定制后端；若隐藏工作区语义必需，则须解释并确认后端安装维护成本。不能以默认目录或提示词宣称Chat是只读沙箱。

v0.7.2固定源码的packages下没有chatWorkspace/resolveChatWorkspace/hidden-chat-workspace；虽有launchTarget kind=chat，却仍要求cwd。`packages/protocol/src/messages.ts:470`及`packages/server/src/server/session.ts:3496`要求实际目录；原生`new-workspace-screen.tsx:1975`提示先选项目。官方可通过`add-project-flow.tsx:709`调用createProjectDirectory，再以普通目录创建会话，因而无需定制后端也能一次选或新建一个普通文件夹；它会出现在官方工作区中，不具有旧Chat隐藏语义。

## R4 首选独立文档容器，降低宿主侵入

**拟定方案**：同站专用Paseo文档运行完整原生Web；Explore持久外壳按需创建iframe，独立页面直接打开同一应用。语言、presentation、可见/聚焦/前后台、公开作品草稿和ready/error通过受限桥接传递；会话事件、配对秘密和任意RPC不进入宿主。

**理由**：PR #11直接挂载曾需要改11个源码文件及9个Expo Router、React Native Web、Unistyles依赖文件以适配容器、路由、弹层和CSSOM，见[research R10](https://github.com/Vibes-college/Vibes/blob/c8f9d8c522226f6658b37d003b5f7b566185bd4a/specs/012-paseo-webui-loading/research.md#r10-接入选择与真实审批)。独立文档让Paseo有自己的window、路由和样式，先验证能否免去这些深层适配。容器不是CPU隔离，也不是天然安全沙箱，不预判更流畅。

**必须验证**：Astro导航保留同一iframe browsing context；root/sockets不重复；父页历史与iframe历史不互相劫持；键盘焦点、弹层、手机软键盘、宽度断点、中文/英文和独立刷新路径正确。若失败，先给出复现与最小补丁成本，再评估直接挂载；不同时维护两套交付架构。

**活动缺口**：旧`embedded/mount-environment.tsx`虽定义visible/focused/foreground，实际消费者只读surface；`use-client-activity.ts:69`和`utils/app-visibility.ts:22`仍看整页可见性。旧收起不能证明官方已inactive。v0.7.2也有[整页可见性入口](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/utils/app-visibility.ts)，CSS隐藏iframe不自动等于document隐藏。只把三个宿主信号合成到官方活动入口，不接管恢复算法；隐藏后真实CPU、渲染与必要消息处理分别测。

## R5 Onboarding预加载与阶段目标

**决定**：先可见反馈，用户阅读安装引导时后台准备完整资源；已安装用户直接连接。第一次点击前无Paseo资源和连接，准备完成不自动配对、发送或启动任务。下载与应用初始化分别记录，初始化不得阻塞引导的输入和滚动。

**理由**：安装时间能够覆盖部分准备成本，但其长短因人而异；回访、首次已安装、冷缓存、慢网和加载失败必须有单独路径。不设固定等待，不以几秒演示推断全部网络条件。包体还可能影响解析/编译/初始化；运行时成本必须另测。

PR #11 B0记录JS gzip总量4,690,481 B，单次首次请求4,687,382 B；A4静态入口2,712,275 B、全部JS4,695,727 B。这些是旧实验的静态/单样本证据，不是CPU、内存或体验收益。原[实验冻结文件](https://github.com/Vibes-college/Vibes/blob/c8f9d8c522226f6658b37d003b5f7b566185bd4a/tests/fixtures/paseo-webui/frozen.json)仍标prepared-not-measured。

不沿袭首开减半、12配置/720样本或A3/A4的序列化器与分块加载器改造；先以未改官方Web和相同原生内容作对照，再测六阶段。首次总耗时保留观察，是否优化由体验瓶颈决定；公共Explore预算仍是硬门槛，不能把所有vendor排除统计。

## R6 生产环境与操作边界

当前main的`public/_headers`只有同源connect-src且不允许同站iframe。新实现需为明确的Paseo文档配置精确frame/relay/resource策略，父站与应用文档分别验证；同源iframe可访问同源内容，不把origin/source校验称为完整安全隔离。

PR #11已在真实生产策略下发现插件`globalThis.eval(clientBundle)`被拒绝，见[research](https://github.com/Vibes-college/Vibes/blob/c8f9d8c522226f6658b37d003b5f7b566185bd4a/specs/012-paseo-webui-loading/research.md)。必须盘点普通聊天、工具详情与审批的必要面板是否涉及该机制。无关入口可以不呈现；必要能力若受阻，先比较上游支持的静态/隔离方式，不能全站添加unsafe-eval或展示不可用按钮。

请求初始失败、模型/工具执行失败、连接丢失导致结果未知、停止后子进程继续分别呈现。测试拒绝/允许审批及网络丢包时实际提交次数，不能通过多等几秒、自动重试或替换UI声称解决后端执行边界。

## 证据状态

以上是固定源码与既有PR证据的只读核查；新分支尚无实现、安装、运行、性能或真机结论。用户要求先澄清核心场景和功能目的；plan是技术候选，tasks先组织讨论与方案收敛，确认后再在同一PR展开实施任务。
