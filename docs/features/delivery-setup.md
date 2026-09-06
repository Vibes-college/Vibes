---
tense: 'living'
describes: '功能名：GitHub 自动验收与新站接入'
status: 'current'
shaped-by: ['001', '002']
---

# GitHub检查与Cloudflare发布

## 当前行为

GitHub工作流保留verify与budget检查，按docs/tools/full范围执行；文档治理包含在verify的check中，每周单独运行文档体检。Cloudflare静态Worker部署入口为npm run deploy，使用scripts/release.ts受控发布，需要有效登录和目标权限，没有CI自动发布步骤。

## 操作路径

1. 功能分支提交PR，查看verify和budget结果；失败时按日志修复。
2. 同一PR准备最终功能说明及规格元数据，检查通过后由用户明确决定合并。
3. 核对要部署的SHA、账户与独立测试地址；发布入口要求干净提交、同SHA的GitHub verify/budget成功，再跑本地完整verify/budget并按免费档容量检查；实际发布和恢复记录在PR与resources/evidence。

## 文件与依赖

.github/workflows/check.yml、package.json、wrangler.jsonc、scripts/release.ts、scripts/release-policy.ts、scripts/test-e2e.ts、scripts/docs-check.ts；[CI规则](../operations/CI.md)、[命令](../operations/CLI.md)。

## 验收标准与测试

CI出现两个独立结果，失败不发布；本地与云端verify均使用Playwright；docs检查有可信基线。tests/unit/docs-check.test.ts验证基线错误会失败，范围分类由tests/unit/check-scope.test.ts验证，网站回归见tests/explore.spec.ts。

## 限制

配置存在不代表远端连接、分支保护或部署已完成，平台状态需实际核对；人与AI共享身份不能靠规则区分谁点击合并。旧vibes.college的域名/路由不修改；正式切换需单独授权。

受控目标为vibes-explore.topologic-relay.workers.dev，账户由release-policy.ts限定。生成配置没有自定义域名和路由；restore只接受本地记录且目标匹配的已验证版本。tests/unit/release-policy.test.ts覆盖同SHA检查门槛；实际恢复效果仍须页面核对。
