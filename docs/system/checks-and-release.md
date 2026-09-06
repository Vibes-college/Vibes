---
tense: 'living'
describes: '自动检查与发布规则'
status: 'current'
shaped-by: ['002', '003']
code-sources:
  [
    'package.json',
    'scripts/',
    'tests/',
    '.github/workflows/',
    'playwright.config.ts',
    'wrangler.local.jsonc',
  ]
code-revision: '7105a88a4162d2825c6ccd061a7cf1bc581417aaf309af3efff197744a2f9aef'
---

# 检查与发布

## 检查入口

.github/workflows/check.yml在PR、push、手动触发时保留verify与budget两个检查名称；Node22.20，contents:read。scope任务使用scripts/check-scope.ts分类，verify/budget按结果执行，不能只在工作流顶层用paths过滤导致必需检查一直等待。scope失败/输出无效时，两个必需检查显式失败；同一事件分支的新运行取消旧运行以减少重复等待。

| 差异范围                                                      | verify任务                                | budget任务         |
| ------------------------------------------------------------- | ----------------------------------------- | ------------------ |
| docs：治理Markdown、宪章、项目模板                            | docs:check和format:check，不安装浏览器    | 明示不适用，不构建 |
| tools：文档检查器及其单元测试，可混合文档                     | npm run check，不安装浏览器               | 明示不适用，不构建 |
| full：网站内容、源码、数据库、依赖、CI/测试配置、其他未知路径 | npm run verify（check→本地D1→Playwright） | npm run budget     |

手动触发、空差异或范围基线不可读均选择full。分类包含删除、改名前后路径和本地未跟踪文件；src中的文章也属于网站变化。路径白名单由脚本与tests/unit/check-scope.test.ts维护。分类不取代测试：需要缩减新的工具范围时先证明它不影响网站。

PR基线为目标分支SHA，push为事件前一提交，新分支回退origin/main；checkout获取完整历史。DOCS_BASE_REF用于冻结检查，CHECK_BASE_REF用于范围分类。本地默认origin/main；冻结基线缺失仍失败，不因分类回退而绕过保护。远端main需保持最新。

每周一09:00UTC单独输出文档体检，行数和比例仅观察。Playwright失败追踪上传Actions保存7天；CI禁止test.only，测试不自动重试来掩盖不稳定断言。本地和CI均拒绝复用已启动的4322服务。

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

一个完整功能、修复或一批相关维护使用一个工作分支，默认codex/前缀；同一工作继续使用未合并分支及已有PR，不按对话轮次、commit或文件数拆分。新工作从同步后的main开始；已有待合并的小收尾可以纳入下一次相关维护，先核对差异与范围，不夹带无关功能。已合并分支不继续承载新工作。

commit是保存进度，推送是备份或触发CI，PR是提交一批变化供审阅，合并才是进入main；它们不必同时发生。达到完整、可审阅状态再创建PR；需要提前讨论时可以开草稿。一个PR可包含多个commit；修改当前PR时直接继续提交，不另开修正PR。批量组织不等于无限累积，出现独立交付目的或需要单独回滚的变化时分开。

纯措辞和可选日期补记可以随相关工作一起提交；实现完成状态、当前行为与源码对应必须随同一批代码更新，不延后；不为每次小收尾创建PR或催用户合并。必要功能说明仍随代码交付；影响使用、发布或安全的错误及时修正，不为减少PR而延误。检查按实际改动范围选择，不能用批量提交规避检查。

## 合并和冻结

代码与功能文档在同一PR准备好；合并操作者核对清单全部完成、功能及spec索引、shaped-by和amends关系，实现完成时把该规格与plan/tasks、索引统一设为complete并通过检查，再执行用户明确授权的合并。未进入main的稿件尚未冻结；main中的complete/历史merged记录冻结，允许状态前进、追加amended-by及首次据实补记frozen-at；日期可省略，实际合并时间以GitHub PR记录为准，不提前虚构。合并后的核对不要求立即创建补丁PR；仅可选日期可延后；实现状态应在代码交付前完成，PR是否合并由Git记录。

