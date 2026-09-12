---
tense: 'living'
describes: 'VIBES / Explore'
status: 'current'
shaped-by: ['002', '016']
---

# VIBES / Explore

Explore帮助访客发现AI作品与应用、理解能力边界。网站使用Astro静态页面与双语全文搜索；站内没有编辑后台、账号或业务API；文章改进通过GitHub PR审阅。

仓库分四类：[实现与文件地图](docs/README.md)、[协作规则](AGENTS.md)、[功能现状](docs/features/README.md)、[变更索引](specs/README.md)。产品边界见 [项目总览](docs/PROJECT_ANALYSIS.md)。

## 改进文章

从文章正文上方的GitHub编辑入口修改对应语言的源文件，或在仓库中编辑src/content/works/。普通内容无需本机启动整站；提交PR后由CI检查、维护者审阅合并并发布。完整步骤、MD/MDX边界、预览和失败处理见[内容贡献流程](docs/system/content-contributions.md)。

## 运行与发布

Node22.20+，首次npm ci，开发npm run dev，本地Cloudflare预览npm run preview。

- npm run check：类型、lint、格式、文档治理、单元测试。
- npm run verify：check、本地测试D1重建、浏览器验收；本地与CI均为Playwright Chromium和WebKit。
- npm run verify:content：内容检查、生产构建/预算、预检与受影响文章Chromium冒烟。
- npm run budget：网站构建和体积预算。
- npm run docs:check：源码对应、有效链接、时态、索引与冻结保护。

命令与发布流程见 [检查与发布](docs/system/checks-and-release.md)。内容贡献与功能开发通过PR审阅；小型维护遵循AGENTS的按影响规则。main必要检查成功后自动发布到已授权正式站vibes.college，随后核验实际页面。
