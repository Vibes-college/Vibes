---
tense: 'living'
describes: '旧项目配置资产清单'
status: 'stale'
shaped-by: []
---

# 旧项目配置资产清单

整理日期：2026-09-05。只记录名称、用途、来源和核对状态，不记录配置值、账号 ID、登录邮箱、密码、Token、私钥、Webhook 完整地址或恢复码。

**状态：配置名称待平台核实，密钥值不在本文件中。** 此清单仅用于核对资产，不表示资源正在运行或密钥已备份。

## 来源和范围

旧项目根目录：`/Users/jachi/Desktop/Vibecoding-College`。产品、私有文档和 Paseo 是分开的仓库。

- 产品配置：`vibecoding-college/.env.example`、`wrangler.jsonc`、`wrangler.preview.jsonc`、`workers/*/wrangler.jsonc`。
- 自动部署：`vibecoding-college/.github/workflows/`、`scripts/sync-github-secrets.ts`、`scripts/sync-worker-secrets.ts`、`scripts/worker-secret-policy.ts`。
- 扩展配置：产品 `src/`、`tools/`、`scripts/` 中环境变量引用，及 `paseo-complete-root/.github/workflows/`。
- 发布说明：旧项目 `docs/runbooks/release.md`。

## Cloudflare 资源与域名

以下名称来自本地配置，尚未向 Cloudflare 后台确认当前状态；资源 ID、DNS 记录值及详细设置应保存在密码管理器的安全备注中。

| 名称                                                                             | 用途                                   |
| -------------------------------------------------------------------------------- | -------------------------------------- |
| `vibecoding-college`                                                             | 主站 Worker                            |
| `vcc-local-preview`                                                              | 本地预览 Worker 与预览 D1 名称         |
| `vibecoding-college-db` / `DB`                                                   | 主站数据库与代码绑定                   |
| `vibecoding-college-assets` / `BUCKET` / `COVER_BUCKET`                          | 静态文件与封面存储                     |
| `vibecoding-college-artifacts` / `ARTIFACT_BUCKET`                               | 作品文件存储                           |
| `CACHE`                                                                          | KV 缓存绑定                            |
| `AGENT_DEVICE` / `AgentDevice`                                                   | 设备会话 Durable Object                |
| `IMAGE_GEN_WORKFLOW` / `vibecoding-college-image-generation-workflow`            | 图片生成任务                           |
| `ARTIFACT_INGESTION_WORKFLOW` / `vibecoding-college-artifact-ingestion-workflow` | 作品入库任务                           |
| `vibecoding-college-artifact-runtime`                                            | 作品运行 Worker                        |
| `vibecoding-college-artifact-smoke` / `ARTIFACT_SMOKE` / `BROWSER`               | 浏览器冒烟测试服务                     |
| `vibes.college`、`vibecoding.college`                                            | 主站自定义域名                         |
| `simulator.college`、`vccrun.simulator.college`、`*-vccrun.simulator.college`    | 作品运行域及路由名称                   |
| `MAIN_SITE_ORIGIN`、`LEGACY_MAIN_SITE_ORIGIN`、`RUNTIME_HOST_SUFFIX`             | 作品运行服务中的站点地址配置名         |
| Cron triggers、compatibility flags、observability、service bindings              | 定时任务、兼容选项、日志和服务关联设置 |

- 在 Cloudflare 核对账号所有者、恢复方式、API Token 权限及到期时间。
- 保存域名注册商、续费归属、Nameserver、DNS、代理开关、TLS、重定向和邮件验证设置到密码管理器安全备注。
- 核对 Worker Secrets、D1/KV/R2 标识与绑定、存储访问权限、域名路由和定时任务。
- 核对是否另有 Pages、Turnstile、Access、Tunnel 或未写入本地配置的资源；目前不确认这些服务存在。

## 配置项名称与用途

每组均待确认真实启用情况和密码管理器备份；`VITE_` 项通常为前端公开配置，不应放服务端秘密。表中的名称不代表已获得对应值。

