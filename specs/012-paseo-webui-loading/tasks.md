---
tense: 'frozen'
describes: 'Paseo原生助手分层加载实验与交付任务'
status: 'draft'
amended-by: []
---

# Paseo原生助手分层加载任务

依据：[规格](spec.md)、[技术计划](plan.md)、[技术取舍](research.md)。所有框均为待执行，制定计划不表示安装、实现或实验通过。以下新文件是拟建路径，按任务创建；UP指按固定SHA取得的`.scratch/paseo-webui/upstream/`，对UP的变更须保存到`third_party/paseo-webui/patches/`，不提交整个上游源码。

## 基础与阻塞关卡

目的：可重现官方版本与实验环境；G0/G1未通过不铺开产品。关联FR001—FR002、FR007—FR008、FR011及SC001—SC008。

- [ ] T001 盘点上游锁文件依赖、postinstall/prepare和实验实例/端口，向用户说明新增安装必要性并取得许可后才安装；固定官方SHA及锁文件摘要到third_party/paseo-webui/upstream.json，实验配置写resources/evidence/012-paseo-webui-loading/environment.json，不覆盖现有daemon。
- [ ] T002 在scripts/paseo-webui-build.ts与third_party/paseo-webui/patches/建立源码获取、严格补丁重放、官方生产导出、许可保存与来源校验；在tests/unit/paseo-webui-build.test.ts覆盖错误SHA、补丁不匹配与失败不复用旧产物。
- [ ] T003 在resources/evidence/012-paseo-webui-loading/compatibility/验证WebUI0.7.2对现有daemon及同版隔离daemon的实际配对/会话/工具/审批/恢复，固定主实验版本配对；失败先定位，结论写specs/012-paseo-webui-loading/research.md。
- [ ] T004 在scripts/paseo-webui-manifest.ts生成B0全量文件、哈希、同步/异步依赖与压缩清单，记录源码图和实际请求到resources/evidence/012-paseo-webui-loading/baseline/；生成前后配置不得混用旧版本数据。
- [ ] T005 在.scratch/paseo-webui/probes/验证受控模块挂载入口、独立React、官方providers、history/CSS/焦点/滚动/动态前缀；有限适配不成立时试同源文档容器及Astro不重载条件，选择唯一接入方式并将证据/补丁路径写specs/012-paseo-webui-loading/research.md。
- [ ] T006 在src/features/paseo-webui/contract.ts定义幂等挂载、展示状态、公开作品草稿、可操作/错误/收起及真正退出边界；在tests/unit/paseo-webui-contract.test.ts覆盖字段/长度/未知事件及禁止秘密/任意RPC，独立文档模式额外验证source/origin。
- [ ] T007 在scripts/paseo-webui-experiment.ts与tests/fixtures/paseo-webui/冻结B0/H/A1—A6/A/B/P配置、W0—W5输入及哈希、冷暖缓存、版本和采样规则，输出审核资源上限与基线摘要到third_party/paseo-webui/budget-baseline.json，原始证据存resources/evidence/012-paseo-webui-loading/baseline/；验证无结果数据不得生成通过结论。

## US1（P1）：普通浏览零助手加载，首次打开可恢复

独立验收：未打开助手时专用运行资源/连接为0；点击后加载成功或可见失败可重试；重复点击、关闭重开、文章导航不重复初始化。依赖T001—T007。

- [ ] T008 [P] [US1] 在tests/paseo-loading.spec.ts先覆盖普通浏览零专用请求、无JS提示、并发点击、离线首次打开、失败重试、加载中关闭及重开；基于生产导出检查网络，不只看DOM。
- [ ] T009 [US1] 在src/components/LocalAssistant.astro、src/scripts/paseo-boot.ts与src/layouts/Layout.astro加入轻量入口与首次主动加载边界，保持原Explore布局、页面导航及普通脚本预算。
- [ ] T010 [US1] 在src/features/paseo-webui/host.ts及third_party/paseo-webui/patches/落实G1选定接入、单个长期容器、官方初始化顺序和重试；隐藏/导航不调用dispose，history与React运行时隔离。
- [ ] T011 [US1] 在public/_headers与scripts/content-security.ts落实固定资源前缀、实际中继及选定容器的最小CSP，tests/unit/content-security.test.ts覆盖不扩大普通页面权限；浏览器验证真实MIME、WASM/worker/字体及禁用源失败。
- [ ] T012 [US1] 在scripts/paseo-webui-manifest.ts、scripts/script-budget.ts、scripts/budget-policy.ts及scripts/budget.ts增加受控助手初开/总量分类；tests/unit/script-budget.test.ts及tests/unit/paseo-webui-manifest.test.ts覆盖未知资源、静态泄漏、共享依赖和懒加载资源漏计，保持main现有门槛。
- [ ] T013 [US1] 在scripts/build.ts、scripts/paseo-webui-build.ts与tests/paseo-loading.spec.ts验证正式构建资源前缀、版本化缓存、旧运行页面跨发布后首次打开可选功能及404可见恢复；部署清单不混入实验配置。
- [ ] T014 [US1] 运行tests/paseo-loading.spec.ts及整站浏览/阅读回归，保存H与B0首开/重开和零加载证据至resources/evidence/012-paseo-webui-loading/host/，核对焦点返回、320px、手机与桌面滚动。

