# 项目规则

## 关于我

我不会写代码，靠 AI 维护这个项目。所以：

- 每次动手前先用 3-5 句话告诉我你打算怎么做
- 做完后用一句话告诉我：改了哪些文件、我该怎么验证
- 解释问题时假设我是完全的外行

## 技术栈（锁定，不许换、不许加同类的）

- 框架：Astro
- 部署：Cloudflare Pages + Workers
- 数据库：Cloudflare D1
- 样式：Tailwind CSS
- 语言：TypeScript

现状：Astro 和 TypeScript 已存在；当前通过 Wrangler 部署静态资源 Worker，已配置仅供本地命令验收的 D1 测试库，尚未配置线上 D1、Pages 或安装 Tailwind CSS。以上是目标技术栈，后续按任务接入，新增依赖仍须先询问。

## 硬性规则

- 新增任何 npm 依赖前必须先问我，说明为什么必须要
- 单个代码文件不超过 300 行
- 一次只做我要求的那一件事，不要“顺便”改别的
- 每个函数上方一行注释：这个函数是干什么的
- 已经有的工具函数要复用，不要重复写
- 改完必须跑 `npm run check`（类型检查 + lint + 测试），全绿才算完成
- 不确定我的意思时，先问，不要猜

统一命令：`npm run check` 依次执行类型检查、lint、格式检查和单元测试；`npm run verify` 再重建本地测试库并运行 ego-browser 端到端测试，任一步失败都算失败。命令说明见 `docs/CLI.md`。数据库命令固定为本地操作，不接受线上参数。

## 功能地图（持续维护）

- 新对话先读 `docs/features/README.md`，再按任务读取相关功能文档及涉及文件，避免为了解项目全貌反复扫描全部代码。
- 每次新增、修改、重命名或删除功能，必须在同一任务中同步功能索引和对应功能文档；模板为 `docs/features/_TEMPLATE.md`。
- 同步状态、用户操作路径、真实文件位置、验收标准、自动测试、功能依赖和已知问题，始终描述当前实现。
- 示例不等于需求，计划必须经用户确认；只有本次实际验收通过才勾选对应标准，并记录日期、环境和方法。
- 交付前核对文档路径与测试名称；发现文档和代码不一致时先查证再更新，不把未测试或未上线写成已验收或已上线。

## GitHub 与发布规则

- 初始化后禁止直接推送 main；修改在分支完成，通过 PR 与 `verify`、`budget` 检查后，由用户决定合并，未获明确合并指令不得调用合并。
- 配置、数据库、常量/规则/正则、第三方调用变更，分别同步 `docs/CONFIG.md`、`docs/DATABASE.md`、`docs/CONSTANTS.md`、`docs/INTEGRATIONS.md`。
- 本地浏览器验收使用 ego-browser，GitHub CI 使用用户确认的 Playwright 路径；两者都执行 verify，CI 另跑 budget。
- 新 Pages 测试站与旧 `vibes.college` 分开；切换正式域名需单独授权。

## 目录结构

```text
Vibes/
├── AGENTS.md                 # AI 维护规则与进度
├── docs/                    # 配置资产清单与 CLI 命令说明
│   └── features/            # 功能总索引、模板与每项功能的验收说明
├── scripts/                 # 本地数据库和 ego-browser 测试命令
├── db/                      # 数据库迁移与测试数据
├── src/
│   ├── components/          # 页面组件
│   ├── content/articles/    # 文章内容
│   ├── data/                # 作品数据
│   ├── layouts/             # 页面布局
│   ├── pages/               # 网站路由
│   ├── scripts/             # 浏览器交互
│   └── styles/              # 样式
├── public/                  # 静态资源
├── tests/                   # unit/ 单元测试与 Playwright 补充回归
├── references/              # 参考资料
├── research/                # 调研资料
├── .github/workflows/       # GitHub 自动检查
├── .openai/                 # 托管相关元数据
├── astro.config.mjs         # Astro 配置
├── wrangler.jsonc           # Cloudflare 部署配置
├── wrangler.local.jsonc     # 本地 D1 与预览配置
├── eslint.config.mjs        # 代码检查规则
├── .prettierrc.json          # 统一排版规则
├── tsconfig.tools.json      # 命令与测试的类型检查
├── playwright.config.ts     # 测试配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 依赖和命令
```

`node_modules/`、`dist/`、`.astro/`、`.wrangler/`、`test-results/` 为依赖、构建产物或本地运行数据。目录变更后同步更新这里。

## 当前进度

- 2026-09-05：建立项目规则与旧项目配置资产名称清单；密钥值尚未备份到密码管理器，线上域名配置待核对；统一检查入口尚未包含 lint 和测试。

- 2026-09-05：建立统一项目命令、CLI 使用说明、本地 D1 迁移和测试数据、ego-browser 验收及代码检查工具；`npm run verify` 全部通过，Playwright 补充回归 10 项通过，部署仅执行 dry-run，未上线。

- 2026-09-05：建立功能地图、模板及 9 项现有功能/维护工具说明；新增对话阅读与功能变更同步维护规则。

- 2026-09-05：补齐配置、数据库 SQL、常量规则、集成和 CI 文档，创建私有 GitHub 仓库；远端检查与 Cloudflare 接入状态见 docs/CI.md。
