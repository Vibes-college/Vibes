---
tense: 'living'
describes: '功能名：开发、检查、验收与部署命令'
status: 'current'
shaped-by: ['001', '002']
---

# 开发、检查、验收与部署命令

## 当前行为

npm run dev启动开发，preview构建并启动本地Cloudflare；check依次类型、lint、格式、docs:check和单元测试，失败即停止。verify接check→db:reset→test:e2e；本地与CI均为Playwright Chromium。budget构建并校验体积。

deploy经scripts/release.ts校验干净提交、同SHA云端及本地检查，再向固定独立Worker发布；release:restore恢复已记录版本。dry-run可验证打包而不发布。完整verify会清空本地测试库，需Playwright Chromium及4322端口可用。

## 文件与依赖

package.json、scripts/test-e2e.ts、scripts/docs-check.ts、scripts/check-scope.ts、scripts/build.ts、scripts/validate-content.ts、scripts/release.ts、根目录检查/预览配置与.github/workflows/check.yml。命令详细参数见 [CLI](../operations/CLI.md)；依赖 [数据库](local-database.md)、[搜索](explore-filter.md)、[详情](article-read.md)、[404](not-found.md) 和 [文档治理](document-governance.md)。

## 验收与测试

命令打印实际地址，任一步失败不继续；浏览器缺失/断言失败不冒充通过。文档CLI基线和失败退出由tests/unit/docs-check.test.ts验证，其余完整编排通过实际verify/budget验证。部署与模拟检查结果不能等同上线。

CI按差异缩减检查；npm run verify本身始终完整运行。范围规则及失败追踪见[CI](../operations/CI.md)。
