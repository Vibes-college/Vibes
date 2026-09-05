# 功能名：开发、检查、验收与部署命令

## 状态

✅ 已完成（当前本地实现范围）

## 一句话说明

维护者用固定命令启动网站、检查改动和进行完整本地验收。

## 用户操作路径

1. 运行 `npm run dev`，按终端打印的地址查看开发效果。
2. 修改完成后运行 `npm run check`。
3. 完整验收运行 `npm run verify`，按顺序完成检查、重建本地测试库、ego-browser 操作。
4. 需要模拟线上时用 `npm run preview`；决定上线后才运行 `npm run deploy`。

## 涉及的文件

- [package.json](../../package.json)
- [docs/CLI.md](../../docs/CLI.md)
- [scripts/test-e2e.ts](../../scripts/test-e2e.ts)
- [scripts/ego-e2e.sh](../../scripts/ego-e2e.sh)
- [eslint.config.mjs](../../eslint.config.mjs)
- [.prettierrc.json](../../.prettierrc.json)
- [tsconfig.tools.json](../../tsconfig.tools.json)
- [.github/workflows/check.yml](../../.github/workflows/check.yml)
- [wrangler.jsonc](../../wrangler.jsonc)

数据库：验收会调用本地测试库，见依赖功能；没有线上数据库配置。

## 验收标准

- [ ] dev 打印实际访问地址；preview 使用 Cloudflare 本地服务。
- [ ] check 顺序执行类型检查、lint、格式检查和单元测试，失败即停止。
- [ ] verify 顺序执行 check、db:reset、test:e2e，失败即停止。
- [ ] test:e2e 使用 ego-browser；浏览器缺失或断言失败不能显示通过。
- [ ] 部署模拟检查 `npm run deploy -- --dry-run` 成功，且不发布。

## 对应的自动化测试

检查入口和各测试文件的对应关系见 [CLI](../CLI.md)。`scripts/ego-e2e.sh` 是浏览器验收脚本，由 `scripts/test-e2e.ts` 启动；实际命令串联是否成功以运行结果为准，没有独立的命令编排单元测试。

## 依赖的其他功能

- [本地测试库重建与迁移](local-database.md)
- [搜索与分类筛选](explore-filter.md)
- [文章阅读与来源链接](article-read.md)
- [找不到页面的提示](not-found.md)

## 已知问题 / 待办

完整验收会清空本地测试库，需要本机 ego lite，且 4322 端口空闲。GitHub CI 使用 Playwright 执行云端浏览器验收，本地仍使用 ego-browser；两种环境都运行 `npm run verify`，另以 `npm run budget` 检查体积。部署命令沿用直接 Wrangler 路径，不等于更新既有 Sites 站点；已验证命令与模拟打包，不表示已上线。

## 最近核对

- 日期：2026-09-05。
- 依据：当前本地源码、命令配置及真实测试文件；本次为文档核对，没有重跑浏览器或线上验收。
- 验收框留空，供下一次实际验收逐项勾选；已有代码不等于所有边界都有自动测试。
