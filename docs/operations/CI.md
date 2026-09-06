---
tense: 'living'
describes: '自动检查与发布规则'
status: 'current'
shaped-by: ['002']
---

# 自动检查与发布规则

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

## 合并和冻结

代码与功能文档在同一PR准备好；合并操作者核对清单全部完成、功能及spec索引、shaped-by和amends关系，最终待合并稿准备merged并通过检查，再执行用户明确授权的合并。未进入main的稿件尚未冻结；main中已合并记录允许状态前进、追加amended-by及首次据实补记frozen-at；日期可省略，实际合并时间以GitHub PR记录为准，不提前虚构。

最终行为随代码合并生效，合并后核对docs/features。不得另等文档补丁才能称交付完成。GitHub分支保护实际状态需在平台核对，不能从CI文件存在推断保护生效。

## 部署

npm run deploy构建后使用Wrangler发布静态Worker；必须核对已通过检查的SHA、账户与独立测试地址。当前工作流不自动发布。不得自动合并main或修改旧vibes.college的DNS/路由；切正式域名需单独授权。平台凭据不写进文档。

## 独立测试站受控发布

`npm run deploy`通过scripts/release.ts，只接受干净已提交源码，并检查同一SHA的GitHub check-runs中verify与budget全部成功；接着以测试SITE_URL运行完整本地verify和budget，确认HEAD和工作区未变化后发布。隔离内容环境变量禁止进入发布；容量默认免费档，不能因未知套餐假定付费额度。

目标在scripts/release-policy.ts固定为vibes-explore.topologic-relay.workers.dev与已核对账户；生成临时Wrangler配置只含workers.dev，没有自定义域名、路由或线上数据库。沿用本机Wrangler OAuth，不读取或迁移旧项目业务密钥，没有新增GitHub部署凭据。

每次成功保存版本ID、SHA、来源、体积与检查记录于resources/evidence/001-multilingual-explore/releases/。`npm run release:restore -- <version-id>`只接受此处已记录且目标匹配的版本，核对远端版本后执行rollback。回滚后仍需实际检查页面；不能把命令成功当视觉验收。

部署后核对中文/英文目录、正文搜索、旧URL、404、canonical/sitemap/robots和恢复前后页面，记录实际版本。远端执行及恢复尚须各自实录，不因入口存在宣称上线。现有.github/workflows/check.yml继续提供同名verify/budget；不新增无人值守部署工作流。
