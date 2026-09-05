# 自动验收与 GitHub / Cloudflare 初始化

## 你在 PR 页面会看到什么

PR 是“申请把改动放进正式分支”的页面。每次推送分支、提交 PR 或手动运行工作流，GitHub 都会执行两项检查：

| 检查名字 | 做什么                                                                                     | 成功表示什么                                                           |
| -------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `verify` | `npm run verify`：类型、lint、格式、单元测试 → 重建临时本地 D1 → Playwright 桌面与手机测试 | 这些自动验收步骤在 GitHub 的临时机器上通过                             |
| `budget` | `npm run budget`：构建并检查文件体积                                                       | JS 压缩后小于 10000 字节，首页小于 40000 字节，交互源码小于 12000 字节 |

黄色圆点表示等待或执行中；绿色勾表示通过；红叉表示失败。点击 Details 查看哪一步失败，把错误交给 AI 修复后再推送；没有真正运行或被取消不等于通过。

本地 `npm run verify` 仍用 ego-browser；GitHub 云端按你确认的方案使用现有 Playwright，不安装或冒充本机 ego-browser。完整判断条件在 `scripts/test-e2e.ts`：`GITHUB_ACTIONS` 和 `CI` 都为 `true`。

工作流文件：`.github/workflows/check.yml`；Node 固定 22.20.0；只读代码权限，没有部署步骤和业务密钥。两个 job 分别最多运行 15 分钟和 10 分钟；每个 job 的步骤顺序执行，失败即停止。私有仓库的运行受账号额度和账单状态限制，不能把“没启动”说成代码通过。

## main 如何上锁

目标设置：要求 PR、要求 `verify` 与 `budget` 通过、分支必须更新到最新 main、规则也适用于管理员、禁止强推和删除。

个人账号与 AI 当前共用同一个 GitHub 身份，GitHub 无法区分“你点了合并”还是“AI 用同一账号调用了合并”。因此项目规则明确要求：初始化后的改动走分支和 PR，只有你明确要求合并时 AI 才能执行；不能声称仅凭这个设置就从技术上保证只有人能合并。

单人仓库不默认要求另一位审阅者批准：PR 作者不能批准自己的 PR，而你和 AI 是同一账号；要求 1 个独立批准会导致无法完成正常合并。仍要求经过 PR 和两项 CI。若以后需要技术隔离，应给 AI 单独的受限账号，并单独设计授权。

GitHub 私有仓库的分支保护取决于账号计划；若平台拒绝，本页会明确记录，不会改成公开仓库或自动购买升级。官方说明：[受保护分支](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)。

## Cloudflare Pages 连接步骤

1. 打开 Cloudflare → Workers & Pages → Create application → 选择 Pages → Import an existing Git repository。
2. 选择 GitHub；如果出现安装或授权页，由你亲自确认。只选择需要的 `Vibes-college/Vibes` 仓库权限。
3. 项目名建议 `vibes`（若名称被占用，用后台给出的可用名字）；生产分支 `main`。
4. 框架选 Astro；构建命令 `npm run build`；输出目录 `dist`；根目录使用仓库根目录；构建环境变量 `NODE_VERSION` 填 `22.20.0`。
5. 创建部署，等待构建成功，打开实际返回的 `pages.dev` 地址，查看目录、搜索 LoRA 并进入文章。这是已有网站，不会把现有产品替换成 Hello。
6. 当前没有业务密钥需要填写；以后新增时按 `CONFIG.md` 的名字填写到对应 Production / Preview 环境，由你保管值。

本次不修改旧站 `vibes.college` 的 DNS、Worker 路由或绑定。以后切换前，先在新地址验收，再单独处理正式域名、标准 URL 和回滚方案。

Cloudflare 连接 Git 后可能在推送到生产分支时自动构建；它不天然等待 GitHub CI 完成。main 的 PR/检查保护要实际生效，不能仅靠“已经有 CI”推断线上受到保护。

参考：[Cloudflare Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/)、[Astro 构建配置](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)。

## 初始化实况（2026-09-05）

- 已发现本地已有 Git 历史，不重新初始化或改写历史；本次交接提交使用 `chore: 初始化项目`，不是伪造一个新的最早提交。
- 私有仓库已创建：[Vibes-college/Vibes](https://github.com/Vibes-college/Vibes)。
- GitHub CLI 与 Wrangler 已登录；不重复执行授权。
- 初始化提交 `ab1fbdd` 已推送 main；[首次 CI](https://github.com/Vibes-college/Vibes/actions/runs/33956934131) 的 budget 通过，verify 因缺少显式 Node 类型依赖失败；修复在独立分支与 PR 中完成，不再直接推 main。
- main 分支保护：GitHub API 返回 HTTP 403，要求升级 GitHub Pro（或公开仓库）；保持私有，当前保护未生效，不执行购买。
- 已找到 Chrome 中登录的 Cloudflare 账号，并打开 Cloudflare Workers and Pages 的 GitHub App 安装页；最终授权需你亲自确认，Git 连接和 Pages 部署尚未完成。
- 旧域名保持不变；当前未创建新 Pages 部署，也未切换旧站。
