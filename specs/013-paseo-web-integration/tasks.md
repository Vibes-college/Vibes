---
tense: 'frozen'
describes: 'Paseo接入的实施与分阶段交付清单'
status: 'in-progress'
amended-by: []
---

# 原生接入实施任务

目的与直接挂载已确认，用户授权有明确收益的改进。上游路径均相对本任务隔离源码的`packages/app/`，最终以`third_party/paseo-webui/patches/`中可重放补丁交付；不提交临时源码或依赖。复用旧测试时以当前行为修订，不继承旧通过结论。

用户确认的布局与本地英语听写已完成本轮实现及阶段预览验收，范围见T033—T040：取消可见Chat/Build模式、保留首次预设与原生当前项目，compact纯聊天、full原生工作台，并处理iOS26输入/键盘/背景交互。T019其余页头快捷入口、T022完整插件/功能验收及后续性能/真机任务继续保留未完成；不把本轮完成称为完整第一阶段完成。

## 1. 来源与范围

- [x] T001 核对main、PR #10/#11与旧complete-root源码，在research.md记录来源和证据限度。
- [x] T002 在spec.md确认基础对话/执行/结果与原生产出查看，不新增格式预览或下载服务。
- [x] T003 在spec.md确认默认配置与已有项目两类用途，不承接旧隐藏工作区后端；本轮可见命名与状态归属按T033调整。
- [x] T004 在spec.md确认compact/full、独立模块含义、可删文章引用与安装期间预加载。
- [x] T005 在plan.md/research.md选定旧验证的直接挂载，解释依赖补丁维护代价与改进边界。
- [x] T006 核验并独立复制官方安装树到.scratch/paseo-webui/upstream及.scratch/paseo-native-edit/upstream；核对原树未改，不新增依赖安装。
- [x] T007 对spec.md/plan.md/tasks.md运行只读一致性分析，复核checklists/requirements.md可进入实施；确认忽略目录与职责分配。

## 2. 共用基础

- [x] T008 [P] 在tests/unit/paseo-webui-{build,dependencies}.test.ts及paseo-{build-config,asset-contract}.test.ts覆盖源/锁/补丁身份、依赖链、篡改/过期资源、失败清理与第三方修改保护。
- [x] T009 在third_party/paseo-webui/和scripts/paseo-webui-*.ts实现单产品可重放构建、独立目录、许可、资源回执；不带多配置实验引擎。
- [x] T010 在src/features/paseo-webui/{asset-contract,build-config}.ts与scripts/build.ts、astro.config.mjs、package.json、.github/workflows/中接入相同本地/CI产物；缺失或过期产物明确失败。
- [x] T011 [P] 在tests/unit/paseo-{webui-contract,page-context}.test.ts覆盖严格字段/URL、surface与文章requestId、空草稿触发及不可信数据边界，再实现src/features/paseo-webui/{contract,page-context}.ts。
- [x] T012 在tests/unit/{content-security,script-budget}.test.ts补安全与预算边界，再实现scripts/content-security.ts、script-budget.ts、budget.ts及public/_headers的原生手工连接策略、sandbox精确哈希、完整清单和Explore硬预算。

## 3. US1：首次准备后进入助手（P1）

独立验收：未启动无专用网络；点击有反馈；安装/已安装/已配对/失败路径能进入真实原生界面，资源就绪不冒充已连接。覆盖FR001—004、FR013、FR015、SC001—002。

- [x] T013 [P] 在tests/paseo-loading.spec.ts与tests/fixtures/paseo-webui/覆盖无首次点击请求、即时外壳、慢网/失败/重试、加载中收起、单根和回访，测试纳入正常test:e2e。
- [x] T014 在src/components/LocalAssistant*.astro、src/scripts/paseo-boot.ts、src/features/paseo-webui/host.ts、src/layouts/Layout.astro实现轻量引导、原生预载/挂载和明确重试；核验官方安装/Agent/配对入口与无JS说明。
- [x] T015 [P] 在原生src/embedded/、packages/app/index.ts及根布局补丁保留完整H挂载与原生协调层，扩展约定surface/requestId合同，限定dispose，复测生产状态hook修正。
- [ ] T016 用真实兼容Paseo完成安装说明、官方配对/已有配对恢复与资源失败路径，检查版本/浏览器/连接方式，原始证据存resources/evidence/013-paseo-web-integration/。