最终行为随代码合并生效，合并后核对docs/features。不得另等文档补丁才能称交付完成。GitHub分支保护实际状态需在平台核对，不能从CI文件存在推断保护生效。

## 合并后本地收尾

fetch并prune远端引用，核对PR确已合并及本地未提交改动，再切回main并快进同步。只有确认所有提交已包含在main且未被其他worktree使用时，才删除本地工作分支。squash/rebase合并可能没有相同提交编号，需核对PR和实际差异；存在独有改动或无法确认时保留并说明，不强制删除。用户自行创建的未跟踪文件原样保留。

删除分支不会删除main中的commit历史，不为整洁重写或清空历史。任务结束关闭不用的本次临时服务；保留服务记录用途、地址与启动方式，下次先核对后复用。

## 部署

npm run deploy构建后使用Wrangler发布静态Worker；必须核对已通过检查的SHA、账户与独立测试地址。当前工作流不自动发布。不得自动合并main或修改旧vibes.college的DNS/路由；切正式域名需单独授权。平台凭据不写进文档。

## 独立测试站受控发布

`npm run deploy`通过scripts/release.ts，只接受干净已提交源码，并检查同一SHA的GitHub check-runs中verify与budget全部成功；接着以测试SITE_URL运行完整本地verify和budget，确认HEAD和工作区未变化后发布。隔离内容环境变量禁止进入发布；容量默认免费档，不能因未知套餐假定付费额度。

目标在scripts/release-policy.ts固定为vibes-explore.topologic-relay.workers.dev与已核对账户；生成临时Wrangler配置只含workers.dev，没有自定义域名、路由或线上数据库。沿用本机Wrangler OAuth，不读取或迁移旧项目业务密钥，没有新增GitHub部署凭据。

每次成功保存版本ID、SHA、来源、体积与检查记录于resources/evidence/001-multilingual-explore/releases/。`npm run release:restore -- <version-id>`只接受此处已记录且目标匹配的版本，核对远端版本后执行rollback。回滚后仍需实际检查页面；不能把命令成功当视觉验收。

部署后核对中文/英文目录、正文搜索、旧URL、404、canonical/sitemap/robots和恢复前后页面，记录实际版本。独立测试站已完成同SHA检查、首次发布、内容修订和上一版本恢复；摘要在PR，原始记录在resources/evidence/001-multilingual-explore/cloudflare-release.md。现有.github/workflows/check.yml继续提供同名verify/budget；不新增无人值守部署工作流。

## 完整命令与操作说明

需要Node22.20或兼容更新版本。首次或依赖变化后运行`npm ci`；首次运行E2E时执行`npx playwright install chromium`，Linux CI使用`--with-deps`。Playwright已在锁文件中，不新增npm依赖。

| 命令                   | 行为与使用场景                                                   |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Astro开发服务，地址以终端为准，通常为127.0.0.1:4321              |
| `npm run preview`      | 构建后以wrangler.local.jsonc启动本地4322预览，Ctrl+C停止         |
| `npm run docs:check`   | 治理文档标签、目录/索引、关系、冻结保护；篇幅仅提示              |
| `npm run format:check` | 检查格式，不修改文件                                             |
| `npm run check`        | 类型→lint→格式→文档→单元测试；不启动浏览器或清库                 |
| `npm run test:e2e`     | 构建→Playwright启动专用本地Worker→桌面/手机Chromium测试→清理服务 |
| `npm run verify`       | check→db:reset→test:e2e，完整验收，失败停止；不部署              |
| `npm run budget`       | 构建并检查脚本和首页体积；限值见[常量](../system/rules.md)       |
| `npm run ci:scope`     | 根据CHECK_BASE_REF或origin/main计算docs/tools/full，不执行检查   |
| `npm run db:reset`     | 删除本项目本机测试D1数据，迁移并填入固定样例                     |
| `npm run db:migrate`   | 只应用本地未执行迁移；不接受线上参数                             |
| `npm run deploy`       | 校验同SHA云端/本地检查后发布固定独立测试Worker，需已有授权       |

