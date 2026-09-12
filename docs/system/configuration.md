---
tense: 'living'
describes: '配置和环境变量'
status: 'current'
shaped-by: ['001', '004', '005', '009', '010', '013']
code-sources:
  [
    'package.json',
    'package-lock.json',
    'astro.config.mjs',
    'scripts/paseo-webui-dev.ts',
    'src/features/paseo-webui/build-config.ts',
    'scripts/content-security.ts',
    'wrangler.jsonc',
    'wrangler.local.jsonc',
    'tsconfig.json',
    'tsconfig.tools.json',
    'eslint.config.mjs',
    'playwright.config.ts',
    '.prettierrc.json',
    '.prettierignore',
    '.gitignore',
    '.dev.vars.example',
    '.openai/hosting.json',
    'src/config/site.ts',
    'public/_headers',
    'public/_redirects',
  ]
code-revision: '55750fb70fd1a9301a20bfccfc99a1769c8f316e23d6c19655813d62d630e48e'
---

# 配置和环境变量

说明当前代码实际读取的配置，只保存名称、用途与源码位置，不保存密钥值。旧项目服务没有自动迁入。

## 当前环境

开发流程工具为 Spec Kit 1.0.4，通过 `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.0.4` 安装到本机工具环境，不是 npm 或网站运行依赖。版本与初始化参数见 `.specify/init-options.json`；Codex skills 位于 `.agents/skills/`。升级需明确版本并审查生成文件差异，不能在初始化时覆盖项目决定。`.prettierignore` 排除上游受管理的技能、模板、清单与工作流，以保持安装清单哈希；项目自己维护的宪章和文档仍接受格式检查。使用与验收边界见 [Spec Kit 工作流](../features/document-governance.md)。

| 项目                | 当前配置                                                        | 用途 / 修改位置                                                     |
| ------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| 框架                | Astro 静态输出，TypeScript                                      | `astro.config.mjs`、`tsconfig.json`                                 |
| Node                | 至少 22.20.0；CI 固定 22.20.0                                   | `package.json`、`.github/workflows/check.yml`                       |
| 依赖版本            | `package-lock.json` 锁定，使用 `npm ci`                         | 不手改锁文件；新增依赖先询问                                        |
| 开发地址            | 通常为本机 4321，以终端实际地址为准                             | `npm run dev`；端口占用时 Astro 可能使用其他端口                    |
| Cloudflare 本地预览 | 本机 4322                                                       | `npm run preview`、`wrangler.local.jsonc`                           |
| 本地数据库          | `DB` / `vibes-explore-local`                                    | `wrangler.local.jsonc`；标识只供本地模拟使用                        |
| 本地数据目录        | `.wrangler/project-local/`                                      | `scripts/local-tools.ts`；不提交 Git                                |
| 直接 Worker 部署    | `vibes-explore`，静态资源 `dist`                                | `wrangler.jsonc`；静态资源配置；生产自动部署与PR版本预览            |
| 既有 Sites 绑定     | 已有托管项目                                                    | `.openai/hosting.json`；保留，不写入凭据                            |
| 页面标准域名        | `SITE_URL`，本地默认127.0.0.1:4322                              | `src/config/site.ts`统一供Astro、布局、sitemap和robots使用          |
| 正式域名            | `vibes.college`，用户已于2026-09-06授权                         | wrangler.jsonc的Custom Domain；已转接上线；发布与恢复结果见交付说明 |
| 缓存与安全响应头    | 精确脚本哈希、拒绝被嵌入、允许登记媒体/iframe、构建资源缓存一年 | `public/_headers`                                                   |

## Markdown与排版依赖

Astro使用官方`@astrojs/markdown-remark`处理器，以remark-directive、remark-math和rehype-katex编译扩展块与公式，Shiki在构建期高亮。`@prose-ui/style`仅提供CSS；Geist字体与Lucide图标作为附许可证的本地静态文件使用，普通Markdown正文不需要React。@astrojs/mdx与@astrojs/react分别提供MDX编译和React islands；网站的react/react-dom在需要交互的岛上加载，@types/react及@types/react-dom用于类型检查，tsconfig.json使用react-jsx。Paseo另带固定原生运行时，仅首次主动打开助手后加载。Motion用于beUI组件动画，lucide-react提供其原版图标，clsx与tailwind-merge保留原版类合并行为；Tailwind与@tailwindcss/vite在构建期生成组件样式，不加载浏览器运行库，不导入全局Preflight，仅扫描beUI组件及演示目录。版本锁定在package.json；接线为astro.config.mjs及src/lib/markdown/config.ts。作用域、资源和写法见[Markdown排版](markdown.md)。

