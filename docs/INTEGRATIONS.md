# 第三方 API 与服务集成

## 网站运行时

**当前没有第三方业务 API 调用。** 目录和文章在构建时生成，搜索只过滤已加载的卡片；不存在登录、支付、邮件或 AI API 接口。旧项目清单中的 Google、Stripe、Creem 等不代表新项目已经接入。

`src/data/works.json` 中的来源 URL 和文章 Markdown 中的外部链接是供访客点击的链接，不是代码后台调用。`src/components/WorkDetail.astro` 使用新标签页及 `noopener noreferrer` 打开原始作品。页面不保证外部网站永远可用。

## 开发与部署时的实际调用

| 服务                        | 怎么调用                                                                | 身份与权限                                                  | 返回与失败处理                                                   | 来源                                                            |
| --------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| 本机 Cloudflare 预览        | `fetch` 对 `http://127.0.0.1:4322/` 发 GET                              | 无第三方凭据，只访问本机                                    | 500ms 单次超时；最多 60 次、间隔 500ms；非成功或超时会使测试失败 | `scripts/test-e2e.ts`                                           |
| Cloudflare Wrangler         | 子进程调用 Wrangler CLI；`dev`、`d1 migrations apply`、`d1 execute`     | 本地命令固定 `--local`，无需远程密钥                        | 子进程非零状态使 npm 命令失败                                    | `scripts/local-tools.ts`、`scripts/database.ts`、`package.json` |
| Cloudflare 直接 Worker 部署 | `npm run deploy` → 构建 → `wrangler deploy --config wrangler.jsonc`     | 本机 Wrangler OAuth；自动化也可使用受限 Token，但当前未配置 | Wrangler 负责 API 协议、上传和错误；不在源码手写 REST 请求       | `package.json`、`wrangler.jsonc`                                |
| Cloudflare Pages Git 集成   | 后台连接 `Vibes-college/Vibes`，由 Cloudflare 拉代码并构建              | 你确认 GitHub App 安装授权                                  | 后台构建日志与部署 URL；接入状态见 `docs/CI.md`                  | 配置参数见 `docs/CONFIG.md`                                     |
| GitHub Actions              | push、pull_request 或手动触发 `verify` 与 `budget` 工作流               | 自动临时身份；`contents: read`                              | 任一任务失败显示红叉；不提交部署密钥                             | `.github/workflows/check.yml`                                   |
| GitHub CLI（初始化管理）    | `gh repo create`、`gh api`、Git push                                    | 已登录的 `Vibes-college` 账号                               | 创建、关联、规则配置均检查实际结果；不是网站运行依赖             | 初始化记录见 `docs/CI.md`                                       |
| ego-browser                 | Shell heredoc 调用 `ego-browser nodejs`，使用页面快照、点击、输入和 CDP | 本机 ego lite；不把登录凭据传进项目                         | 断言抛错时命令失败；成功后关闭测试空间                           | `scripts/ego-e2e.sh`                                            |
| Playwright                  | GitHub CI 中调用已安装的 Playwright CLI                                 | 临时 Chromium 浏览器，无业务凭据                            | 桌面/手机回归；失败使 CI 失败                                    | `playwright.config.ts`、`tests/explore.spec.ts`                 |
| 既有 Sites 托管             | 由 Codex Sites 平台发布，不是项目里的 npm REST 客户端                   | 平台授权，凭据不写入仓库                                    | 与新 Pages 项目及直接 Worker 部署分别管理                        | `.openai/hosting.json`                                          |

代码中没有第三方 SDK 请求体、Webhook 接收端或业务接口重试规则；Cloudflare/GitHub 的底层认证、API URL 和传输由各自 CLI 或平台负责。

## 以后新增服务时必须补充

每个服务记录：用途、实际调用文件、请求方法与路径、输入/返回结构、认证变量名字、超时/重试/限流方式、失败时用户看到什么、对应测试。只记录变量名；密钥值由你保存在本地私密文件或线上后台。
