---
tense: 'living'
describes: '自动检查与发布规则'
status: 'current'
shaped-by: ['002', '003', '004', '005', '009', '010', '011']
code-sources:
  [
    'package.json',
    'scripts/',
    'tests/',
    '.github/workflows/',
    'playwright.config.ts',
    'wrangler.local.jsonc',
  ]
code-revision: 'c25e584657b00370a8bc44984470b1c72a8393f7268d9bef248621f10d08d116'
---

# 检查与发布

## 检查入口

工作流.github/workflows/check.yml只监听PR活动与main push，保留手动检查和每周文档体检。PR活动为opened/synchronize/reopened/ready_for_review/converted_to_draft；描述/评论编辑不触发。分支push不再重复运行。scope通过scripts/check-scope.ts与ci-policy.ts输出范围与模式，失败或非法输出使正式检查失败。

Draft仅运行独立的Draft progress（npm run check，不启动浏览器或预算构建）；verify/budget跳过，不能视为已验收。Ready及后续修改按整个PR差异执行下表。PR较新运行取消旧检查；main运行不在上传途中取消，正式发布单独串行并拒绝旧SHA。Node22.20，普通检查contents:read，只有发布job持有Cloudflare secret；阶段预览在本机按需运行，不产生额外GitHub CI。

| 差异范围                                                      | verify任务                                | budget任务         |
| ------------------------------------------------------------- | ----------------------------------------- | ------------------ |
| docs：治理Markdown、宪章、项目模板                            | docs:check和format:check，不安装浏览器    | 明示不适用，不构建 |
| tools：文档检查器及其单元测试，可混合文档                     | npm run check，不安装浏览器               | 明示不适用，不构建 |
| full：网站内容、源码、数据库、依赖、CI/测试配置、其他未知路径 | npm run verify（check→本地D1→Playwright） | npm run budget     |

手动触发、空差异或范围基线不可读均选择full。分类包含删除、改名前后路径和本地未跟踪文件；src中的文章也属于网站变化。路径白名单由脚本与tests/unit/check-scope.test.ts维护。分类不取代测试：需要缩减新的工具范围时先证明它不影响网站。

PR基线为目标分支SHA；main范围从线上/__release.json的已发布SHA累计比较到当前源码，无法读取/非法/非当前历史时完整检查，防止旧网页提交被后续文档提交挤掉而漏发；checkout获取完整历史。冻结检查仍以事件比较提交和main共同祖先为准。DOCS_BASE_REF提供比较提交；冻结检查取它与origin/main的共同祖先，仅冻结已进入main的历史，不把未合并分支的complete稿提前冻结。无远端main的本地测试仓库可使用本地main，找不到有效基线仍失败。CHECK_BASE_REF用于范围分类。本地默认origin/main；冻结基线缺失仍失败，不因分类回退而绕过保护。远端main需保持最新。

每周一09:00UTC单独输出文档体检，行数和比例仅观察。Playwright失败追踪上传Actions保存7天；CI禁止test.only，测试不自动重试来掩盖不稳定断言。本地和CI均拒绝复用已启动的4322服务。整套浏览器用例串行执行，降低单个本地Worker的并发连接压力；全部设备与用例仍执行，不自动重试。浏览器测试关闭普通页面及独立缓存profile前等待有限资源请求结束，超时仍失败，避免本地代理在截断响应时退出；断言不重试。

功能文档可按操作路径归并；旧编号通过legacy-feature-ids追溯，缺失对应、重复编号或来源缺失仍失败。历史规格正文与现有冻结检查不变。

## docs:check红色意味着什么

| 错误                      | 含义与修复                                                     |
| ------------------------- | -------------------------------------------------------------- |
| 缺少front matter/状态无效 | 按模板填写tense、describes、status及对应关系数组               |
| 不在白名单                | 文档放错位置；临时稿移.scratch，额外产物在spec列明必要性和用途 |
| 索引不一致                | 在功能/spec索引补真实文件，删除失效条目，同步状态与影响功能    |
| 冻结正文修改/文件删除     | 恢复旧正文；新建spec记录新决定，并添加amends/amended-by        |
| 缺少双向关系/shaped-by    | 核对编号、旧新规格和当前功能的来源关系                         |
| 合并清单未完成            | 完成真实验收及最后的现状同步任务，不虚假打勾                   |
| 基线不可读取              | fetch origin main，或传有效DOCS_BASE_REF；不使用空基线绕过     |

篇幅提示不属于错误，不使CI失败；根据职责、重复和导航决定是否整理。