## 4. US2：默认预设与已有项目做事并查看产出（P1）

独立验收：首次预设后可直接输入；原生入口处理已有目录；执行、审批与产出可用；文章引用可删除且只随提交发送；compact/full不串会话。覆盖FR005—009、FR014、FR016—018、SC009—013。

- [x] T017 [P] 在原生src/embedded/*.test.ts覆盖默认目录已有/非目录/权限、可用模型与Luna缺失、重复准备/未知结果查询、草稿配置、一次性引用保留/删除/空文本。
- [ ] T018 在原生src/embedded/chat-preset.ts及原生draft桥接实现按host首次准备默认目录/工作区和Codex/Luna原生默认强度；只发送时创建Agent，缺配置给真实入口，不覆盖既有数据或后续原生项目选择；本轮调整由T034落实，完整首次异常矩阵仍需核验。
- [ ] T019 在原生src/embedded/toolbar.tsx与src/screens/workspace/workspace-screen.tsx接回遗漏的工作区菜单、Scripts及外部编辑器等页头快捷入口，并核对原生完整导航。Terminal、Changes、Git命令中心及文件窗口文本编辑等已有能力不能笼统写成缺失；本轮单头部与文件位置按T035处理，其余快捷入口继续后续，不新增Chat/Build可见模式。
- [x] T020 [P] 在原生src/attachments/types.ts、src/composer/、src/embedded/中实现可删文章AttachmentPill及普通text附件提交；按requestId一次性投递，保留既有草稿与原生失败行为。
- [x] T021 在src/components/LocalAssistant.astro、src/scripts/paseo-boot.ts及src/pages/[locale]/works/[id].astro实现显式文章引用入口和compact/full，保留文章阅读、原生根/草稿/焦点/滚动，手机不挤出不可用双栏。
- [ ] T022 在tests/paseo-chat.spec.ts、paseo-csp.spec.ts覆盖默认预设与已有项目实际目录/配置、空草稿引用/删除/发送、compact/full交替阅读、允许/拒绝审批、停止、文本/图片/Markdown/HTML原生文件路径；修复并验证原生插件加载、图片blob及用户配置直连/relay的宿主兼容边界，用真实Agent与内置浏览器复核并留证。本轮局部测试由T038执行，不能据此勾选完整插件与能力验收。

## 5. US3：继续浏览与恢复（P1）

独立验收：开合/切页/刷新/中断后状态可辨认；不重复提交、不丢草稿/位置；断开/忘记和收起含义一致。覆盖FR003—004、FR007—013、FR016、SC005—006。

- [ ] T023 在tests/paseo-recovery.spec.ts与tests/fixtures/paseo-webui/覆盖20轮开合/导航/语言/尺寸与草稿位置、单根/socket/监听器、4操作状态×3中断各3次；以daemon记录核对操作次数与迟到事件。
- [x] T024 在宿主host.ts/paseo-boot.ts及原生use-client-activity活动入口保留真实visible/focused/pageVisible、Astro CSSOM与根持久化；只修接入边界，不另写会话恢复器。
- [ ] T025 在tests/paseo-recovery.spec.ts及真实浏览器核对主动断开、忘记设备、迟到回调、其他设备保留、未确认创建的查询恢复和存储清除边界；记录原生限制，不能自动重发或声称停止全部子进程。

## 6. US4：六阶段持续体验（P1）

独立验收：按plan固定负载与环境对照SC001、SC003—005、SC007；资源数值解释体验，不以减包代替结论。覆盖FR001、FR010—011、FR014和SC008中的设备区分。

- [ ] T026 [P] 在tests/paseo-performance.spec.ts与tests/fixtures/paseo-webui/建立同Playwright计时/固定负载、同版本官方对照及未启动Explore对照；记录环境、SHA与原始证据路径，采样前冻结协议。
- [ ] T027 执行S0—S4桌面和手机模拟各20次交互及冷/暖组、输入/滚动/工具和收起后空闲/输出/审批对照，结果写resources/evidence/013-paseo-web-integration/并在PR解释限制。
- [ ] T028 执行S5固定负载60分钟/30轮开合，重复S2/S3并核对连接/监听器/DOM与CPU/内存趋势；有实测退化才修正及复测受影响路径。
- [ ] T029 在真实浏览器完成全主路径；iPhone软键盘、锁屏/后台/触摸与网络切换单列resources/evidence/013-paseo-web-integration/真机证据，无设备时明确待测并保留Draft，不把模拟勾作真机。

## 7. 文档与交付

- [ ] T030 在docs/features/local-assistant.md、相关阅读/浏览说明、docs/system/local-assistant.md及配置/接口/规则/交付文档同步完整操作路径、来源与有效验收；更新索引、PROJECT_ANALYSIS.md、docs-policy/docs-sources登记，语义审阅后再更新摘要。
- [ ] T031 第一阶段先完成整个当前PR的verify与budget、真实基本使用及同SHA release:preview的实际响应头/资源/原有媒体回归；PR工作台记录已测/未测、环境和预览，保存推送有效进度，交用户体验后再安排下一阶段。
- [ ] T032 由独立工作区的另一Agent审查整个PR及最终SHA，修复后复核；必要检查和实际验收全部完成才转Ready并同步spec/plan/tasks与索引complete，用户决定合并。

## 8. 本轮反馈：统一布局与本地英语听写

有界范围对应FR005—007、FR009、FR011、FR016—018和SC009、SC011—013；保留原有18项FR与13项SC编号。既有checklists/requirements.md的13项用于需求质量复核，旧Chat/Build名称按spec中的默认预设/已有项目用途解释，不代表继续保留可见模式或已通过产品验收；不修改既有勾选。以下实现与验证任务独立记录，不能代替T019、T022—T032中尚未覆盖的完整范围。

- [x] T033 在spec.md/plan.md/tasks.md固化用户确认的当前工作区、单头部、手机文件位置、iOS26键盘与local英语听写规则；复核既有checklist13项仍适用，不重新询问已确认范围、不改living说明或验收状态。
- [x] T034 [P] 在原生src/embedded/相关单测覆盖首次默认预设与后续项目选择，移除Chat/Build可见模式及双模式状态；compact从当前工作区选择原生最近会话或草稿，保留打开的文件/终端，不重建history或覆盖已有模型、草稿与项目。src/hooks/use-agent-form-state.ts沿官方初次解析调用src/embedded/chat-form-defaults.ts，仅为无偏好/显式配置/用户修改的新草稿临时补入真实Luna默认值；用src/embedded/chat-form-defaults.test.tsx验证加载、偏好保护和主动清空，不写第二份偏好。
- [x] T035 在原生src/embedded/toolbar.tsx、src/screens/workspace/workspace-screen.tsx及原生sidebar/pane组合实现单44px白色头部；compact仅新会话/full/收起与聊天，窄屏full保留原生会话切换，不加Agent/Terminal新标签菜单。src/components/left-sidebar.tsx修复关闭外框的透明点击拦截，新建工作区继续官方路由；src/embedded/mobile-files.tsx仅把Files入口放History/Plan下，关闭左菜单后经官方动作打开全宽高CompactExplorerSidebar/MobilePanelOverlay，点文件开原生file tab并关面板。复用官方窄屏判断、宽屏保留右栏，不另造文件树或状态；补实际菜单/面板回归，组合验收由T038记录。
- [x] T036 [P] 在src/components/LocalAssistant.astro、src/features/paseo-webui/host.ts、src/scripts/paseo-boot.ts及必要原生输入样式中修复iOS26输入自动缩放、compact软键盘可见视口定位和full背景点击/滚动穿透；保留手动缩放、compact文章操作、退出后的阅读位置与同一原生根，补宿主交互回归。真实iPhone结果仍由T038/T029单列验收。
- [x] T037 [P] 在原生src/composer/input/、src/composer/index.tsx、src/components/dictation-controls.tsx与必要use-dictation窄补丁中复用官方local英语听写。compact只有当前有文字才显示文字发送，空输入始终麦克风，焦点与曾点击不改变规则，清空立即恢复，仅有文章或其他附件也保留麦克风；删除粘性文字输入模式，录音发送确认及携带附件不变。compact和full均隐藏Realtime入口，仅保留听写，不改daemon语音配置。保留cancel、转写、retry/discard、失败草稿与晚回调保护；提交、停止Agent、模型选择关闭和拖入附件不隐式聚焦，显式文字快捷键保留。覆盖空输入聚焦、输入后清空、仅附件、确认结束不等于发送成功、重复点击/重试、取消后的晚结果；不新增中文/云STT或实时voice/TTS。
- [x] T038 在tests/paseo-chat.spec.ts、paseo-recovery.spec.ts及既有同配置fixture补本轮三浏览器专项：无可见模式、单头部、当前工作区最近聊天、file/terminal保留、窄屏无新增加号、新建工作区真实点击、Files原生全屏面板与打开文件后关闭、键盘尺寸与full背景隔离、听写主按钮和失败恢复。核对真实local英语能力与操作证据；iPhone Safari iOS26软键盘、缩放与真录音若未实测则明确待测，并继续保留T029未完成。
- [x] T039 源码与补丁稳定后，对照实际行为同步docs/features/local-assistant.md、浏览/阅读路径及docs/system/local-assistant.md和相关接口/配置/检查说明；解释操作与已知边界，保留有效旧证据及未测项，再更新code-revision，不提前宣称新布局或听写已实现。
- [x] T040 将本轮产品补丁按既有series/maintenance登记并重建唯一产物，运行原生必要测试/类型、整站verify与budget及同SHA阶段预览验收；在现有PR #12保存推送进度、更新操作说明和实际限制。不得删改断言或照抄旧SHA结果宣称全通过；若最终检查仅复现已获许可的同一WebKit音频限制，可按既有授权发布同PR阶段预览，并记录新SHA实际结果。不新建PR、不自动Ready/合并，完整工作继续按T019、T022—T032推进。

T038局部证据：2026-09-09在本任务隔离Paseo home与6797端口，复用电脑已存在的官方local模型，用模型自带7.435秒PCM16/16k英语样例经真实DaemonClient的start/chunk/finish取得转写，耗时2.618秒；原始结果见resources/evidence/013-paseo-web-integration/dictation/local-model-protocol.json。该证据只覆盖本地模型与官方协议，没有下载模型、配置云Key、录真实麦克风、验证手机或向Agent发消息；本项不单独证明T038界面路径，也不替代T029真机验收；本轮组合结果见下方。

T038局部界面证据：2026-09-09以已验证的原生资源`/vendor/paseo/f2b0b0f4c78f6118/`在本地Chromium测试麦克风设备输入合成英语，未替换原生录音音频链路，经官方relay连接6797真实本地STT，再提交唯一1条用户消息，真实Codex Luna回复`ready`且0次工具调用。取消后无额外等待立即重新录音通过；提交后草稿为空、无输入焦点并恢复麦克风。原始结果见resources/evidence/013-paseo-web-integration/dictation/browser-ui/result.json；没有采集环境声音，不是物理麦克风、iPhone或Cloudflare上线验收。该证据早于最新导航调整，听写实现未变；T038组合回归及T040阶段预览的最终结果以下方产品SHA记录为准。

T038窄屏导航局部证据：2026-09-09原生资源`/vendor/paseo/2a1ab1b13702f684/`的三浏览器新建工作区入口3项通过；Files完整面板的关闭/重开、打开实际文本文件后进入原生标签并关闭面板、无额外加号及听写按钮规则共3项累计通过。首轮5项通过、桌面1项因读取布局切换前的菜单状态失败；测试等待官方窄屏切换控件后，该桌面项单独通过，未削弱面板/文件断言，不写成单轮全绿。实际531px浏览器也打开原生全高文件面板并进入工作区创建页面，没有创建新工作区；完整verify及云端预览结果见下方。

T038/T040本轮完成证据：2026-09-09产品提交`39a52ce924953d859e639da9e82737ef8b3736c9`正常执行`release:preview 12`退出码0；121项单测通过，三浏览器E2E 235项通过、5项条件跳过、0失败，budget通过；原生20个测试文件156项及app类型检查通过。跳过项为桌面不适用的2项触摸和1项移动可见视口测试，以及仅在桌面运行的内容生命周期在两个移动项目的2项跳过。本轮WebKit原生音频恢复用例通过，未使用发布例外，历史裸audio复现证据保留。原始发布日志及结果见resources/evidence/013-paseo-web-integration/preview-checks/39a52ce/{release.log,result.json}。

同SHA的[PR #12预览](https://pr-12-vibes-explore.topologic-relay.workers.dev/zh/)已核对release标识、中英200、CSP、noindex及原生前缀`/vendor/paseo/2a1ab1b13702f684/`。实际531×766云端浏览器确认窄屏无额外加号、新建工作区官方页面可达、Files打开44px宿主页头下的531×722原生完整面板、白色单行页头、清空输入恢复麦克风；compact/full均隐藏Realtime且麦克风可用，实际默认模型为Luna。未创建工作区，未把模拟浏览器或既有合成音频证据作为实体iPhone、云端物理麦克风验收；T029及其他完整范围仍未完成，PR保留Draft。验收结果绑定上述产品提交，后续规格状态记录不作为新SHA的整站验收。

## 依赖与并行

T001—T007确定范围和任务；T008/T011可独立，测试先于对应实现。T009→T010→T012形成构建基础；T011后宿主T013—T014与原生T015、T017—T020分目录并行，最终结合到同一产物执行T016/T021—T022。T019/T020虽不同职责，同一个隔离源码由一Agent串行编辑；最终补丁登记交给构建Agent。

US1先建立最小可体验接入，US2补齐完整做事路径；US3在同一个实例验证恢复，不另做替代客户端。T023测试先于对应T024修正。T026可与正确性测试准备并行，T027—T029依赖US1—US3基本正确，T028不得用固定sleep冒充负载。T030随实现同步；T031依赖最终产物和语义文档，T032以最终SHA复核。独立审查不代替真实验收。

本轮T033确定边界，T034/T035原生工作区与T037 Composer听写分文件协调，T036宿主可并行；同一原生文件不由多个Agent同时写。T038在对应实现后组合验证，T039等实际源码稳定再更新现状说明，T040使用同一最终补丁和源码。T026—T029的完整长时/真机矩阵、T022插件修复和T032最终Ready审查不扩入本轮；相关真实失败继续报告。

## PR工作台与经验复核

同一Draft PR按任务保存进度、可体验预览与验证限制；不合并或清理PR #10/#11。合并后按docs/system/checks-and-release.md逐commit及最终差异复核docs、同SHA部署/上线验收、同步主目录并清理本任务资源；用户尚未授权合并，不将此后动作记作已完成实现任务。LESSONS中的导航、真机与WebKit媒体回归经验继续适用。