## US2（P1）：原生聊天与持续输出可用

独立验收：原生配对、会话/模型/目录、公开作品资料、文字流、工具、审批与停止可实际完成；没有另建客户端。依赖US1。

- [ ] T015 [P] [US2] 在tests/paseo-chat.spec.ts覆盖会话/模型/目录选择、作品附带与取消、工具完成/失败、审批拒绝/允许及结果未知；测试只使用受控夹具，不记录配对秘密。
- [ ] T016 [US2] 在third_party/paseo-webui/patches/保留官方根providers、HostRuntime、SessionProvider与聊天呈现，接通src/features/paseo-webui/host.ts；对照UP/packages/app/src/app/_layout.tsx与src/contexts/session-context.tsx核验未被外围拆包切断。
- [ ] T017 [US2] 在src/features/paseo-webui/page-context.ts与third_party/paseo-webui/patches/实现发送前可查看/取消的公开作品草稿，保持原生composer发送路径；在tests/unit/paseo-page-context.test.ts验证长度、链接和资料不提升为指令。
- [ ] T018 [US2] 在tests/paseo-chat.spec.ts与third_party/paseo-webui/patches/核对真实停止确认、错误、结果未知和子进程可能继续的提示；关闭面板/断开不伪称停止，不自动重发权限请求。
- [ ] T019 [US2] 在tests/paseo-performance.spec.ts建立更新采样，复用UP/packages/app/e2e/browser/agent-stream-smoothness.spec.ts与diff-performance.spec.ts的有界负载/断言，记录历史行渲染、解析、diff构建、输入响应、长任务及测量开销。
- [ ] T020 [US2] 依据T019证据在third_party/paseo-webui/patches/的独立可选P补丁组中只优化已确认热点，保留虚拟化/reveal/diff窗口化/呈现上限及canonical核对；在resources/evidence/012-paseo-webui-loading/render/保存P补丁或无额外补丁理由、W1—W4结果与审批即时性证据。

## US3（P1）：恢复、前后台与忘记设备

独立验收：宿主收起/导航/刷新/网络变化后权威状态正确，零串会话/重复操作；主动断开不自动连接，忘记设备不会被迟到事件恢复。依赖US1、US2基础路径。

- [ ] T021 [P] [US3] 在tests/paseo-recovery.spec.ts建立乱序、缺口、回执丢失、订阅/历史失败、旧代迟到及审批切会话夹具，区分socket连接与权威核对完成；断开与忘记成功标准单独定义。
- [ ] T022 [US3] 在third_party/paseo-webui/patches/和src/features/paseo-webui/host.ts将宿主presentation与上游AppState/document/focus合成，保留官方恢复/活动规则；验证收起不停止同步，展开不新增provider/runtime。
- [ ] T023 [US3] 在tests/paseo-storage.spec.ts盘点registry、IndexedDB副本、草稿/布局存储边界，验证忘记后异步删除、刷新不连接、迟到事件不复活及另一host不受影响；必要呈现修正置third_party/paseo-webui/patches/。
- [ ] T024 [US3] 在tests/paseo-recovery.spec.ts执行每候选100次适用恢复循环及额外20次断开/忘记检查，保存场景、耗时、失败与资源计数至resources/evidence/012-paseo-webui-loading/recovery/；最终A/B配置就绪后重跑，不把早期结果算最终验收。
- [ ] T025 [US3] 在resources/evidence/012-paseo-webui-loading/iphone/执行计划中的真实Safari后台、锁屏、切网及长离开矩阵，记录设备/OS/网络/版本/覆盖与视频或截图；缺真机标未测，不能用模拟勾选。
- [ ] T026 [US3] 在tests/paseo-resources.spec.ts验证100次开关/恢复后的连接、订阅、缓存范围和稳定后堆曲线；对重复活动或泄漏按来源修正third_party/paseo-webui/patches/，保留重测前后证据。