缺少标签会阻断项目治理Markdown；产品文章及固定上游资产采用自己的格式。自然语言是否精确表达现状仍需人工审核，脚本不使用禁词或固定任务措辞判断自然语言质量。

## 分支与PR的工作单位

仅需要Spec Kit的需求必须使用工作分支与PR，默认codex/前缀，按完整需求组织并复用未合并分支和已有PR。小修复、文档和小型规则补充直接在当前工作分支提交，不单独开PR；必要检查仍按实际影响执行。新工作从同步后的main开始；已有待合并的小收尾可以纳入下一次相关维护，先核对差异与范围，不夹带无关功能。已合并分支不继续承载新工作。

commit是保存进度，推送是备份或触发CI，PR是提交一批变化供审阅，合并才是进入main；它们不必同时发生。首版spec形成即创建Draft PR，AI给用户可打开的链接；描述维护目标、范围、任务摘要、当前进度、阻塞、下一步和阶段预览，详细清单以tasks.md为准。到可体验阶段、交接、暂停或结束前提交并推送有效进度、更新PR；不强制每commit立即push，也不限制领先commit数量。一个PR可包含多个commit；修改当前PR时直接继续提交，不另开修正PR。批量组织不等于无限累积，出现独立交付目的或需要单独回滚的变化时分开。

纯措辞和可选日期补记可以随相关工作一起提交；实现完成状态、当前行为与源码对应必须随同一批代码更新，不延后；不为每次小收尾创建PR或催用户合并。必要功能说明仍随代码交付；影响使用、发布或安全的错误及时修正，不为减少PR而延误。检查按实际改动范围选择，不能用批量提交规避检查。

## Ready前的独立审查

基础设施或重要PR必须先独立审查再转Ready。基础设施包括构建、测试、CI/发布、托管、安全边界、加载与缓存策略；重要PR包括跨模块改造或显著影响用户路径、资源消耗、数据与权限的变化。主Agent按实际差异判断，在PR说明适用性；小修复和普通文档补充不自动升级为独立审查项目。

主Agent主动新建独立会话，由另一Agent在独立工作区审查整个PR，不继承实现者的完成结论，也不以CI绿灯代替审查。审查者先沿实际用户操作和系统执行路径识别风险，说明本PR的重点及理由；下列维度是通用判断框架，不要求每次机械运行全部专项检查，也不固定以性能为第一优先级。

- **行为正确性与回归**：实现是否满足需求及现有约定；边界输入、异常、并发、重复操作和中断恢复是否可靠；变化是否破坏相邻功能或兼容性。
- **安全与数据边界**：输入和外部内容是否可信，权限及隔离是否恰当；是否泄露秘密、破坏数据，或引入不必要的供应链与第三方风险。按实际攻击面核对，不列假想警告。
- **性能与资源**：沿关键路径检查首次和后续使用成本，关注网络、计算、内存与存储；按需核对加载、缓存复用/失效/容量、重复工作、资源释放及规模增长。预算达标与单次测速不能替代策略和退化风险审查。
- **代码可维护性**：职责、状态所有权和依赖是否清楚；复杂度、重复逻辑、错误处理和注释是否有助于后续修改。仅报告有实际影响的问题，不以个人风格偏好阻塞。
- **验证与交付可信度**：测试是否验证关键行为及失败路径，能否抓住本PR风险；文档、配置与实现是否一致；涉及发布、迁移时核对环境差异、兼容、恢复措施及验收证据。明确未测范围，不把通过检查等同于已上线。

发现按影响、发生条件和可复现证据排序，指出位置、后果与修复方向；不为凑数制造问题，也不越界扩展功能。记录审查会话链接或任务ID、审查SHA、实际覆盖范围、问题及证据、未测限制与明确结论。

主Agent处理实际问题，独立审查者复核修复及最终SHA；未解决的阻塞项不得转Ready。通过后转Ready并运行整个PR所需检查，全部通过后才通知用户点合并，AI不自动合并。Ready后修改代码须退回Draft，由独立审查者复核变化再恢复Ready及完整检查；仅文档变化也须记录最终SHA及审查是否仍适用。审查者不承担实现、转Ready或合并操作，主Agent负责协调到结束。

## 合并和冻结

代码与功能文档在同一PR准备好；合并操作者核对清单全部完成、功能及spec索引、shaped-by和amends关系，实现完成时把该规格与plan/tasks、索引统一设为complete并通过检查，再执行用户明确授权的合并。未进入main的稿件尚未冻结；main中的complete/历史merged记录冻结，允许状态前进、追加amended-by及首次据实补记frozen-at；日期可省略，实际合并时间以GitHub PR记录为准，不提前虚构。合并后的核对不要求立即创建补丁PR；仅可选日期可延后；实现状态应在代码交付前完成，PR是否合并由Git记录。

