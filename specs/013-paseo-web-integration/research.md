---
tense: 'frozen'
describes: 'Paseo原生接入的来源证据与维护边界'
status: 'in-progress'
amended-by: []
---

# 来源、取舍与待验证事项

## R1 从main重新接入，历史尝试作为证据

2026-09-08核对main为`0c210ee4742a6c80de7938688fb34f58674a0e8d`，当前没有助手。PR #10头为`e6e3bf863f6bb81b7b5a3206a31010cfca2e9214`；PR #11头为`c8f9d8c522226f6658b37d003b5f7b566185bd4a`；均为未合并Draft。本规格使用013，保留011/012编号与原分支，不修改其状态或清理资源。

**已确认的工作方式**：独立新PR，不整批cherry-pick旧实现。按固定源码研究可复用UI、宿主边界和回归场景，逐项记录候选补丁。用户倾向优先复用官方Web协调能力，并要求先澄清用途和取舍再实施；这替代早先直接延续assistant-ui的方向，随后用户明确选择旧验证的直接挂载，并授权在接入时作有收益的改进。

**理由**：PR #10的[连接所有权](https://github.com/Vibes-college/Vibes/blob/e6e3bf863f6bb81b7b5a3206a31010cfca2e9214/src/lib/assistant/connection-owner.ts)、[恢复器](https://github.com/Vibes-college/Vibes/blob/e6e3bf863f6bb81b7b5a3206a31010cfca2e9214/src/lib/assistant/recovery.ts)、[会话store](https://github.com/Vibes-college/Vibes/blob/e6e3bf863f6bb81b7b5a3206a31010cfca2e9214/src/lib/assistant/store.ts)、[操作账本](https://github.com/Vibes-college/Vibes/blob/e6e3bf863f6bb81b7b5a3206a31010cfca2e9214/src/lib/assistant/operation-ledger.ts)已承担连接代次、生命周期、订阅和快照竞争、权威历史及未知结果。这些是原生协调层应覆盖的验收清单，不再作为新架构移植。

**证据限度**：PR #10最终头未完成整体验证，其预览是较早SHA；PR #11的静态构建与部分中继、审批等证据不能证明新接入完整恢复或长期性能通过。模型任务中的预设测试失败、停止后子进程继续，与客户端重复卡片和恢复问题分开记录。

## R2 固定官方版本，保留应用协调层

**选定基准**：官方v0.7.2，提交`9400a49af670fdb5db4af58e73f8df98588dbea9`。这是可追溯、已有构建证据的比较基准，不宣称它是届时最新版本或已经验收。实现开始前核实对应官方App/CLI发行支持与同版daemon，避免混用服务端版本把差异归因于UI。