## US4（P2）：外围按需与构建精简

独立验收：A按需加载且可用，B无对应构建资源并有合理替代；两者核心任务一致。US5最终选择依赖本故事，因此在US5最终实验前实施。依赖US1—US3基础路径；完整恢复/真机验收在最终组合后执行。

- [ ] T027 [US4] 在third_party/paseo-webui/patches/对UP/packages/app/src/components/markdown/fence/实现Mermaid生产拆包探针；tests/paseo-features.spec.ts验证普通聊天不下载、展开才加载、重开缓存、失败重试和原隔离策略，证据写resources/evidence/012-paseo-webui-loading/probe-mermaid/；G2失败先定位不扩展其余功能。
- [ ] T028 [US4] 在third_party/paseo-webui/patches/将UP/packages/app/src/panels/register-panels.ts的轻量注册与终端/编辑器重实现分离，保留官方上下文；tests/paseo-features.spec.ts验证深链接、保存布局和加载失败回退。
- [ ] T029 [US4] 在third_party/paseo-webui/patches/落实终端/编辑器卸载资源清理与草稿/位置保留；tests/paseo-resources.spec.ts区分未挂载、已加载隐藏、卸载，验证不关闭远端terminal/Agent，重开输出正确。
- [ ] T030 [US4] 在third_party/paseo-webui/patches/处理共享语法高亮与复杂diff的按需边界，保留UP/packages/app/src/utils/highlight-cache.ts既有保护；tests/paseo-features.spec.ts验证工具/聊天/文件共用路径、复制原文与超长内容。
- [ ] T031 [US4] 在third_party/paseo-webui/patches/将九语言资源按选择加载、保留英文回退；tests/paseo-features.spec.ts验证首次语言、切换失败、无翻译键及核心中英文，B只包含中英清单。
- [ ] T032 [US4] 在third_party/paseo-webui/patches/拆分核心图标与UP/packages/app/src/plugins/icons.ts动态集合；tests/paseo-features.spec.ts验证A任意插件图标兼容和B具名回退，不限制真实插件工具/审批。
- [ ] T033 [US4] 在third_party/paseo-webui/profiles.json与scripts/paseo-webui-build.ts实现A/B构建配置和B明确排除清单，清除静态入口/路由/副作用；在tests/unit/paseo-webui-manifest.test.ts验证禁止模块真正退出、共享依赖保留、未知配置失败及许可完整。
- [ ] T034 [US4] 在tests/paseo-features.spec.ts逐项验证A完整可用Web能力与B替代行为，包含文件路径、旧布局、插件和未提供入口；保存功能差异表及A1—A6原始结果至resources/evidence/012-paseo-webui-loading/ablation/，保留未覆盖项。

## US5（P1）：公平比较并选择一个交付方案

独立验收：相同版本/接入/数据下可重现两个候选结果；正确性门槛、功能损失、运行与维护成本可审阅。依赖US1—US4最终构建；采样编排可提前准备。

