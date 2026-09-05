# 功能名：GitHub 自动验收与新站接入

## 状态

🚧 开发中（本地检查已配置，远端检查与 Cloudflare 接入结果见 CI 文档）

## 一句话说明

每次提交自动检查代码和文件体积，之后通过 PR 管理正式分支，并把新站连接到独立的 Cloudflare Pages 项目。

## 用户操作路径

1. 查看私有仓库 `Vibes-college/Vibes` 中的分支或 PR。
2. 等待 `verify` 和 `budget` 两项检查完成，失败时查看 Details。
3. 检查全部通过后，由你决定是否合并。
4. Cloudflare 连接 GitHub 和首次发布按 [CI.md](../CI.md) 的步骤操作，旧域名暂不切换。

## 涉及的文件

- [工作流](../../.github/workflows/check.yml)
- [体积规则](../../scripts/budget-policy.ts)
- [体积检查](../../scripts/budget.ts)
- [浏览器运行器](../../scripts/test-e2e.ts)
- [配置说明](../CONFIG.md)
- [CI 与初始化状态](../CI.md)

## 验收标准

- [ ] GitHub 仓库为私有，并有 main 分支。
- [ ] 每次 push / PR 自动执行 verify 与 budget，失败显示红叉。
- [ ] main 的 PR 和必需检查保护在 GitHub 实际生效。
- [ ] Cloudflare 新 pages.dev 地址能显示目录并进入文章。
- [ ] 旧 vibes.college 继续由原项目服务。

## 对应的自动化测试

`tests/unit/budget.test.ts` 验证超出阈值和无效计量被拒绝；`npm run verify` 验证主要功能；`npm run budget` 检查实际构建体积。仓库权限和部署状态需读取平台结果，不能用本地测试代替。

## 依赖的其他功能

- [统一项目命令](project-commands.md)
- [精选目录](explore-browse.md)

## 已知问题 / 待办

已复用 Chrome 中的 Cloudflare 登录，现停在 GitHub App 授权页，需本人确认；Pages Git 连接待完成。GitHub 已返回 HTTP 403，当前私有仓库需 GitHub Pro 才能启用分支保护，保护尚未生效，详见 [CI.md](../CI.md)。人与 AI 共用同一 GitHub 身份，不能仅靠分支规则识别是否本人点击合并。

## 最近核对

2026-09-05：main 已推送；首次 budget 通过，verify 的 Node 类型依赖缺失正在独立分支修复；分支保护受套餐限制，Pages 等待本人授权。
