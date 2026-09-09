---
tense: 'frozen'
describes: 'Paseo接入的实施与分阶段交付清单'
status: 'in-progress'
amended-by: []
---

# 原生接入实施任务

目的与直接挂载已确认，用户授权有明确收益的改进。上游路径均相对本任务隔离源码的`packages/app/`，最终以`third_party/paseo-webui/patches/`中可重放补丁交付；不提交临时源码或依赖。复用旧测试时以当前行为修订，不继承旧通过结论。

当前按用户最新要求先交可体验快照：暂停接回漏掉的入口，以现有原生接入完成必要检查和真实使用核验后提供Cloudflare预览及操作说明。T019未接回入口、T022完整插件/功能验收及后续性能/真机任务保留未完成，不将当前预览宣称为完整第一阶段完成。第一阶段最终目标仍是完整Paseo Web界面与功能接入，按用户体验反馈再继续。

## 1. 来源与范围

- [x] T001 核对main、PR #10/#11与旧complete-root源码，在research.md记录来源和证据限度。
- [x] T002 在spec.md确认基础对话/执行/结果与原生产出查看，不新增格式预览或下载服务。
- [x] T003 在spec.md确认Chat默认配置与Build已有项目入口，不承接旧隐藏工作区后端。
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

## 4. US2：Chat/Build做事并查看产出（P1）

独立验收：Chat可直接输入；Build处理已有目录；原生执行、审批与产出可用；文章引用可删除且只随提交发送；compact/full不串会话。覆盖FR005—009、FR014、FR016—018、SC009—013。

- [x] T017 [P] 在原生src/embedded/*.test.ts覆盖默认目录已有/非目录/权限、可用模型与Luna缺失、重复准备/未知结果查询、草稿配置、一次性引用保留/删除/空文本。
- [ ] T018 在原生src/embedded/chat-preset.ts及原生draft桥接实现按host准备默认目录/工作区和Codex/Luna原生默认强度；只发送时创建Agent，缺配置给真实入口，不覆盖既有数据。
- [ ] T019 在原生src/embedded/product-header.tsx与src/screens/workspace/workspace-screen.tsx实现Chat/Build入口并保存各自选择；页头复用原生工作区菜单、Scripts与原生操作栏，完整保留Terminal、Git、编辑器、导入/Setup、Explorer、file pane、native navigation及官方工具/审批，不以精简删除入口。
- [x] T020 [P] 在原生src/attachments/types.ts、src/composer/、src/embedded/中实现可删文章AttachmentPill及普通text附件提交；按requestId一次性投递，保留既有草稿与原生失败行为。
- [x] T021 在src/components/LocalAssistant.astro、src/scripts/paseo-boot.ts及src/pages/[locale]/works/[id].astro实现显式文章引用入口和compact/full，保留文章阅读、原生根/草稿/焦点/滚动，手机不挤出不可用双栏。
- [ ] T022 在tests/paseo-chat.spec.ts、paseo-csp.spec.ts覆盖Chat/Build实际目录/配置、空草稿引用/删除/发送、compact/full交替阅读、允许/拒绝审批、停止、文本/图片/Markdown/HTML原生文件路径；修复并验证原生插件加载、图片blob及用户配置直连/relay的宿主兼容边界，用真实Agent与内置浏览器复核并留证。

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

## 依赖与并行

T001—T007确定范围和任务；T008/T011可独立，测试先于对应实现。T009→T010→T012形成构建基础；T011后宿主T013—T014与原生T015、T017—T020分目录并行，最终结合到同一产物执行T016/T021—T022。T019/T020虽不同职责，同一个隔离源码由一Agent串行编辑；最终补丁登记交给构建Agent。

US1先建立最小可体验接入，US2补齐完整做事路径；US3在同一个实例验证恢复，不另做替代客户端。T023测试先于对应T024修正。T026可与正确性测试准备并行，T027—T029依赖US1—US3基本正确，T028不得用固定sleep冒充负载。T030随实现同步；T031依赖最终产物和语义文档，T032以最终SHA复核。独立审查不代替真实验收。

## PR工作台与经验复核

同一Draft PR按任务保存进度、可体验预览与验证限制；不合并或清理PR #10/#11。合并后按docs/system/checks-and-release.md逐commit及最终差异复核docs、同SHA部署/上线验收、同步主目录并清理本任务资源；用户尚未授权合并，不将此后动作记作已完成实现任务。LESSONS中的导航、真机与WebKit媒体回归经验继续适用。
