---
tense: 'living'
describes: '配置和环境变量'
status: 'current'
shaped-by: ['001']
---

# 配置和环境变量

本文件说明当前新项目的实际配置；旧项目的配置名称仅保存在 [SECRETS_CHECKLIST.md](../operations/SECRETS_CHECKLIST.md)，没有自动迁入新项目。

## 当前环境

开发流程工具为 Spec Kit 1.0.4，通过 `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.0.4` 安装到本机工具环境，不是 npm 或网站运行依赖。版本与初始化参数见 `.specify/init-options.json`；Codex skills 位于 `.agents/skills/`。升级需明确版本并审查生成文件差异，不能在初始化时覆盖项目决定。`.prettierignore` 排除上游受管理的技能、模板、清单与工作流，以保持安装清单哈希；项目自己维护的宪章和文档仍接受格式检查。使用与验收边界见 [Spec Kit 工作流](../features/spec-kit-workflow.md)。

| 项目                | 当前配置                                 | 用途 / 修改位置                                              |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| 框架                | Astro 静态输出，TypeScript               | `astro.config.mjs`、`tsconfig.json`                          |
| Node                | 至少 22.20.0；CI 固定 22.20.0            | `package.json`、`.github/workflows/check.yml`                |
| 依赖版本            | `package-lock.json` 锁定，使用 `npm ci`  | 不手改锁文件；新增依赖先询问                                 |
| 开发地址            | 通常为本机 4321，以终端实际地址为准      | `npm run dev`；端口占用时 Astro 可能使用其他端口             |
| Cloudflare 本地预览 | 本机 4322                                | `npm run preview`、`wrangler.local.jsonc`                    |
| 本地数据库          | `DB` / `vibes-explore-local`             | `wrangler.local.jsonc`；标识只供本地模拟使用                 |
| 本地数据目录        | `.wrangler/project-local/`               | `scripts/local-tools.ts`；不提交 Git                         |
| 直接 Worker 部署    | `vibes-explore`，静态资源 `dist`         | `wrangler.jsonc`；静态资源配置；受控入口已部署独立测试Worker |
| 既有 Sites 绑定     | 已有托管项目                             | `.openai/hosting.json`；保留，不写入凭据                     |
| 页面标准域名        | `SITE_URL`，本地默认127.0.0.1:4322       | `src/config/site.ts`统一供Astro、布局、sitemap和robots使用   |
| 未来正式域名        | `vibes.college`，仍由旧项目使用          | 不得切 DNS，不绑定到新站；切换需单独验收与授权               |
| 缓存与安全响应头    | 本站来源限制、禁止嵌入、构建资源缓存一年 | `public/_headers`                                            |

## 环境变量名称

发布构建必须设置SITE_URL；当前网站没有必填业务密钥，没有登录、支付、邮件或 AI API 密钥。因此 `.dev.vars.example` 仅有说明，没有为了凑模板而增加无用变量。

| 名称                                            | 谁提供 / 放哪里                             | 用途                                                                     |
| ----------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `CI`                                            | GitHub Actions 自动提供                     | 云端禁止test.only；本地与CI均不复用服务                                  |
| `GITHUB_ACTIONS`                                | GitHub Actions 自动提供                     | 平台身份标志，不参与浏览器选择                                           |
| `NODE_VERSION`                                  | Cloudflare Pages 构建设置，建议填 `22.20.0` | 固定构建用的 Node 版本，不是秘密                                         |
| `GITHUB_TOKEN`                                  | GitHub Actions 临时提供                     | CI 读取代码所需的平台身份；工作流只授予 `contents: read`，无需手填       |
| `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` | 可选的 Wrangler 自动部署身份                | 当前未配置自动部署，不需要填；本机已有 Wrangler OAuth 登录可用于人工操作 |

本地与CI均运行Playwright；按实际环境报告结果。Cloudflare Git 集成本身不需要把部署 Token 放入业务环境变量。

## 本地与线上如何保存值

- 本地示例：`.dev.vars.example` 只记变量名，值留空；真实 `.dev.vars` 由你填写。
- `.env`、`.env.*`、`.dev.vars`、`.dev.vars.*` 均由 `.gitignore` 排除，明确允许无秘密的 example 文件。
- 构建时读取的 `.env` 与 Worker 运行时的 `.dev.vars` 不是一回事；当前静态网站不读取业务配置。未来新增服务时，同时说明变量在哪个阶段读取。
- 线上未来需要的秘密由你在对应 Cloudflare 项目中填写，并区分 Production / Preview；本文件只新增名字与用途，不记录值。
- `PUBLIC_` 等前端公开变量不能放私钥；不要把密码放在 `src/content/works/` 或网站静态文件里。

## 文件组织与检查排除

外部快照在 `resources/references/`，本地证据在 `resources/evidence/`；`.gitignore`、`.prettierignore`、`eslint.config.mjs` 同步排除这两项，`tsconfig.json` 排除resources。它们不属于网站构建输入。完整文件职责见 [仓库地图](../README.md)。

CI范围由CHECK_BASE_REF（默认origin/main）和GITHUB_EVENT_NAME决定；GITHUB_OUTPUT用于传递范围。冻结检查独立使用DOCS_BASE_REF，缺失基线失败。详见[CI](../operations/CI.md)。

## 内容构建与隔离测试

`SITE_URL`为纯origin，非本地必须HTTPS；`VIBES_DEPLOY=1`开启发布校验，缺失SITE_URL、localhost及旧vibes.college会失败。它只用于构建，不是浏览器秘密。

`VIBES_CONTENT_DIR`与`VIBES_TAXONOMY_FILE`覆盖隔离内容源；必须同时指定位于.scratch下的`VIBES_OUT_DIR`。scripts/build.ts在Astro前校验，随后为该输出生成Pagefind；Astro缓存随隔离输出分开，避免测试覆盖真实dist。正常命令不设置这些变量，读取src/content/works与src/data/taxonomy.json。

eslint.config.mjs与.prettierignore排除.scratch合成内容和产物；它们不进入提交或部署。

受控发布目标由scripts/release-policy.ts限定Worker vibes-explore、账户d2338644c67dab28bdc257b40d0fa115、来源https://vibes-explore.topologic-relay.workers.dev；这些标识不是密钥。scripts/release.ts生成.scratch/release-config.json并设置SITE_URL、VIBES_DEPLOY与账户，不使用旧域名；直接wrangler.jsonc只是配置，不等于通过发布检查。