保留完整根providers、HostRuntimeController、HostSessionManager、SessionProvider、timeline/directory同步与原生操作路径；官方[根布局](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/app/_layout.tsx)、[host-runtime](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/runtime/host-runtime.ts)、[session-context](https://github.com/getpaseo/paseo/blob/9400a49af670fdb5db4af58e73f8df98588dbea9/packages/app/src/contexts/session-context.tsx)是核对入口。

来源和锁定方法参考PR #11固定[upstream.json](https://github.com/Vibes-college/Vibes/blob/c8f9d8c522226f6658b37d003b5f7b566185bd4a/third_party/paseo-webui/upstream.json)：官方锁文件SHA256为`0e8d199c6c1b4f6ed99cc0cf524bb589602d0996466ef80e3a4ec62f29d77e8f`，许可Apache-2.0。记录源、锁、补丁与产物摘要，升级时复核差异与恢复矩阵；官方源码也可能有bug。

PR #11已发现生产编译导致两个外部状态hook不更新，见其[research R13](https://github.com/Vibes-college/Vibes/blob/c8f9d8c522226f6658b37d003b5f7b566185bd4a/specs/012-paseo-webui-loading/research.md#r13公开作品草稿与生产历史状态失效)。候选先运行同类延迟恢复复现，确实仍失败才采纳函数级精确补丁；不照搬全部实验补丁，不因为出自官方就忽略缺口。

## R3 旧Chat定制边界与新预设需求

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

**用户确认的目的**：省去聊天前的目录浏览/路径记忆及Agent、模型、强度选择。新Chat是默认配置，正常执行与原生产出能力保留，不要求讨论/动手隔离或旧隐藏工作区；因此不需承接旧daemon/protocol定制。

v0.7.2固定源码的packages下没有chatWorkspace/resolveChatWorkspace/hidden-chat-workspace；虽有launchTarget kind=chat，却仍要求cwd。`packages/protocol/src/messages.ts:470`及`packages/server/src/server/session.ts:3496`要求实际目录；原生`new-workspace-screen.tsx:1975`提示先选项目。官方可通过`add-project-flow.tsx:709`调用createProjectDirectory，再以普通目录创建会话，因而无需定制后端也能一次选或新建一个普通文件夹；它会出现在官方工作区中，不具有旧Chat隐藏语义。

### 默认预设的源码可行性及代价

以下路径相对固定官方源；这是静态核查，尚未完成新预设的实际运行：

- `packages/client/src/daemon-client.ts:2260`已有createProjectDirectory；传parentPath为`~`可由daemon电脑展开，见server的`utils/path.ts:8`。网页可代填默认位置，免除列目录和用户记路径，不需shell或新RPC。
- `packages/server/src/server/project-directory-service.ts:72`的创建非幂等，同名EEXIST返回directory_exists，不保证既有对象是目录；`server/session.ts:6192`的addProject会验证目录。只复用验证过的目录，不删除或覆盖旧内容。注册失败还可能伴随回滚失败，必须保留实际错误。
- `createWorkspace`每次建立新UUID；现有`openProject(cwd)`走`workspace-provisioning-service.ts:285`的findOrCreateWorkspaceForDirectory，可按路径复用，但list→create并非原子且当前app没有直接调用。预设要避免每次打开重建，不能把它当作跨设备恰好一次保证。
- `packages/app/src/composer/draft/workspace-tab.tsx:174`接收workspace和provider/model/thinking默认值，继续由原生Draft/Composer创建会话。只准备草稿，首次发送再创建，减少空会话及初始化写操作。
- `hooks/use-providers-snapshot.ts:35`、`provider-selection/model-catalog.ts:3`与`resolve-agent-form.ts:164`提供实际模型及强度选择；Codex模型来自连接电脑的app-server model/list。当前需求已取消Luna预设：模型与Agent由用户从原生入口选择或恢复原生偏好，不能把本机Codex配置作为所有用户的前提。
- 原生RPC断线会reject等待响应，requestId不是持久幂等键。默认初始化在结果未知时先通过原生查询核对，不盲目重放目录/工作区/Agent创建，不借此引入第二套客户端恢复或账本。

新增维护面为有限的首次准备、默认值与异常提示；收益是免去必经设置。原生运行与同步完整保留，但上游升级仍需检查这些入口。

### 产出查看直接复用原生

用户已明确Paseo能查看哪些就沿用哪些，不新增格式能力。`components/message.tsx:2538`和`assistant-file-links/use-file-link.ts:286`将聊天结果文件交给工作区`panels/file-panel.tsx:31`；`file-pane/pane.tsx:237`使用原生readFile/subscribeFile读取。内部工作区和文件面板是这条基础路径的依赖，不能随“不要复杂文件管理”裁掉。

固定v0.7.2原生支持文本/代码、图片、Markdown与受限制HTML预览；`file-pane/source/view.web.tsx:1`的只读源码仍依赖CodeMirror。PDF/Office没有内建预览；`stores/download-store.ts:247`仅使用directTcp下载，纯relay不具备相同下载路径。以上是上游边界，不转化为新增预览/下载需求。

普通文件查看不依赖插件eval，但`file-pane/html-preview.web.tsx`与html-preview-csp.ts有独立sandbox/CSP，实际嵌入后须验证原有HTML呈现是否被父级策略破坏。以同版本官方支持范围选代表文件做回归，不要求用户逐项列格式，也不把上游限制描述为新实现失败。

## R4 采用已验证的直接挂载，精确保留容器边界

**决定**：用户明确选择旧项目、旧PR验证过的接入方式；采用PR #11 H的同页完整根挂载，允许改善代码与使用路径，不整批复制。此前提出独立文档候选，因已有经验复用及用户选择，不再维护第二种架构。

**收益与代价**：沿用H的路由、容器尺寸、弹层/焦点、CSSOM保留和三项活动信号，减少重新验证未知接入方式的工作。H仍需9个依赖文件的精确适配，升级维护成本真实存在；直接挂载不自动意味着更稳定或更低CPU。出处见[PR #11 R10](https://github.com/Vibes-college/Vibes/blob/c8f9d8c522226f6658b37d003b5f7b566185bd4a/specs/012-paseo-webui-loading/research.md#r10-接入选择与真实审批)。

选取H源码补丁：g1-direct-source、h-host-boundary、h-public-work、h-reactive-history、h-operation-feedback；依赖补丁按g1-direct-dependencies→h-focus-dependency顺序。另采纳不涉及拆包的h-native-types修正。新的产品补丁替换H手动附带和JSON后缀，使用R7的原生可删附件；不带A1—A4、graph-capture或旧实验框架。

**改进边界**：H的终止dispose会刷新文档，普通收起/导航/尺寸切换不得调用；加载失败只重试未完成资源。旧ChatScreen有文件打开noop，改为在当前原生WorkspaceScreen准备预设与顶部，完整保留产出链路。宿主与原生合同只增加surface和请求身份，不添加会话RPC。

**活动与验证**：旧fork曾只消费surface，H已接入visible/focused/pageVisible，保留这个完整入口并核对后台成本。Astro切页、返回、compact/full、弹层、软键盘、中文/英文必须在同一根实测；CSS隐藏本身不作为inactive或低成本证据。两项生产hook修正保留最小范围，并用延迟历史/连接状态复现证明必要性。

**依赖复用核查**：PR #11已安装官方树HEAD、origin、锁与9项依赖前置摘要匹配，Git干净；205个符号链接均为树内相对链接。复制到本任务独立目录后再次核对，不在原树应用补丁。采用独立普通/APFS写时复制，不使用文件硬链接或共享node_modules；无新增npm安装。

## R5 Onboarding预加载与阶段目标

**决定**：先可见反馈，用户阅读安装引导时后台准备完整资源；已安装用户直接连接。第一次点击前无Paseo资源和连接，准备完成不自动配对、发送或启动任务。下载与应用初始化分别记录，初始化不得阻塞引导的输入和滚动。

**理由**：安装时间能够覆盖部分准备成本，但其长短因人而异；回访、首次已安装、冷缓存、慢网和加载失败必须有单独路径。不设固定等待，不以几秒演示推断全部网络条件。包体还可能影响解析/编译/初始化；运行时成本必须另测。

PR #11 B0记录JS gzip总量4,690,481 B，单次首次请求4,687,382 B；A4静态入口2,712,275 B、全部JS4,695,727 B。这些是旧实验的静态/单样本证据，不是CPU、内存或体验收益。原[实验冻结文件](https://github.com/Vibes-college/Vibes/blob/c8f9d8c522226f6658b37d003b5f7b566185bd4a/tests/fixtures/paseo-webui/frozen.json)仍标prepared-not-measured。

不沿袭首开减半、12配置/720样本或A3/A4的序列化器与分块加载器改造；先以未改官方Web和相同原生内容作对照，再测六阶段。首次总耗时保留观察，是否优化由体验瓶颈决定；公共Explore预算仍是硬门槛，不能把所有vendor排除统计。

## R6 生产环境与操作边界

当前main的`public/_headers`只有同源connect-src。直接挂载需要固定relay及原生sandbox的精确策略，必须验证实际生产响应；同页挂载与严格字段校验不是安全沙箱。

PR #11已在真实生产策略下发现插件`globalThis.eval(clientBundle)`被拒绝，见[research](https://github.com/Vibes-college/Vibes/blob/c8f9d8c522226f6658b37d003b5f7b566185bd4a/specs/012-paseo-webui-loading/research.md)。必须盘点普通聊天、工具详情与审批的必要面板是否涉及该机制。无关入口可以不呈现；必要能力若受阻，先比较上游支持的静态/隔离方式，不能全站添加unsafe-eval或展示不可用按钮。

请求初始失败、模型/工具执行失败、连接丢失导致结果未知、停止后子进程继续分别呈现。测试拒绝/允许审批及网络丢包时实际提交次数，不能通过多等几秒、自动重试或替换UI声称解决后端执行边界。

## R7 文章引用的形态、资料与生命周期

只读宿主源码为`/Users/jachi/Desktop/Vibecoding-College/vibecoding-college`，HEAD `3e03a686df203c85475d6e49c2e6d2fed12c788e`；对应Paseo源码仍是R3记录的旧fork。宿主本节所列文件无未提交变化。

| 环节       | 精确路径与行为                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 文章入口   | 宿主src/features/works/components/work-detail-dock.tsx:23–43只给pageContext传surface/path/entity.kind/slug/title/href；summary虽另在workScope，但不发送            |
| 请求快照   | paseo-launcher-input.tsx:232–240和src/features/paseo/launch-source.ts:34–45为每次显式启动创建id，克隆页面引用和未发送问题；global-floating-paseo.tsx:235传入原生根 |
| 输入框应用 | Paseo的embedded/launcher-draft-bridge.tsx:64与composer/draft/input-draft.ts:183等待原生草稿hydrate，再由embedded/launcher-draft.ts:40保留其他附件并替换原Vibes引用 |
| 外观与删除 | composer/index.tsx:822使用AttachmentPill显示标题/Vibes页面说明，删除沿普通附件流程；旧onOpen为空，并非可以点开网页的超链接                                         |
| 实际提交   | composer/attachments/submit.ts:69调用embedded/vibes-page-context.ts:82转成原生text附件；服务端prompt-attachments.ts:29把它作为用户问题后的普通文本                 |

引用文本包含非可信资料标记、Surface、Path及Entity的类型/标题/slug/href，路径原为站内相对地址；没有全文、摘要、DOM抓取或额外自动读取。新站按已发布公开URL适配链接，不把旧站路由直接拷来。

原生草稿和已应用request id共同去重。删除后，同一次请求、Composer重新挂载、收起/展开和compact/full不会加回；仅浏览另一篇文章不会替换已有草稿。再次显式从文章Launcher发起新请求才重新附上引用。相关回归在旧embedded/launcher-draft.test.ts:243；删除后的附件持久化沿原生draft-store。

**需要适配的一处触发差异**：旧embedded/launcher-draft.ts:35对空问题直接退出，因此旧源码并不覆盖“尚未输入，点文章入口就自动附带”。按用户本次明确需求调整该触发，保留引用形态、删除和原生发送语义，不照搬空文本分支，也不新增手动附带按钮。默认保留已有草稿，不能一并继承覆盖已有问题的旧启动行为。

## R8 安装路径与兼容性核查

2026-09-08在线核对[官方入门](https://paseo.sh/docs)、[稳定版下载](https://paseo.sh/download)和[v0.7.2发行](https://github.com/getpaseo/paseo/releases/tag/v0.7.2)。下载页当前稳定版为v0.7.2；桌面支持macOS 13+、Windows与Linux，App自带daemon并自动启动。配对入口为Settings→所选host→Pair Device。CLI路径是安装@getpaseo/cli后运行paseo，按官方提示启用加密relay并显示配对码；provider CLI与登录凭据需先准备，手机仍需运行daemon的电脑。

只读连接核验：本机既有6767服务报告v0.5.0，PR #11隔离6792服务报告v0.7.2；不自动升级或替换用户服务。兼容实例真实Codex目录包含gpt-5.6-luna且默认强度medium，provider为ready/enabled；这仅证明当前这台电脑可提供该预设，不证明新UI已经执行成功，也不承诺其他用户都有同样模型。版本、真实执行及原生配对仍需在本PR浏览器路径核对。

## 证据状态

以上是固定源码与既有PR证据的只读核查；来源研究不作为新分支的运行、性能或真机结论。核心用途与直接挂载已经确认，plan/tasks按选定方案实施；阶段结论以本PR实际验证和原始证据为准。