按[CI范围规则](checks-and-release.md)选择必需检查，不因纯文档变化运行整站浏览器。`verify`始终表示完整验收，不会按路径悄悄缩减。日常工具修改运行check；页面和测试基础设施修改运行verify与budget。

## 浏览器测试

本地与CI使用同一配置和测试文件，无需ego lite。4322必须空闲，测试禁止复用现成服务，避免误测另一个任务。浏览器未安装、端口占用、启动超时和断言失败都返回失败。Playwright负责启动与清理服务，失败追踪保存在被忽略的test-results/；CI失败时保存7天。

手机项目是Chromium设备模拟，包含触摸横滑和320px列表/详情检查，不代表真实iPhone或Safari通过。ego-browser仅在有视觉或体验验收目的时按需使用，不是自动化E2E前提。`npx playwright test --headed`可查看测试过程，运行前先构建。

## 数据库和部署边界

本地配置与数据位置固定为wrangler.local.jsonc和.wrangler/project-local；db:reset仅删除其中v3/d1。数据库仅有命令测试表，网站读取src/content/works/及src/data/taxonomy.json；不配置或操作线上数据库。单独test:e2e不清库。已应用的迁移不改写，用新迁移表达变更。

Worker部署与.openai/hosting.json对应的Sites站点独立。检查通过不代表已发布；不切换旧vibes.college。缺失origin/main时docs:check会失败，可fetch或指定可信DOCS_BASE_REF。

## 检查失败

按具体错误修复，再运行受影响检查。`npm run format`会排版所有受支持文件，局部问题优先只格式化相应文件；无需重跑无关浏览器检查。类型覆盖网站和工具；SQL测试实际执行，单元测试用Node内置测试器。

## 内容维护与规模测量

- `npm run content:validate`检查整个目录并报告各语言发布数量，不写文件。
- `npm run content:revision -- <id>`报告当前原文摘要、语言状态与待复核标记，不批准或发布翻译。
- `npm run build`先校验内容，再Astro构建，最后为dist生成Pagefind语言索引；零发布内容不生成索引并移除旧索引；缺内容或校验失败停止。
- `node --experimental-strip-types scripts/measure-explore.ts`在.scratch生成隔离5000×2样例、构建、验证分页/正文搜索并测冷/热延迟；会使用系统分配的独立空闲端口，结束清理。真实内容和dist不覆盖，不部署样例；报告位于resources/evidence/001-multilingual-explore/。

英文发布前须核对全文再记录sourceRevision；原文修改使旧译文标待复核，更新摘要前必须再次审核。详细字段见[内容维护](../features/content-maintenance.md)。

`npm run release:restore -- <version-id>`恢复本地已记录的测试站版本；记录和门槛见[CI](checks-and-release.md)。不能传任意域名、账户或合成内容。

## 源码与说明同步检查

功能、系统说明和项目总览的code-sources绑定真实实现文件或目录，code-revision保存复核过的SHA256摘要。docs:check读取Git管理范围及未跟踪新源码，检查路径、全体实现覆盖、当前说明本地链接和摘要一致性。源码新增、改名、删除、字节变化会要求复核对应说明；历史规格链接保留当时路径。

`npm run docs:check -- --revisions`只打印当前源码的候选摘要，不写文件，不表示说明正确，也不替代正常docs:check。先对照改动核对文案、流程和验收，再记录摘要并运行正常检查。测试见tests/unit/docs-sources.test.ts；内容正文及work.json不在结构代码摘要里，数量从content:validate读取。

新规格complete表示实现及验收完成，不等于已合并或已部署。全部任务已勾选而状态仍in-progress会失败；main中的complete与历史merged同样保护正文。合并后核对无需再创建状态补丁PR。