最终行为随代码合并生效，必要说明仍须在同一PR交付。合并后逐个审阅PR中commit的实际差异，定位其影响的用户路径、配置、接口、规则与相关docs说明，再检查PR整体差异及合并后的代码，确认文档没有遗漏、冲突或过时描述。后续commit撤销或替换的行为以最终实现为准；每个commit不必新增或修改文档，未影响现有说明的改动无需凑写内容。PR收尾评论记录审阅范围、对应文档及发现的漏项和处理状态，不在docs写commit流水账；code-revision及自动检查通过不能代替语义核对。发现漏项及时补齐，不能把合并后补文档作为正常交付流程。

main不要求通过PR；目标提交仍须取得verify/budget成功并包含最新main，管理员同样受限，禁止force push和删除main。小改动可先在保存该提交的工作分支手动运行Project checks，检查通过后再直接推送main；需要Spec Kit的需求仍按项目规则使用PR。检查失败时保留进度并修复，不擅自削弱保护。

## 合并后上线与收尾

网站影响的main push在同一工作流中通过verify与budget后，deploy下载budget产物（含隐藏文件），核对SHA和内容摘要，再使用Wrangler发布至用户已授权的https://vibes.college。纯治理文档或文档工具无网站影响时不重建/发布，保留之前线上版本。生产job串行不强制取消，上传前确认仍是当前main，拒绝旧运行覆盖新版本。发布不再重复构建或跑verify。