构建后scripts/content-security.ts扫描HTML中的内联可执行脚本，并接收固定2048打包模板与原生Mermaid沙盒的脚本摘要，按精确内容补充dist/_headers的SHA256许可，支持从普通页面连续导航到互动文章。Astro内置CSP当前不兼容ClientRouter，因此不同时开启两套策略；主页面脚本不使用unsafe-inline或unsafe-eval。

Paseo按固定上游及补丁独立构建，默认产品构建必须包含有效原生产物；本地对照可用VIBES_PASEO=disabled，发布拒绝禁用。首次打开前不下载其专用资源或连接电脑；启用构建的主页面响应策略允许原生手工连接所需协议和blob资源，实际浏览器与daemon限制见[接口与服务](interfaces.md#paseo本地助手)。安装树、构建命令、公开资源版本及本地SITE_URL要求见[Paseo接入](local-assistant.md)，不需要网站AI API密钥。

## 环境变量名称

发布构建必须设置SITE_URL；当前网站没有必填业务密钥，没有登录、支付、邮件或 AI API 密钥。因此 `.dev.vars.example` 仅有说明，没有为了凑模板而增加无用变量。

| 名称                                            | 谁提供 / 放哪里         | 用途                                                                                                 |
| ----------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `CI`                                            | GitHub Actions 自动提供 | 云端禁止test.only；本地与CI均不复用服务                                                              |
| `GITHUB_ACTIONS`                                | GitHub Actions 自动提供 | 平台身份标志，不参与浏览器选择                                                                       |
| `NODE_VERSION`                                  | 当前脚本不读取此变量    | 平台可能使用的名称；当前CI由setup-node固定版本                                                       |
| `GITHUB_TOKEN`                                  | GitHub Actions 临时提供 | CI 读取代码所需的平台身份；普通检查授予 `contents: read`，发布job另有 `deployments: write`；无需手填 |
| `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` | Wrangler 自动部署身份   | Token仅放GitHub production环境secret；account由固定releaseTarget提供；本机OAuth用于阶段预览          |

本地与CI均以1个worker串行运行Playwright Chromium和WebKit，包括分章评价、媒体与Paseo专项回归；按实际环境报告结果。Paseo测试另启动仅回环地址可达的隔离官方mock daemon，子进程使用独立HOME、PASEO_HOME及临时工作目录，不继承用户模型凭据或启用真实provider；4396为测试页面/协议代理，6796为测试daemon，冲突时失败并保留其他服务。浏览器配对状态只在新context建立时种入一次，刷新或清除之后遵循真实存储行为。生产发布由GitHub检查工作流负责，不再配置第二套Cloudflare Git自动发布，以免抢先上线或重复构建。

## 本地与线上如何保存值

- 本地示例：`.dev.vars.example` 只记变量名，值留空；真实 `.dev.vars` 由AI按实际需要配置；缺少值或必要信息时向用户询问，不要求用户手写配置文件。当前没有必填业务密钥，不创建无用变量。
- `.env`、`.env.*`、`.dev.vars`、`.dev.vars.*` 均由 `.gitignore` 排除，明确允许无秘密的 example 文件。
- 构建时读取的 `.env` 与 Worker 运行时的 `.dev.vars` 不是一回事；当前静态网站不读取业务配置。未来新增服务时，同时说明变量在哪个阶段读取。
- 线上未来需要的秘密由AI在具备授权和工具访问时配置，并区分 Production / Preview；需要用户登录、授权或亲自操作时，说明具体入口、步骤和完成标志。本文件只记录名字与用途，不记录值；秘密不写入Git、PR或日志。
- `PUBLIC_` 等前端公开变量不能放私钥；不要把密码放在 `src/content/works/` 或网站静态文件里。

## 文件组织与检查排除

外部快照在 `resources/references/`，本地证据在 `resources/evidence/`；`.gitignore`、`.prettierignore`、`eslint.config.mjs` 同步排除这两项，`tsconfig.json` 排除resources。它们不属于网站构建输入。node_modules目录及隔离worktree复用依赖的同名符号链接均不提交，.gitignore以node_modules匹配。完整文件职责见 [仓库地图](../README.md)。

CI范围由CHECK_BASE_REF（默认origin/main）和GITHUB_EVENT_NAME决定；GITHUB_OUTPUT用于传递范围。冻结检查独立使用DOCS_BASE_REF，缺失基线失败。详见[CI](../system/checks-and-release.md)。

## 内容构建与隔离测试

`SITE_URL`为纯origin，非本地必须HTTPS；`VIBES_DEPLOY=1`开启发布校验，缺失SITE_URL、localhost会失败，vibes.college为已授权生产origin。它只用于构建，不是浏览器秘密。

`VIBES_CONTENT_DIR`与`VIBES_TAXONOMY_FILE`覆盖隔离内容源；必须同时指定位于.scratch下的`VIBES_OUT_DIR`。scripts/build.ts在Astro前校验，随后为该输出生成Pagefind；Astro缓存随隔离输出分开，避免测试覆盖真实dist。正常命令不设置这些变量，读取src/content/works与src/data/taxonomy.json。

eslint.config.mjs与.prettierignore排除.scratch合成内容和产物；它们不进入提交或部署。

受控发布目标由scripts/release-policy.ts限定Worker vibes-explore、账户d2338644c67dab28bdc257b40d0fa115、来源https://vibes.college；这些标识不是密钥。生产由scripts/release-ci.ts复用main验收产物并按wrangler.jsonc发布；scripts/release.ts仅处理PR版本预览与已记录版本恢复，预览不提升生产。SITE_URL、VIBES_DEPLOY与账户由发布流程配置；不会生成旧流程的.scratch/release-config.json。

## 发布身份与权限

CLOUDFLARE_API_TOKEN只授予部署所需Worker脚本编辑及vibes.college域名相关权限；仅发布job注入，不传给PR检查。身份配置由AI完成，缺少登录/授权时给用户具体步骤；不把短期本机OAuth复制为长期CI secret。GitHub production环境已于2026-09-06通过API建立，限制部署分支为main；环境secret已配置并验证令牌有效、域名和目标Worker可读取，权限为指定账户Workers Scripts编辑、vibes.college的Workers Routes编辑与Zone读取；首次自动部署已由[main运行34029233677](https://github.com/Vibes-college/Vibes/actions/runs/34029233677)及[线上验收](https://github.com/Vibes-college/Vibes/pull/3#issuecomment-5558821204)确认成功。后续仍按每次实际发布记录判断状态。

wrangler.jsonc使用workers_dev:false、preview_urls:true和唯一vibes.college custom_domain。预览使用版本URL而非独立测试Worker，生产构建SITE_URL=https://vibes.college，PR预览同canonical并加noindex。发布元数据/__release.json仅公开源码SHA和产物摘要，不包含秘密。

astro.config.mjs在客户端构建中让动态目标由原生import下载，仅并行准备其依赖，避免WebKit将失败的modulepreload一直留在缓存；现有搜索失败后刷新重试回归覆盖。

Astro在公共布局启用ClientRouter，`prefetchAll:false`关闭全站自动策略，由`src/scripts/reading-prefetch.ts`选取有限阅读目标。`public/_headers`为中英文页面设置60秒公开缓存，构建哈希资源仍缓存一年；详见[系统规则](rules.md)。

## 作品媒体

媒体和平台登记见src/config/media.ts及[媒体规则](rules.md#媒体加载与体积)。浏览器只在点击后创建YouTube、Spotify、B站或已核对原站的iframe；媒体下载、账号和地区限制由平台决定，无平台API密钥。音视频文件只从同源或指定来源加载，图表数据经有界GET读取；完整来源不提前挂到元素。2048仅在点击后读取本站MIT源码模板，以不允许同源访问的sandbox运行。构建时scripts/sandbox-game.ts将固定游戏的CSS/JS内嵌到64KiB以内的game-bundled.txt，保留旧game.txt，脚本按精确SHA256加入所有页面共用的CSP；沙盒不再发起样式或脚本子请求，避免部分浏览器网络环境阻止不透明来源的资源访问。开发服务器仍读取原始素材。游戏脚本继续计入媒体预算一次，不访问父页面DOM或持久存储；仅向父页面报告初始化，父页面核对消息确实来自当前沙盒。5秒没有初始化信号会停止并提供完整刷新入口，恢复旧页面继承CSP不含新摘要的情况。

ESLint仅对public/media/2048/game.js这一份带MIT署名的上游压缩分发文件豁免本项目风格规则；自有媒体代码仍完整检查，原始来源版本见同目录SOURCE.txt，实际游戏操作与总脚本预算仍有测试。