| 分类                | 配置名称                                                                                                                                                                                                                                                                         | 用途                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Cloudflare 部署身份 | `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_DATABASE_ID`                                                                                                                                                                                                        | 部署账号、受限部署令牌与数据库定位；在 Cloudflare 及 GitHub Actions 核对。 |
| 站点与资源域名      | `VITE_BASE_URL`、`VITE_ARCADE_ORIGIN`、`VITE_OWNED_PREVIEW_ORIGIN`、`VITE_MEDIA_ORIGIN`                                                                                                                                                                                          | 主站、街机、预览和媒体访问入口。                                           |
| R2 静态文件         | `R2_BUCKET_NAME`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_PUBLIC_URL`                                                                                                                                                                                                    | 文件存储桶、读写凭据和公共访问入口。                                       |
| Artifact 存储与鉴权 | `ARTIFACT_R2_ACCOUNT_ID`、`ARTIFACT_R2_BUCKET_NAME`、`ARTIFACT_R2_ACCESS_KEY_ID`、`ARTIFACT_R2_SECRET_ACCESS_KEY`、`ARTIFACT_PREVIEW_TOKEN_SECRET`、`ARTIFACT_REPORT_TOKEN_SECRET`、`ARTIFACT_SMOKE_SERVICE_SECRET`、`ARTIFACT_RUNTIME_HOST_SUFFIX`、`ARTIFACT_MAIN_SITE_ORIGIN` | 作品存储、预览与报告签名、冒烟测试服务鉴权及运行域名。                     |
| 自动采编与发布      | `AI_CURATOR_RUNTIME_EXTERNAL_CAPABILITY_SECRET`、`AI_CURATOR_RUNTIME_EXTERNAL_SERVICE_SECRET`、`AI_CURATOR_RUNTIME_EXTERNAL_ENABLED`、`AI_CURATOR_RUNTIME_EXTERNAL_PRINCIPAL_ID`、`EXTERNAL_AUTO_PUBLISH_ENABLED`                                                                | 外部采编调用凭据、身份和发布开关；新增项目不默认启用。                     |
| 发布审批签名        | `VCC_PUBLISH_APPROVAL_PRIVATE_KEY_FILE`、`VCC_PUBLISH_APPROVAL_PUBLIC_KEY_PEM`                                                                                                                                                                                                   | 审批签名私钥文件位置及校验公钥；私钥和位置详情仅存密码管理器。             |
| 登录                | `BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`                                                                                                                                                                                                                 | 会话签名及 Google OAuth 登录；同时核对授权来源、回调地址和应用所有者。     |
| Stripe 支付         | `VITE_PAYMENT_PROVIDER`、`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`VITE_STRIPE_PRICE_PRO_MONTHLY`、`VITE_STRIPE_PRICE_PRO_YEARLY`、`VITE_STRIPE_PRICE_LIFETIME`                                                                                                             | 支付提供商、服务端凭据、回调签名及价格配置。                               |
| Creem 支付          | `CREEM_DEBUG`、`CREEM_API_KEY`、`CREEM_WEBHOOK_SECRET`、`VITE_CREEM_PRODUCT_PRO_MONTHLY`、`VITE_CREEM_PRODUCT_PRO_YEARLY`、`VITE_CREEM_PRODUCT_LIFETIME`                                                                                                                         | 测试模式、支付凭据、回调签名与商品配置。                                   |
| 邮件与订阅          | `RESEND_API_KEY`、`BEEHIIV_API_KEY`、`BEEHIIV_PUBLICATION_ID`                                                                                                                                                                                                                    | 邮件发送、订阅服务与刊物定位；另核对发信域名验证。                         |
| 通知                | `DISCORD_WEBHOOK_URL`、`FEISHU_WEBHOOK_URL`                                                                                                                                                                                                                                      | 机器人通知地址，完整地址按密钥保管。                                       |
| 客服与统计          | `VITE_CRISP_WEBSITE_ID`、`VITE_PLAUSIBLE_SCRIPT`、`VITE_GOOGLE_ANALYTICS_ID`、`VITE_UMAMI_SCRIPT`、`VITE_UMAMI_WEBSITE_ID`、`VITE_CLARITY_PROJECT_ID`                                                                                                                            | 客服、访问统计及行为分析配置。                                             |
| 图片生成            | `IMAGE_MODEL_PROVIDER`、`VITE_SHOW_IMAGE_PROVIDER`、`VITE_ENABLE_IMAGE_GENERATION`、`FAL_KEY`、`APIMART_KEY`、`KIE_KEY`                                                                                                                                                          | 图片提供商、前端功能开关及各供应商调用密钥。                               |
| Paseo AI 测试       | `CLAUDE_CODE_OAUTH_TOKEN`、`OPENAI_API_KEY`、`OPENROUTER_API_KEY`                                                                                                                                                                                                                | Paseo 工作流引用的 AI 服务凭据，仅确认代码引用。                           |
| Paseo 发布与机器人  | `EXPO_TOKEN`、`APPLE_CERTIFICATE`、`APPLE_CERTIFICATE_PASSWORD`、`APPLE_ID`、`APPLE_PASSWORD`、`APPLE_TEAM_ID`、`PASEO_BOT_APP_ID`、`PASEO_BOT_APP_PRIVATE_KEY`                                                                                                                  | 移动端发布、Apple 签名与公证、GitHub App 机器人；仅确认代码引用。          |
| GitHub 自动凭据     | `GITHUB_TOKEN`                                                                                                                                                                                                                                                                   | 工作流运行时提供的令牌名称；不把临时值作为长期密码备份。                   |

