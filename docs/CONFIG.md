# 配置和环境变量

本文件说明当前新项目的实际配置；旧项目的配置名称仅保存在 [SECRETS_CHECKLIST.md](SECRETS_CHECKLIST.md)，没有自动迁入新项目。

## 当前环境

| 项目                | 当前配置                                 | 用途 / 修改位置                                                     |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| 框架                | Astro 静态输出，TypeScript               | `astro.config.mjs`、`tsconfig.json`                                 |
| Node                | 至少 22.20.0；CI 固定 22.20.0            | `package.json`、`.github/workflows/check.yml`                       |
| 依赖版本            | `package-lock.json` 锁定，使用 `npm ci`  | 不手改锁文件；新增依赖先询问                                        |
| 开发地址            | 通常为本机 4321，以终端实际地址为准      | `npm run dev`；端口占用时 Astro 可能使用其他端口                    |
| Cloudflare 本地预览 | 本机 4322                                | `npm run preview`、`wrangler.local.jsonc`                           |
| 本地数据库          | `DB` / `vibes-explore-local`             | `wrangler.local.jsonc`；标识只供本地模拟使用                        |
| 本地数据目录        | `.wrangler/project-local/`               | `scripts/local-tools.ts`；不提交 Git                                |
| 直接 Worker 部署    | `vibes-explore`，静态资源 `dist`         | `wrangler.jsonc`；与下方 Pages Git 连接不是同一种部署               |
| 既有 Sites 绑定     | 已有托管项目                             | `.openai/hosting.json`；保留，不写入凭据                            |
| 页面标准域名        | 既有 `vibes-explore.jachi2.chatgpt.site` | `astro.config.mjs`、`src/pages/sitemap.xml.ts`、`public/robots.txt` |
| 未来正式域名        | `vibes.college`，仍由旧项目使用          | 本次不切 DNS，不绑定到新站；切换需单独验收与授权                    |
| 缓存与安全响应头    | 本站来源限制、禁止嵌入、构建资源缓存一年 | `public/_headers`                                                   |

## 环境变量名称

当前网站没有必填业务环境变量，没有登录、支付、邮件或 AI API 密钥。因此 `.dev.vars.example` 仅有说明，没有为了凑模板而增加无用变量。

| 名称                                            | 谁提供 / 放哪里                             | 用途                                                                     |
| ----------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `CI`                                            | GitHub Actions 自动提供                     | 云端非交互执行；Playwright 在 CI 中不复用现成服务                        |
| `GITHUB_ACTIONS`                                | GitHub Actions 自动提供                     | 与 `CI` 同为 `true` 时，`test:e2e` 选择 Playwright；本地选择 ego-browser |
| `NODE_VERSION`                                  | Cloudflare Pages 构建设置，建议填 `22.20.0` | 固定构建用的 Node 版本，不是秘密                                         |
| `GITHUB_TOKEN`                                  | GitHub Actions 临时提供                     | CI 读取代码所需的平台身份；工作流只授予 `contents: read`，无需手填       |
| `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` | 可选的 Wrangler 自动部署身份                | 当前未配置自动部署，不需要填；本机已有 Wrangler OAuth 登录可用于人工操作 |

不要手动设置 `GITHUB_ACTIONS=true` 来声称本地已通过 ego-browser 验收。Cloudflare Git 集成本身不需要把部署 Token 放入业务环境变量。

## 本地与线上如何保存值

- 本地示例：`.dev.vars.example` 只记变量名，值留空；真实 `.dev.vars` 由你填写。
- `.env`、`.env.*`、`.dev.vars`、`.dev.vars.*` 均由 `.gitignore` 排除，明确允许无秘密的 example 文件。
- 构建时读取的 `.env` 与 Worker 运行时的 `.dev.vars` 不是一回事；当前静态网站不读取业务配置。未来新增服务时，同时说明变量在哪个阶段读取。
- 线上未来需要的秘密由你在对应 Cloudflare 项目中填写，并区分 Production / Preview；本文件只新增名字与用途，不记录值。
- `PUBLIC_` 等前端公开变量不能放私钥；不要把密码放在 `src/data/works.json` 或网站静态文件里。

## 新 Pages 项目的连接参数

GitHub 私有仓库：`Vibes-college/Vibes`；生产分支：`main`；框架：Astro；构建命令：`npm run build`；输出目录：`dist`；根目录留空（仓库根目录）；Node 版本：`22.20.0`。

当前是已有完整网站，不再重建 Hello 模板。首次验收应打开 Cloudflare 返回的新 `pages.dev` 地址，看到精选目录并能进入文章。连接状态见 [CI 与初始化记录](CI.md)；这些参数不表示已完成后台连接。

后台入口：Workers & Pages → Create application → Pages → Import an existing Git repository；如果看到的是 Worker 创建流程，切换到 Pages。选择 GitHub 仓库需要 Cloudflare GitHub App 有权访问 `Vibes`；安装/授权页面由你本人确认。

参考：[Cloudflare Astro 构建配置](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)。
