---
tense: 'living'
describes: 'VIBES / Explore'
status: 'current'
shaped-by: ['002']
---

# VIBES / Explore

Explore帮助访客发现AI作品与应用、理解能力边界。网站使用Astro静态页面与双语全文搜索；没有公开编辑、账号或业务API。

仓库分四类：[实现与文件地图](docs/README.md)、[协作规则](AGENTS.md)、[功能现状](docs/features/README.md)、[变更索引](specs/README.md)。产品边界见 [项目总览](docs/PROJECT_ANALYSIS.md)。

## 运行与发布

Node22.20+，首次npm ci，开发npm run dev，本地Cloudflare预览npm run preview。

- npm run check：类型、lint、格式、文档治理、单元测试。
- npm run verify：check、本地测试D1重建、浏览器验收；本地与CI均为Playwright Chromium和WebKit。
- npm run budget：网站构建和体积预算。
- npm run docs:check：源码对应、有效链接、时态、索引与冻结保护。

命令与发布流程见 [检查与发布](docs/system/checks-and-release.md)。修改走分支与PR，用户决定合并；独立测试站与旧vibes.college分开。