- [ ] T035 [P] [US5] 在scripts/paseo-webui-results.ts和tests/unit/paseo-webui-results.test.ts实现配置/样本匹配、p50/p95、失败与缺失值分列、原始样本链接；覆盖不同daemon/输入哈希不可混算及空样本不通过。
- [ ] T036 [US5] 使用scripts/paseo-webui-experiment.ts执行B0/H/A1—A6/A/B及A+P/B+P采样，每配置至少10冷20暖，保留全量资源/实际请求/时间线/首开与可选首次等待到resources/evidence/012-paseo-webui-loading/comparison/。
- [ ] T037 [US5] 在scripts/paseo-webui-experiment.ts执行终端/编辑器/语法、图表/语法交互与B主要功能加回，记录共享依赖及组合收益；所有改变对应third_party/paseo-webui/profiles.json明确配置，禁止事后换轻负载。
- [ ] T038 [US5] 在resources/evidence/012-paseo-webui-loading/luna/完成每候选3次真实gpt-5.6-luna多文件、失败再修复、6000条JSONL、审批与停止任务，使用独立夹具副本并分开记录token/模型/工具/UI成本；不得暴露凭据或操作真实工作文件。
- [ ] T039 [US5] 对T036—T038最终配置重跑T024—T026，核对同SHA、daemon、手机与自动化覆盖，并在resources/evidence/012-paseo-webui-loading/final-matrix.json汇总正确性门槛及所有未测/失败。
- [ ] T040 [US5] 在.scratch/paseo-webui/rebuild/重新获取干净固定源码并重放补丁，比较构建输入/产物清单；将补丁文件/行数、核心侵入和相邻上游版本重叠分析写resources/evidence/012-paseo-webui-loading/maintenance/，不冒称未来升级已验证。
- [ ] T041 [US5] 在specs/012-paseo-webui-loading/research.md据证据推荐唯一候选，说明功能损失、性能波动、恢复与维护取舍；更新third_party/paseo-webui/profiles.json为唯一生产配置，失败或无可接受候选则报告原因、不伪造选择。

## 验证与现状同步

- [ ] T042 更新docs/features/local-assistant.md与docs/system/local-assistant.md，完整说明打开、配对、存储、使用、恢复、忘记与错误路径，以及版本/构建/配置/预算/许可/实验边界；对照最终源码设置code-sources/code-revision，未测项保留。
- [ ] T043 更新受影响docs/features/article-read.md、explore-browse.md、project-commands.md及docs/system/checks-and-release.md、docs/features/README.md、docs/README.md和specs/README.md，按实际导航行为补新旧规格互引，冻结正文不改；无实际变化不机械刷新摘要。
- [ ] T044 在resources/evidence/012-paseo-webui-loading/verification/记录整个PR的verify、budget、受补丁影响的上游单元测试、真实浏览器验收及同SHA预览；scripts/release.ts只发布选定配置，实验资源不进入正式资源清单。
- [ ] T045 在specs/012-paseo-webui-loading/checklists/review.md记录独立Agent整个PR最终SHA审查、风险、问题修复及复核，必要检查通过才Ready；Ready后改代码须退Draft并重新验收，合并仍由用户决定。
- [ ] T046 核对specs/012-paseo-webui-loading/spec.md、plan.md、tasks.md与checklists及specs/README.md的FR/SC覆盖和真实勾选；全部实施任务完成才同步complete，保存推送并更新PR #11当前进度/阻塞/预览与验收清单。

## 依赖、并行与交付策略

依赖主线：T001→T002→T003/T004→T005→T006/T007→US1→US2基础→US3基础→G2/US4→US5最终实验→文档/整体验证/独立审查。T019—T020先测共同运行机制，最终P需在A/B复核；T024—T026先验证核心，T039明确要求最终两候选重跑，不以先前SHA证据替代。

安全并行只表示任务依赖允许，不授权额外Agent：T008与T009可分别准备测试/入口，T015与原生接入可分文件推进，T021与展示信号适配可分文件推进；T035可在T007冻结数据格式后与US4并行。US4大多修改同一补丁集合/测试文件，顺序执行；真实模型和浏览器性能采样串行，不能并发竞争同一会话/设备。

最小可体验阶段为US1+US2核心路径，加上US3基本恢复正确性；单独一个打开按钮不算可交付助手。随后外围拆包/精简，再最终实验选择。G0/G1/G2失败按plan停止扩面，只修最小阻碍并保存证据。所有任务路径为实际文件或明确拟建文件，不以创建空模块完成任务。

## PR工作台与经验复核

[PR #11](https://github.com/Vibes-college/Vibes/pull/11)阶段清单引用本文件；每个阶段暂停/交接前保存推送有效进度，按需提供预览。落实LESSONS中的异步导航隔离、健康服务复用和真实iPhone验证。原始证据去秘密保存在resources/evidence，临时构建在.scratch，旧PR #10及其资源不清理。

合并后的逐commit与最终差异文档核对、正式部署SHA与页面验收、主目录同步和cleanup:task按仓库收尾规则执行并记录PR评论；这些不是可提前勾选的实现任务，也不为事后勾选改冻结正文。用户未授权合并前不自动合并，未验收正式部署不清理。