## GitHub 配置

| 仓库名称                                         | 用途                   |
| ------------------------------------------------ | ---------------------- |
| `Vibes-college/vibecoding-college`               | 旧产品源码与部署工作流 |
| `Vibes-college/vibecoding-college-control-plane` | 私有运维文档与发布说明 |
| `Vibes-college/paseo`                            | Paseo 源码及发布工作流 |

2026-09-05 通过 GitHub CLI 只读查询仓库级 Actions Secret 名称，产品仓返回以下 14 项；仅证明名称存在，不证明值有效或已备份：

```
AI_CURATOR_RUNTIME_EXTERNAL_CAPABILITY_SECRET
AI_CURATOR_RUNTIME_EXTERNAL_SERVICE_SECRET
BETTER_AUTH_SECRET
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
CLOUDFLARE_DATABASE_ID
CREEM_DEBUG
IMAGE_MODEL_PROVIDER
VITE_ARCADE_ORIGIN
VITE_BASE_URL
VITE_ENABLE_IMAGE_GENERATION
VITE_MEDIA_ORIGIN
VITE_OWNED_PREVIEW_ORIGIN
VITE_SHOW_IMAGE_PROVIDER
```

Paseo 仓库级 Secret 查询返回空列表；组织级、Environment 级、Dependabot/Codespaces Secrets 和私有文档仓未核对，不能据此认定没有凭据。

- 核对组织/仓库所有者、登录恢复方式、2FA、成员权限和计费归属。
- 核对 Actions Secrets 与 Variables、部署 Environment、审批规则、分支保护及 Rulesets。
- 核对 GitHub App、OAuth App、部署密钥、PAT 权限、Webhook 和 Cloudflare 的 GitHub 安装授权。
- 保存构建命令、输出目录、部署分支和工作流权限设置的安全备注。

旧同步脚本从 `.env.production` 写入 GitHub/Worker；它们不是备份读取工具，不应当作备份读取工具运行。工作流引用的配置与仓库级Secret清单可能不同，差异可能来自其他作用域、旧配置或停用功能，须逐项核对。

## 密码管理器待办

- 指定并连接密码管理器，确认要保存到哪个保险库。
- 为 Cloudflare、GitHub、域名及实际启用的第三方服务建立条目；保存真实账号、密钥、权限、到期时间、恢复方式与配置详情。
- 对本地私密文件独有配置进行不回显值的补充盘点，并将值直接转存密码管理器，不经 Markdown、聊天或临时明文备份。
- 逐项确认能从密码管理器取回；这里只更新备份状态和条目名称。
- 另行核对线上配置与本地配置差异；备份完成前不删除旧项目。

建议条目命名：`Vibes / Cloudflare`、`Vibes / GitHub`、`Vibes / Domains`、`Vibes / 服务名称`。这些只是建议名称，目前未创建任何密码管理器条目。