vibes.college现由Worker vibes-explore提供服务。2026-09-06的[首次正式部署](https://github.com/Vibes-college/Vibes/actions/runs/34029233677)通过，线上SHA与合并提交一致，[页面验收与清理记录](https://github.com/Vibes-college/Vibes/pull/3#issuecomment-5558821204)已保存。此次Custom Domain从旧Worker vibecoding-college转接。旧Worker保留，不删除业务资源。回退首次切换可将该域名绑定恢复到vibecoding-college；后续恢复使用已验证的生产版本记录。正式域名授权不等于已上线，实际结果以main部署job、版本记录与页面验收为准。

scripts/release-ci.ts保存发布前版本和结果于resources/evidence/releases/；CI artifact保留90天。只有线上/__release.json匹配SHA且zh/en页有效才记录verified:true；失败不清理，上传结果不确定先核对远端再重试。实际交互另由AI用内置浏览器核对搜索、详情、语言与404，结果写PR评论。完整上线前不宣称发布成功。

AI在用户合并后继续收尾，不建立定时跟进。先核对PR已合并、线上版本包含该合并、对应main工作流部署成功，纯文档维护若不影响已上线网站，要求对应main检查成功才可收尾，不虚构重新部署。再检查本地脏文件/额外提交/其他任务占用，将空闲的本地主目录同步到origin/main：无本地独有提交时快进，有本地提交时保留并合并远端main，解决冲突后按影响验证；不能以有本地提交为由停止同步，也不重置或丢弃它们；被忽略的.dev.vars、证据和未知文件仍受保护，仅node_modules/dist/.astro/test-results等明确缓存可随worktree清理。运行cleanup:task查看候选，在待删除worktree之外的项目checkout核对状态后再传--execute-idle；不为清理切换其他任务的分支。命令以PR head与GitHub合并证明兼容squash，删除采用预期SHA比对，竞态或未知状态保留。仍被其他open PR作为base使用的分支保留；仅删除本目标分支与空闲干净worktree；用户未跟踪文件原样保留，main和其他任务不清理。

远端分支也要等上线验收后删除，不开启GitHub合并即删分支。临时服务由本机AI按自己启动记录核对PID/用途并关闭，不能扫描后盲杀进程；保留的服务记用途/地址/启动方式，下次先核对再复用。发布版本、旧Worker和必要恢复证据不属于临时垃圾。

## 阶段预览与恢复

`npm run release:preview -- <PR号>`要求干净、已推送且对应本仓库open PR head的源码；完整本地verify/budget后复核源码和远端PR未变，以生产canonical构建并添加noindex响应头，使用versions upload --preview-alias pr-N。它不会提升生产版本或修改域名，返回实际URL后核对SHA与页面，AI更新PR的链接、对应SHA及可体验范围。源码dirty时保留用户文件，使用干净隔离worktree；不忽略脏状态强行发布。

`npm run deploy`拒绝本地直接生产发布并指向main自动流程。`npm run release:restore -- <version-id>`仅接受resources/evidence/releases中已验证、账户/域名/版本匹配的生产记录，恢复后重新检查线上SHA与页面；先从CI artifact取回所需记录。旧测试站记录仅为历史证据，不直接作为新生产恢复记录。

## 完整命令与操作说明

需要Node22.20或兼容更新版本。首次或依赖变化后运行`npm ci`；首次运行E2E时执行`npx playwright install chromium webkit`，Linux CI使用`--with-deps`。Playwright已在锁文件中，不新增npm依赖。

| 命令                                | 行为与使用场景                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`                       | Astro开发服务，地址以终端为准，通常为127.0.0.1:4321                              |
| `npm run preview`                   | 构建后以wrangler.local.jsonc启动本地4322预览，Ctrl+C停止                         |
| `npm run docs:check`                | 治理文档标签、目录/索引、关系、冻结保护；篇幅仅提示                              |
| `npm run format:check`              | 检查格式，不修改文件                                                             |
| `npm run check`                     | 类型→lint→格式→文档→单元测试；不启动浏览器或清库                                 |
| `npm run test:e2e`                  | 构建→Playwright启动专用本地Worker→桌面Chromium及手机Chromium/WebKit测试→清理服务 |
| `npm run verify`                    | check→db:reset→test:e2e，完整验收，失败停止；不部署                              |
| `npm run budget`                    | 构建并检查脚本、首页和优化图片体积；限值见[常量](../system/rules.md)             |
| `npm run optimize:images`           | 对已有dist单独生成图片变体和manifest；通常由build自动调用                        |
| `npm run ci:scope`                  | 根据CHECK_BASE_REF或origin/main计算docs/tools/full，不执行检查                   |
| `npm run db:reset`                  | 删除本项目本机测试D1数据，迁移并填入固定样例                                     |
| `npm run db:migrate`                | 只应用本地未执行迁移；不接受线上参数                                             |
| `npm run deploy`                    | 拒绝本地直接生产部署，main检查成功后自动发布                                     |
| `npm run release:preview -- <PR号>` | 本地完整验收后上传PR预览版本，不提升生产                                         |
| `npm run cleanup:task -- <PR号>`    | 报告已合并/已部署分支清理候选；核对空闲后加--execute-idle                        |

按[CI范围规则](checks-and-release.md)选择必需检查，不因纯文档变化运行整站浏览器。`verify`始终表示完整验收，不会按路径悄悄缩减。日常工具修改运行check；页面和测试基础设施修改运行verify与budget。

## 媒体处理

`npm run media:prepare -- <image|video|audio> <本地输入> <新id> [--start 秒] [--seconds 秒]`输出到public/media/<id>，已有目录拒绝覆盖。视频产生静态海报、短静音预览及完整转码；音频产生短试听、完整转码及真实波形；图片产生受限WebP尺寸。需要本机FFmpeg/ffprobe，使用现有Sharp，不自动安装依赖。清单记录输入摘要、处理参数与输出大小，原始输入保持不变；AI仍须填写作品来源/许可、文案和展示选择。验证命令及维护路径见[内容维护](../features/content-maintenance.md)。

content:validate核对媒体结构、引用、字节及真实数值；budget另报告mediaJavascriptGzip，保留公共脚本门槛。tests/media.spec.ts覆盖三个浏览器项目的延迟加载、章节、跳转暂停、原生播放/暂停与页面按钮同步、慢章节补充下载取消、失败重试、图库、数据、搜索替换与无JS；外站响应在自动化中隔离，实际第三方播放须用内置浏览器另验，不能将测试桩当作原站证据。

## 浏览器测试

本地与CI使用同一配置和测试文件。4322必须空闲，测试禁止复用现成服务，避免误测另一个任务。浏览器未安装、端口占用、启动超时和断言失败都返回失败。Playwright负责启动与清理服务，失败追踪保存在被忽略的test-results/；CI失败时保存7天。

媒体测试完成播放、暂停和历史断言后，先通过正常页面导航退出播放器，释放可能仍保持连接的原生下载。测试页面关闭前等待静态资源传输结束，10秒内仍未空闲即失败；这是对Wrangler本地代理中断响应会退出问题的防护，不重试测试或吞掉错误。公共fixture见tests/browser-test.ts。

手机项目包含Chromium与WebKit设备模拟，包含触摸横滑和320px列表/详情检查，不代表真实iPhone Safari通过。原生音频章节测试在成功或失败时均附捕获/冒泡阶段的媒体事件、进度及按钮状态，便于核对异步暂停。媒体测试附件记录首次/同会话缓存访问的DOMContentLoaded、首屏绘制、海报观测和点击到真实视频首帧；单次本机样本不当作公网性能，浏览器不支持的绘制指标保留null。导航缓存测试使用隔离空持久profile验证缓存复用，桌面项目另等待真实60秒TTL验证过期后读取。ego-browser仅在有视觉或体验验收目的时按需使用，不是自动化E2E前提。`npx playwright test --headed`可查看测试过程，运行前先构建。

## 数据库和部署边界

本地配置与数据位置固定为wrangler.local.jsonc和.wrangler/project-local；db:reset仅删除其中v3/d1。数据库仅有命令测试表，网站读取src/content/works/及src/data/taxonomy.json；不配置或操作线上数据库。单独test:e2e不清库。已应用的迁移不改写，用新迁移表达变更。

Worker部署与.openai/hosting.json对应的Sites站点独立。检查通过不代表已发布；vibes.college为已授权的生产目标。缺失origin/main时docs:check会失败，可fetch或指定可信DOCS_BASE_REF。

## 检查失败

按具体错误修复，再运行受影响检查。`npm run format`会排版所有受支持文件，局部问题优先只格式化相应文件；无需重跑无关浏览器检查。类型覆盖网站和工具；SQL测试实际执行，单元测试用Node内置测试器。

## 内容维护与规模测量

- `npm run content:validate`检查整个目录并报告各语言发布数量，不写文件。
- `npm run content:revision -- <id>`报告当前原文摘要、语言状态与待复核标记，不批准或发布翻译。
- `npm run build`先校验内容，再Astro完整重编译内容缓存并构建，扫描public/images中超过200KB的栅格图片并在dist生成WebP响应式变体、manifest和srcset，再为dist/_headers补齐精确内联脚本哈希，最后生成Pagefind语言索引；零发布内容不生成索引并移除旧索引；缺内容、图片预算或校验失败停止。
- `node --experimental-strip-types scripts/measure-explore.ts`在.scratch生成隔离5000×2样例、构建、验证分页/正文搜索并测冷/热延迟；会使用系统分配的独立空闲端口，结束清理。真实内容和dist不覆盖，不部署样例；报告位于resources/evidence/001-multilingual-explore/。

普通.md与互动.mdx使用同一内容校验和发布命令；MDX语法、import与组件构建错误必须修复，不能把内容校验通过当作交互验收。

英文发布前须核对全文再记录sourceRevision；原文修改使旧译文标待复核，更新摘要前必须再次审核。详细字段见[内容维护](../features/content-maintenance.md)。

`npm run release:restore -- <version-id>`恢复本地已记录的生产版本；记录和门槛见[CI](checks-and-release.md)。不能传任意域名、账户或合成内容。

构建中的scripts/sandbox-game.ts只打包已登记2048模板及其固定CSS/JS，并将确切可执行字节交给CSP摘要流程；旧模板地址保留；64KiB超限、模板引用改变、额外脚本/样式或嵌入闭合标签均使构建失败。tests/unit/sandbox-game.test.ts检查字节保真与拒绝边界；tests/media.spec.ts验证真实站内切换、阻断沙盒子资源仍可操作、退出重开，以及旧CSP缺少摘要时完整刷新恢复。最终域名的浏览器网络策略可能不同于预览，上线验收须实际操作游戏。

## 源码与说明同步检查

功能、系统说明和项目总览的code-sources绑定真实实现文件或目录，code-revision保存复核过的SHA256摘要。docs:check读取Git管理范围及未跟踪新源码，检查路径、全体实现覆盖、当前说明本地链接和摘要一致性。源码新增、改名、删除、字节变化会要求复核对应说明；历史规格链接保留当时路径。

`npm run docs:check -- --revisions`只打印当前源码的候选摘要，不写文件，不表示说明正确，也不替代正常docs:check。先对照改动核对文案、流程和验收，再记录摘要并运行正常检查。测试见tests/unit/docs-sources.test.ts；内容正文及work.json不在结构代码摘要里，数量从content:validate读取。

新规格complete表示实现及验收完成，不等于已合并或已部署。全部任务已勾选而状态仍in-progress会失败；main中的complete与历史merged同样保护正文。合并后核对无需再创建状态补丁PR。

## 本地助手验收

tests/assistant.spec.ts使用tests/fixtures/assistant-daemon.ts的官方协议与加密实现，在三个浏览器项目覆盖连接、会话/模型、作品、消息、工具、审批、停止、恢复、双语和320px；CI不接用户电脑及模型。另在真实浏览器UI连接官方daemon运行隔离任务，分别记录版本、执行、工具、停止、恢复及审批结果，保存去秘密证据。真机Safari未测时保留待验，不把夹具或SDK握手当成真实任务完成。
