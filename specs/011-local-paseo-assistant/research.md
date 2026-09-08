---
tense: 'frozen'
describes: '发布SDK与本地助手接入取舍'
status: 'in-progress'
amended-by: []
---

# 发布SDK与本地助手接入取舍

## 官方daemon与单连接

采用官方`@getpaseo/client@0.7.2`，一条DaemonClient连接用`createPaseoApi`取得公开会话与provider能力。发布API缺少完整取消和审批确认，集中调用internal的cancelAgent及respondToPermissionAndWait；不把旧fork的隐藏Chat服务视为官方协议。放弃整套Expo嵌入，避免继承旧路由、门户和资源体积。依据：[发布包](https://registry.npmjs.org/@getpaseo/client/0.7.2)、[官方SDK边界](https://github.com/getpaseo/paseo/blob/main/packages/client/README.md)。

## 完整复用assistant-ui官方界面

用户明确要求采用完整官方开源UI与Elements，不能只用runtime再自行拼接外壳、会话选择和工具卡。采用官方registry的Thread、AssistantModal、ThreadListSidebar、ModelSelector、Sources及递归依赖，保留完整源码和默认布局；通过ExternalStoreRuntime接Paseo，开发集中于数据、恢复、审批和作品上下文。源码在src/components/assistant-ui/elements/与src/components/ui/，来自2026-09-07官方registry，以shadcn4.21.0安装；runtime0.15.18、Markdown0.14.14固定，组件由Git保存。适配涉及中文、Paseo能力、数据/动作、历史/上下文槽位和样式作用域，MIT许可在public/licenses。未支持能力隐藏，不虚构语音、附件或重新生成；没有Assistant Cloud服务实例。

普通审批映射官方ToolFallback approval并等待daemon确认，多问题使用相同容器和官方表单保留协议字段；推理为reasoning，工具为tool-call，作品为Sources。Markdown关闭原始HTML、限制链接并阻止消息图片自动请求。依据：[ExternalStoreRuntime](https://www.assistant-ui.com/docs/runtimes/custom/external-store)、[发布元数据](https://registry.npmjs.org/@assistant-ui/react/0.15.18)。

## 配对与浏览器入口

ConnectionOffer v2含serverId、daemonPublicKeyB64、relay endpoint/useTls。官方解析器不限定地址且只检查公钥非空，应用需补32字节长度、输入上限及官方WSS精确允许列表。配对是设备信任材料，默认标签页存储，可主动记住或清除，不进入日志和网站服务端。官方relay仅转发加密数据；不让浏览器持有模型API密钥。依据：[安全说明](https://paseo.sh/docs/security)、[协议发布元数据](https://registry.npmjs.org/@getpaseo/protocol/0.7.2)。

relay@0.7.2的浏览器/import入口指向tarball不存在的src/e2ee.ts，Node条件指向实际dist/e2ee.js；在Vite对精确子路径使用createRequire.resolve alias，不全局启用Node条件，也不复制密码实现。依据：[relay发布包](https://registry.npmjs.org/@getpaseo/relay/0.7.2)。

## 执行与恢复

发送默认interrupt并清pendingPermissions，因此运行或待审批禁发；messageId只提供部分时间线去重，不能当执行幂等保证，超时不自动重发。取消与审批等待daemon确认，不因点击就显示结束。selective_agent_timeline能力必须显式启用；每次重连重新订阅并refetch。Canonical seq/epoch是权威行号，同messageId可有多个文本片段，不能仅按messageId去重。先注册监听再取快照，缓冲增量并隔离generation。缺序号或缺口时重新读取，旧会话不能覆盖新选择。依据：[server发布元数据](https://registry.npmjs.org/@getpaseo/server/0.7.2)。

## 懒加载与交付

复用现有Astro持久节点和动态import，普通浏览不加载SDK或React聊天；assistant-boot→assistant.ts→assistant-app.tsx两级显式导入让大依赖预加载表留在点击之后；不增加每卡片React island。完整官方UI和SDK依赖实测约644KB gzip，以700KB设首次发布独立硬预算，不修改已存在的普通脚本/MDX门槛，静态引入不能逃逸。完整SDK包含多种daemon方法和协议验证，首版保留官方实现，不复制裁剪内部代码。无需新增托管服务：现有Cloudflare预览/生产流程仍是交付权威。模拟协议、真实daemon和真机证据分别验收。

2026-09-07在Cloudflare PR预览b2b458b使用独立Chromium持久profile测量，未拦截请求、未配对电脑。点击前助手入口请求为0；点击后9个JS响应采用zstd，压缩正文628553字节、Resource Timing传输量631253字节、解压正文3891313字节。首次点击至配对表单约1393ms；同页收起再开无新JS响应。关闭并重启浏览器后，9个JS均fromDiskCache，传输量0，点击至表单约315ms；ScriptDuration仍约71ms，缓存没有消除执行成本。计量范围为点击后JS，不含CSS、整个页面或网络/设备性能承诺。

JS响应均为`public, max-age=31536000, immutable`；首次浏览器加载时Cloudflare边缘7个HIT、2个MISS，说明浏览器冷缓存与边缘冷缓存不同。HTML实测`public, max-age=60, must-revalidate`。重启后的响应头是缓存保存的元数据，不据此声称新增边缘命中；以fromDiskCache及transferSize=0确认浏览器复用。原始去秘密数据在resources/evidence/011-local-paseo-assistant/cloudflare-cache.json，正式gzip预算为644514字节；单独SDK估算不能替代完整聊天依赖的实际传输。

## 手机恢复与同类项目对照研究（2026-09-07）

### 结论与证据边界

保留官方Paseo relay + daemon和按点击加载的assistant-ui路线；优先借鉴恢复状态机、可诊断错误、权威快照补齐，再根据实际长会话性能决定是否引入本地缓存。没有证据要求换relay、自建daemon或搬回整套Expo应用。这是研究建议，尚未实施后续产品改动。

用户在PR预览用手机Safari亲测：首次连接、消息收发、会话切换、工具展示、详情页上下文传递成功。深入任务中疑似浏览器相关`.js`工具多次报错，工具名/原文未知；离开浏览器一段时间后返回，显示“正在连接”，随后“电脑连接失败”，多次刷新状态未恢复；忘记电脑后回到配对输入。用户报告电脑进程仍存活，但未核验当时电脑是否持续唤醒、daemon到relay是否健康。设备/系统版本、离开时长、网络切换和故障时刻SHA未记录，不能把此前预览SHA当成本次故障已核验版本。以上为用户口述，非Agent重现；基础路径部分验收通过，长期恢复未通过。

读取基线：Vibes PR #10 `983a595666e1ce1decf08aef7c6d4fe176632dd6`；旧站`vibecoding-college`为`3e03a686df203c85475d6e49c2e6d2fed12c788e`；旧Paseo fork为`0e3318a94feb4d6def3d8266a8faffc8dc98e0d6`。旧站准入产物记录来源`7d4db8f45e8c35e56b67b636856bd1700f4c3c20`，本次比较的runtime、embedded、session-resume-revalidation与daemon-client路径在该来源和fork当前HEAD间无差异。旧项目保留原状，不启动构建或服务；旧有本地未跟踪文档与fork领先提交不处理。旧的local-only compact原型不能代表这个较新的complete-root实现。

外部快照已经浅克隆至本地主目录的`resources/references/remote-agents/`，不安装、不执行第三方应用。Lody iOS为`cd5482424d0fc46c1c43dd76d289cddca1e7ffad`，Cindy为`87994cd4a9ba85ab67cd7b521d986f72182ccbf7`。结论来自这些源码及测试阅读，不代表它们在相同iPhone/网络下实测更稳定，也不代表云服务已被完整审计。

### 同一条relay路线，差异在哪里

relay像转接站，daemon像电脑上的值班员，Agent才是执行任务的人。值班员进程存在，不等于值班员到转接站畅通；手机连到转接站，也不等于已连接正确的电脑、恢复了会话或获得了执行权限。

| 维度       | 当前Vibes                                                                    | 旧站完整Paseo                                                                                              |
| ---------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 产品职责   | Explore里的作品讨论/执行助手                                                 | 嵌入完整Paseo工作台，保留Chat、工作区、文件、终端等应用结构                                                |
| 接入层     | 发布SDK0.7.2 + 自有薄适配 + 官方assistant-ui                                 | 自有Paseo fork的Expo/React Native Web完整根应用；模块契约、外层壳、门户、路由恢复、准入产物一起维护        |
| 电脑端     | 使用官方daemon；已验收组合是daemon0.5.0/客户端0.7.2                          | 维护fork源码及应用/客户端/服务端的匹配关系；不能按npm版本号假定兼容                                        |
| 连接与身份 | 一个已配对电脑，仅官方WSS中继；默认标签页存储，可选记住                      | HostRuntime管理多个Host与多种connection候选、探测和选择；接入网站登录生命周期                              |
| 功能       | 会话、模型、目录、文字/推理/工具、审批、停止、作品来源                       | 完整工作台覆盖更多导航、文件/终端、目录同步及状态展示；不把有源码当作每项旧功能均上线验收                  |
| 加载       | 第一次点助手才import大依赖；收起和站内导航复用                               | 准入script/CSS经完整性校验再mount；当前旧站源码在已登录时也会主动beginModuleLoad，不能概括成全部点击后加载 |
| 数据恢复   | 正文在内存；连接后重新读目录/provider和所选会话tail，每页200、展示最多2000条 | 有目录/timeline副本、浏览器IndexedDB行存储、离开超过60秒触发历史同步代次更新；缓存先显示与权威更新分开     |
| 维护成本   | UI/SDK仍需适配；生命周期与错误恢复由我们补齐                                 | 能力更全，但fork升级、跨应用导航/样式/身份/存储与产物交付的耦合更大                                        |

旧项目真正值得保留的是“单一连接所有者、分层状态、缓存只是副本、晚到响应不能覆盖新状态”的经验。完整移植会同时带来不需要的工作台功能与持续维护成本；也不能证明可以自动治愈官方daemon或Safari的故障。

### 性能与加载策略

本次只重新量了旧站已有产物，未重新构建、运行或测量旧应用的CPU/内存。用Node `gzipSync`默认级别逐个压缩，与当前预算函数采用同类口径；MB/KB均为十进制。

| 数据           | 旧complete-root产物，本次本地测量         | 当前助手，既有PR验收数据                                              |
| -------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| JS原始体积     | 5个JS共20,858,112字节；入口20,847,107字节 | 既有线上记录9个聊天JS解压共3,891,313字节                              |
| gzip体积       | 5个JS共4,793,807字节；入口4,789,461字节   | 完整助手依赖预算644,514字节，门槛700,000字节                          |
| 实际网络传输   | 未测，不能把gzip当旧线上流量              | 既有Chromium预览zstd正文628,553字节，Resource Timing传输631,253字节   |
| 加载时机       | 已登录可主动载入大入口；有模块与样式复用  | 点击前聊天入口请求0；同页再开无新增JS                                 |
| 重启缓存与启动 | 无同环境测量                              | 既有桌面重启9个JS均磁盘缓存、传输0；冷/重启点击至配对表单约1393/315ms |

旧JS gzip总量约为当前助手预算实测的7.4倍；这只是下载体积对比，不是7.4倍的启动/耗电/内存差异，也不是相同功能集合的公平速度赛。当前从缓存加载仍需执行JS，既有桌面重启ScriptDuration约71ms；手机表现不能从桌面外推。代码缓存解决下载，消息缓存解决等历史，连接恢复解决能否操作，这三件事不能互相替代。

当前逐次resync会重新读目录/provider和历史，选会话先清行再取快照；容易实现和保持权威性，但网络不好时可读性和等待体验较弱。旧版IndexedDB、副本先显示以及Lody快照保留值得按需借鉴。增加消息持久化同时增加隐私、清理、容量、过期与跨代校验成本，不作为修复重连的前置工程。

### 当前故障能确定什么

1. **审批已经实现。** `approvals.ts`把pendingPermissions映射到官方审批卡，保留action ID；`store.permission`核对会话/requestId；`respondToPermissionAndWait`等待daemon确认。此前真实Chromium对隔离文件分别允许/拒绝已有证据，但不覆盖这次未知浏览器工具。新会话创建只指定provider，没有新增权限模式选择或自动提升权限。
2. **工具失败不必经过审批。** 浏览器脚本可能遇到依赖/运行环境/可用工具不同、页面或浏览器会话不存在、网络/命令错误，也可能受Agent/系统权限限制；这些均是排查分类，非已确定原因。必须有真实tool名称、错误类别及相关permission事件，才能判断是无请求、漏展示、响应未确认还是批准后执行失败。不能把`.js`后缀当作某种权限错误，更不能以开放全部权限作为默认修复。
3. **“刷新状态”不是强制重连。** 当前菜单和visibilitychange都调用`resync()`；driver不为connected时直接返回，菜单另有“重新连接”才调用`connect()`重建driver。界面把二者分开，但用户重复刷新无法恢复断开的通道，这是源码可确认的操作缺口。
4. **并不是完全没有心跳和自动重连。** 发布SDK0.7.2连接成功后每10秒安排探活，单次超时15秒，连续2次失败触发断开重连；默认指数退避1.5秒到30秒。应用连接超时设20秒。只加一个重连开关无法解决已有机制的失效场景。
5. **返回前台的恢复编排较薄。** 当前没有应用层的pageshow/online恢复入口，也没有在返回时主动探测后决定重建通道的流程。JS计时器受后台暂停影响是需要验证的假设；不能从源码直接断言这就是本次失败根因。
6. **故障可观测性不足。** `connect`捕获后统一显示连接失败，SDK logger全部关闭；应用没有把WebSocket、加密握手、serverInfo身份确认、目录/历史失败分别呈现为可分享的去秘密诊断。用户补充的“正在连接→失败”更应优先核查通道/握手阶段，而不只查resync。不要开启原样日志暴露offer/私有对话，应只采集阶段、错误码、耗时和版本。
7. **忘记电脑后回到输入页符合设计。** 它清除本浏览器的配对及会话索引，无法修复电脑到relay的链路；不应成为常规重连前提。还要区分同一标签页返回、新开标签页、浏览器重建、选择记住电脑与未选择的情况。

没有读取本次私人对话或故障日志，也没有在真机复现。因此保留“基础路径成功，深入工具故障及长期恢复未解决”的结论；不能沿用此前短暂断开/刷新通过的证据宣布这个新场景已通过。

### Cindy：最接近我们的远程控制对照

Cindy公开仓库含Electron桌面端、React Native手机端和共享device-link协议，远程操作调到桌面现有IPC能力；与我们一样由电脑执行。它使用账号/设备身份与自己的relay服务，不是官方Paseo配对协议，不能替换SDK即接通。服务端在独立仓库，本次未获得其实现，公开README中的服务端路由/Redis描述只能视为项目文档说明。

源码显示的可借鉴机制：

- **前后台分工明确。** 手机进入后台立即释放重会话订阅，默认2.5秒宽限后有界等待退订并停连接；返回时依据实际离开时长判断，超过10秒先stop再connect，避免以“定时器存在”推断已经关掉。快切也显式补齐，不能只等online事件。
- **多个超时都有出口。** token取得和hello握手各默认15秒；连接按1秒到30秒退避并加随机抖动；稳定在线10秒后才重置普通退避，另有1013拥塞冷却，避免反复互踢或重放洪峰。
- **区分假活与真实在线。** `restartConnection`连online也能重建并清理旧连接代；网络改变先合并提示并探测，不因一次网络事件立刻拆所有链路。有效业务入站也算活性；当前源码ping20秒，miss与80秒空闲窗口共同判死，不能照搬README旧的“两周期”描述。
- **断线后补齐业务状态。** rehydrate重新开具体设备链路、恢复订阅、取得会话快照，含消息、待交互和输入状态；瞬时失败继续退避恢复，撤权/远控关闭与离线分别处理。online只是恢复开始，不是完成。
- **可靠传输有完整代价。** 协商streamId/seq、累计ACK、分片、重放、确认代次、缓存上限和背压；桌面按来源/requestId及请求指纹去重并保留结果。ACK是进入本地处理状态机，不代表工具成功。其自动重放不能孤立搬来给Paseo发送任务，否则可能重复执行。
- **权限与运行条件是电脑端能力。** 远程调用白名单、目录边界、获取/解决待交互和权限模式操作由桌面校验；可选keep-awake阻止系统挂起但允许熄屏。Vibes网页无法代替本机管理这些条件。

取舍：能力完整、恢复和弱网分支细，但设备状态、订阅所有权、缓冲、账号、跨端版本及服务端依赖显著增加维护负担。公开device-link的发送是JSON信封经WebSocket，本次未见该通道等同Paseo的端到端加密握手；“relay不处理payload”不等于relay无法读取payload，不能以可靠传输的“端到端”字样作密码安全结论。源码中防重、重放、退避测试丰富，但未运行Cindy真机或云端长时验收，不宣称其连接永不掉线。

### Lody iOS：状态同步与原生体验对照

Lody iOS不是Paseo客户端，也不是单纯的一根手机到电脑WebSocket。它依赖远端Lody服务、Loro Streams和机器RPC，React Native负责应用层，Swift托管聊天与离屏WKWebView数据引擎。手机从流的快照和后续更新重建Loro文档，机器RPC写入请求流并长轮询回复流。

源码显示的可借鉴机制：

- **持久数据流与游标。** bootstrap读取snapshot/updates，再按offset/cursor补齐和long-poll；检查游标停滞、流关闭、大小和页数上限。目录流失败重新取得grant，2秒起指数退避至30秒。相较实时转发，断开期间的数据可通过服务端流补读；保留时长/服务端执行语义仍不能仅由iOS仓库证明。
- **原生看门狗。** Swift用主RunLoop上的2秒Timer检查JS引擎；启动20秒、ready后8秒未确认进入恢复，60秒最多重启3次。后台暂停健康计时，回前台给予新的宽限；WebContent进程终止也可重建并恢复关注会话。这里探的是JS运行时是否响应，不等于远端机器健康。
- **先展示最后完整快照。** SQLite保存展示投影，不保存CRDT本体或认证凭据；按用户/工作区/会话分键。界面在同步尚未完成时保留旧内容，用generation/revision拒绝晚到结果，并区分缓存可读和live可操作。
- **控制高频更新成本。** 会话保留一个活跃和至多三个后台同步；前景普通更新约100ms合并，最长200ms，后台约1秒；状态切换优先刷新。Swift聊天采用UICollectionView，避免所有消息都常驻渲染。对Vibes可先借鉴合并渲染和历史窗口，再根据实测考虑虚拟列表。
- **审批也是同步数据。** `respondPermission`检查真实requestId和optionId，再上传Loro增量；accepted意味着该层接收，不可直接等同电脑上的工具已获准并执行。上传失败记录未发送版本，由用户重试，不任意重放。

不能照搬的地方：Safari页面没有独立Swift看门狗、Keychain、原生SQLite和iOS后台任务控制；若照搬整套需要改成原生App并引入云端同步服务。另一个明确限制是session流读取catch后会标offline，`useSessionRuntime`提供手动reconnect；目录自动退避和运行时热恢复并不证明每种会话网络失败都自动恢复。不要把README中的“后台稳定”“毫秒级”“满帧”等表达当成已经对照验证的性能结论。本次根目录未发现LICENSE文件，package.json也未声明许可；长期研究可保留链接与源码快照，复制代码前另核实授权。

### 推荐取舍与下一步验证

| 优先级   | 借鉴内容                                           | 用户会感受到的结果                             | 代价与验证边界                                           |
| -------- | -------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| P1       | Cindy式前后台恢复编排，复用Paseo既有心跳           | 回来后有界恢复；不用反复忘记配对               | 先确认故障层；避免两个重试器互相打断，不能自动重发任务   |
| P1       | 连接阶段与工具错误分类、去秘密诊断                 | 能分清电脑离线、握手失败、权限待处理和工具报错 | 需要真实错误码/permission事件；不能靠猜测调高权限        |
| P1       | 回来后重订阅、权威历史/待审批补齐                  | 电脑继续工作的结果和待决定项能回来             | 当前已部分实现，重点补状态转换和失败重试，而非重写时间线 |
| P2       | Lody/旧Paseo的最后完整快照及过期状态               | 等连接时仍能阅读历史                           | 持久化须有清理和隐私边界，不能把旧审批当仍有效           |
| P2       | 合并流式渲染、按实际需要订阅                       | 长任务少卡顿、少传无关会话                     | 先测长历史/长输出；不能只比包大小                        |
| 暂不采用 | 全套Expo工作台、Cindy自有协议、Loro云同步、原生App | 当前首阶段没有直接必需收益                     | 协议/后端/产品范围改变，需要独立决策；未纳入实现         |

下一阶段先取得失败工具名与错误类别、实际浏览器/daemon/SDK版本、离开时长、手机网络变化、电脑唤醒及relay状态。只保留去秘密摘要，不采配对密钥和完整私人对话。分层判定：页面与资源加载→设备恢复→WebSocket/加密握手/serverInfo→目录/provider→会话订阅/快照→工具/审批执行。

建议真机验收矩阵：同标签页后台10秒/60秒/5分钟，锁屏恢复，Wi-Fi与蜂窝切换，网络中断再恢复，浏览器被系统重建，电脑睡眠再唤醒，daemon重启，待审批时离开，发出任务但回执丢失。每项核对自动/手动恢复耗时、同一会话、缺失回复补齐、审批真实性、无重复执行；与新开标签页及是否记住电脑分开。时间点是计划覆盖范围，不是承诺的恢复SLA；本次均未执行。

### 源码索引与长期对照方式

当前Vibes路径：`src/lib/assistant/{paseo-client,store,approvals,pairing,timeline}.ts`、`src/scripts/assistant-app.tsx`、`src/components/assistant/App.tsx`；发布SDK实物在node_modules/@getpaseo/client/dist/daemon-client.js，版本由锁文件固定。

旧站路径均相对`/Users/jachi/Desktop/Vibecoding-College/vibecoding-college`：`src/features/paseo/{global-floating-paseo,module-loader,admitted-module-loader,admitted-artifact.generated}.ts(x)`及public/vendor/paseo/complete-root-v1。旧fork路径均相对旁边的paseo-complete-root：`packages/app/src/runtime/host-runtime.ts`、`runtime/replica-cache/{index,row-store.web}.ts`、`contexts/session-resume-revalidation.ts`、`embedded/`、`chat-runtime/`、`packages/client/src/daemon-client.ts`。

| 固定对照源               | 可复核入口                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cindy连接和可靠传输      | [client.ts](https://github.com/makecindy/cindy/blob/87994cd4a9ba85ab67cd7b521d986f72182ccbf7/packages/device-link/src/client.ts)、[dispatch.ts](https://github.com/makecindy/cindy/blob/87994cd4a9ba85ab67cd7b521d986f72182ccbf7/apps/desktop/src/main/device-link/dispatch.ts)                                                                                                                                                                                         |
| Cindy前后台与业务补齐    | [DeviceLinkContext.tsx](https://github.com/makecindy/cindy/blob/87994cd4a9ba85ab67cd7b521d986f72182ccbf7/apps/mobile/src/device-link/DeviceLinkContext.tsx)、[backgroundConnection.ts](https://github.com/makecindy/cindy/blob/87994cd4a9ba85ab67cd7b521d986f72182ccbf7/apps/mobile/src/device-link/backgroundConnection.ts)、[rehydrate.ts](https://github.com/makecindy/cindy/blob/87994cd4a9ba85ab67cd7b521d986f72182ccbf7/apps/mobile/src/device-link/rehydrate.ts) |
| Cindy电脑边界            | [allowlist.ts](https://github.com/makecindy/cindy/blob/87994cd4a9ba85ab67cd7b521d986f72182ccbf7/packages/device-link/src/allowlist.ts)、[power-blocker.ts](https://github.com/makecindy/cindy/blob/87994cd4a9ba85ab67cd7b521d986f72182ccbf7/apps/desktop/src/main/device-link/power-blocker.ts)                                                                                                                                                                         |
| Lody运行时与看门狗       | [DataRuntime.swift](https://github.com/Innei/lody-ios/blob/cd5482424d0fc46c1c43dd76d289cddca1e7ffad/apps/mobile/modules/lody-kit/ios/Cloud/DataRuntime.swift)、[RuntimeHealth.swift](https://github.com/Innei/lody-ios/blob/cd5482424d0fc46c1c43dd76d289cddca1e7ffad/apps/mobile/modules/lody-kit/ios/Cloud/RuntimeHealth.swift)                                                                                                                                        |
| Lody数据流/机器请求/审批 | [index.ts](https://github.com/Innei/lody-ios/blob/cd5482424d0fc46c1c43dd76d289cddca1e7ffad/apps/mobile/modules/lody-kit/data-runtime/index.ts)、[session.ts](https://github.com/Innei/lody-ios/blob/cd5482424d0fc46c1c43dd76d289cddca1e7ffad/apps/mobile/modules/lody-kit/data-runtime/session.ts)、[machine-rpc.ts](https://github.com/Innei/lody-ios/blob/cd5482424d0fc46c1c43dd76d289cddca1e7ffad/apps/mobile/modules/lody-kit/data-runtime/machine-rpc.ts)          |
| Lody本地快照             | [LocalStore.swift](https://github.com/Innei/lody-ios/blob/cd5482424d0fc46c1c43dd76d289cddca1e7ffad/apps/mobile/modules/lody-kit/ios/Cloud/LocalStore.swift)、[useSessionRuntime.ts](https://github.com/Innei/lody-ios/blob/cd5482424d0fc46c1c43dd76d289cddca1e7ffad/apps/mobile/src/features/sessions/useSessionRuntime.ts)                                                                                                                                             |

长期入口见[本地研究资料柜](../../resources/README.md)。以后涉及重连、审批、长列表或移动端性能时，先保留本次SHA作为基线，再fetch上游新SHA只比较相关路径，记录版本、机制变化、适用边界与是否经过实测；不要直接pull覆盖唯一研究基线。没有建立定时跟踪或自动更新任务。源码可重拉，本文和固定提交链接随PR保存；第三方源码目录不提交，不作为本站依赖。
