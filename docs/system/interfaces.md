---
tense: 'living'
describes: '接口与外部服务'
status: 'current'
shaped-by: ['001', '003', '004', '005', '009', '010', '013', '014', '016']
code-sources:
  [
    'src/scripts/search.ts',
    'src/scripts/explore.ts',
    'src/pages/robots.txt.ts',
    'src/pages/sitemap.xml.ts',
    'scripts/release.ts',
    'scripts/release-ci.ts',
    'scripts/release-smoke.ts',
    'scripts/release-preflight.ts',
    'scripts/ci-acceptance.ts',
    'scripts/ci-acceptance-resolver.ts',
    'scripts/ci-acceptance-policy.ts',
    'scripts/release-policy.ts',
    'src/components/WorkDetail.astro',
    'src/features/paseo-webui/contract.ts',
    'src/features/paseo-webui/preview-carrier.js',
    'scripts/content-security.ts',
    'scripts/paseo-webui-preview.ts',
    'public/_headers',
  ]
code-revision: '9c6dd3398f763a7295af10a3f882cdc662f03027ec1e87ac06936c62ea946a4d'
---

# 接口与外部服务

## 1 没有业务 API

代码中没有 `/api/*` 路由、登录接口、内容提交接口、数据库查询接口、支付回调接口、邮件接口或 Server Actions。网站的页面在构建时生成，用户请求到的是静态文件。

因此不存在下面这些输入/输出：

- 没有账号注册、登录、退出或找回密码的输入输出。
- 没有文章投稿、编辑、审核或发布的输入输出。
- 没有评论、收藏、点赞、关注或消息接口。
- 没有商品、订单、支付、退款或发票接口。
- 没有上传文件、图片、音频或视频的接口。

## 2 构建与发布生成的静态资源地址

### `GET /robots.txt`

- 输入：无参数。
- 输出：`text/plain` 文本，包括 `User-agent`、`Allow` 和 sitemap 地址。
- 用途：告诉搜索引擎哪些地址可以抓取，以及站点地图在哪里。
- 实现：`src/pages/robots.txt.ts`。

### `GET /sitemap.xml`

- 输入：无参数。
- 输出：`application/xml` 的 `<urlset>`，每项是一个 `<url><loc>...</loc></url>`。
- 内容：所有已发布语言的 Explore 首页、分页、标签页和作品详情页。
- 不包含：搜索参数、草稿、未发布翻译、没有内容的标签页。
- 实现：`src/pages/sitemap.xml.ts`。

### `GET /__release.json`

发布产物包含源码sha与内容digest，用于线上版本核对，不是业务API、不含秘密。普通本地build不生成；release-artifact.ts在发布准备时写入，release-smoke.ts检查该SHA与zh/en页面。

## 3 浏览器内部的搜索接口（不是本项目的 HTTP API）

搜索不请求项目后端，而是读取构建时生成的同站 Pagefind 静态索引。

- 输入：搜索字符串，以及可选的 `tag` 类型筛选。
- `q` 在写入网址前最多保留 160 个字符。
- 内部调用形式：`search(query, { filters: { tag } })`；没有标签时不传筛选项。
- 返回：Pagefind 结果数组。每个结果有 `id`，并可异步读取 `url` 和 `meta`。
- `meta` 中会包含作品 ID、类型、标题、摘要、预览图信息等。
- 前端会检查结果必须属于本站、当前语言和合法作品 ID，并转义文本后才生成卡片。
- Pagefind 加载或分片失败时，页面显示错误并允许重试；单次操作超过约 15 秒会被视为失败。

实现：`src/scripts/search.ts`、`src/scripts/explore.ts`。Pagefind 的 `createInstance`、`init`、`destroy` 和 `search` 是依赖库的浏览器接口，不是 VIBES 对外承诺的 API。

## 4 维护和发布命令接口

这部分是给维护者用的命令行入口，不是访客 API：

- `npm run content:validate`：检查内容文件和发布关系，不写入文件。
- `npm run content:revision -- <id>`：输出某作品的原文摘要、语言状态和译文是否待复核。
- `npm run db:reset`、`npm run db:migrate`：只操作本地测试 D1。
- `npm run build`：检查内容、生成静态网站和 Pagefind 索引。
- `npm run verify`：类型、格式、文档、单元测试、本地数据库和浏览器验收。
- `npm run deploy`：拒绝本地直接发布，指向main检查后的自动流程。
- `npm run release:preview -- <PR号>`：本地完整验收后上传阶段预览，不提升生产。
- `npm run cleanup:task -- <PR号> [--execute-idle]`：检查PR与上线证据，报告或清理本任务分支和空闲干净worktree。

## 外部平台与认证

release-utils.ts通过gh api GET读取固定仓库Vibes-college/Vibes的pulls/{number}、git/ref/heads/main以及Actions运行/jobs。preview核对open PR的head，production核对当前main与同一运行verify/budget依赖结果；ci-acceptance按当前commit关联PR、指定workflow/head的最新运行、当前attempt jobs、artifact和Git commit tree读取复用证据。每请求最多15秒，列表最多100项，关联PR必须唯一；小artifact上限16KiB，下载和JSON输出有界且验证GitHub摘要，不解压执行文件。失败完整回退；cleanup核对已合并、上线SHA包含合并、main部署job成功。查询错误阻断，不绕过限流。clean-up通过git远端引用查询与带预期SHA的删除操作防止清理额外提交。

本机预览使用Wrangler OAuth，生产job仅注入GitHub环境secret CLOUDFLARE_API_TOKEN，账户/Worker/origin固定在release-policy.ts。release.ts只做versions upload/rollback，release-ci.ts做deployments list与deploy；生产仅绑定vibes.college，不同时启用另一套Git自动发布。平台上传错误传递，不盲目重试不确定发布。

范围分类读取已上线/__release.json确定main累计影响，未知基线完整验证。线上验收marker每请求10秒、强核验资源每请求15秒超时，最多6轮、轮间5秒。main从已核验dist生成预期，检查确切SHA/摘要、双语页和关键Paseo响应的字节、安全头、MIME与缓存；资源路径限定本源双语页、版本化Paseo脚本/样式与预览载体。旧恢复/阶段预览保留SHA及双语页检查；失败保留证据，不清理。只有验收轮询重试，上传不自动重试。详细边界与实际状态见[交付](checks-and-release.md)。

## 新增服务时需要说明

用途、调用文件、方法与地址、输入/返回、认证变量名、超时/重试/限流、失败时的反馈和对应测试。只列名字，不保存秘密值。作品的外链不等于平台集成。

站内导航和提前准备使用同站详情HTML GET，没有新增业务API。Astro公共`navigate`与`prefetch`接口分别处理导航和HTTP预取；搜索加载器按zh/en返回独立Pagefind实例，创建时核对当前文档语言，过时加载以AbortError终止。

文章图片可引用HTTPS外链，浏览器直接向图源请求；img-src允许HTTPS图片，字体保持同源，媒体文件及iframe按登记来源。启用助手的主页面还允许下述原生连接类型及blob脚本/图片；第三方图源中断不阻止其余正文阅读，维护者应提供替代文字与尺寸；详见[Markdown排版](markdown.md)。

MDX组件在文章内部按client指令启动，同页共享React模块，从本站加载；没有新增业务接口。构建只执行受信仓库组件，不读取远程MDX。需要后台的组件不能仅靠复制源码接入，须明确新的接口与权限。

## 作品媒体

媒体和平台登记见src/config/media.ts及[媒体规则](rules.md#媒体加载与体积)。浏览器只在点击后创建YouTube、Spotify、B站或已核对原站的iframe；媒体下载、账号和地区限制由平台决定，无平台API密钥。音视频文件只从同源或指定来源加载，图表数据经有界GET读取；完整来源不提前挂到元素。2048点击后仅读取`/media/2048/game-bundled.txt`，发布模板内含固定游戏样式与脚本，不再从沙盒请求子资源；仍以不允许同源访问的sandbox运行，不访问父页面或持久存储。旧`game.txt`保留给已打开页面；初始化未成功会给出完整刷新入口。精确脚本授权及体积限制见[运行配置](configuration.md)。

## Paseo本地助手

首次点击助手后浏览器读取`/vendor/paseo/{内容标识}/`内的固定Web资源，以官方协议连接访客配对的电脑。原生连接设置保留官方中继、手工直接连接和自建中继；启用助手的构建由`withPaseoRuntime`设置connect-src self、ws:、wss:、http:、https:、data:、blob:。这些响应策略从主页面加载时就生效，首次点击控制的是专用资源加载和连接启动；并非为每台已配对电脑生成地址白名单。

浏览器混合内容、本地网络访问权限、HTTP请求的CORS，以及daemon自身的Host/Origin校验继续生效；允许相应协议不保证任意地址可连通，也不绕过这些限制。本地测试通过同源WebSocket代理连接自己的隔离daemon。消息、工具/审批、历史与文件操作由Paseo官方客户端和daemon承担，Vibes没有增加转发聊天或文件的业务API。电脑及Agent账号由访客提供，模型能力和权限取决于其实际配置。

主页面script-src允许self、WebAssembly、blob及当前构建的精确内联哈希，仍不允许unsafe-inline或unsafe-eval；img-src加入blob以显示原生图片附件，worker-src显式保持self，避免blob脚本许可通过回退规则扩展到Worker。固定原生版本的插件执行仍使用eval，目前尚未接通；允许blob脚本本身不代表插件已可运行。禁用助手的本地对照构建保留基础同源连接策略。

宿主与原生应用的本地合同在`src/features/paseo-webui/contract.ts`：宿主提供原生根与工具栏插槽、尺寸/可见性/焦点/语言及一次性公开文章引用，原生回报挂载、错误、尺寸请求或已加载保存设备。严格拒绝未知事件字段和不安全URL；合同不接收配对秘密或本地文件内容。文章引用只在用户提交时成为原生text附件，删除和失败恢复由原生草稿处理。完整数据和存储边界见[Paseo接入](local-assistant.md)。

小窗听写使用原生dictation协议：浏览器用户授权麦克风后，音频经已有连接送到电脑，转写文字再通过原生Composer提交或排队。官方默认英语模型在电脑转写，实际provider仍由电脑配置；Vibes没有新增音频代理或转写API。真实麦克风与iPhone验收不由本地模型测试音频的协议结果代替，范围见[听写与音频边界](local-assistant.md#听写与音频边界)。

原生文件预览包含文本、图片、Markdown及受限HTML。HTML用`/paseo-preview/`静态载体的独立响应策略，HTTP和iframe均使用不含allow-same-origin的sandbox allow-scripts；只在这个隔离文档允许文件内联脚本和eval。策略禁止fetch/WebSocket连接、子框架、表单、对象和base地址，图片/媒体仅允许data或blob。原生HTML仍可导航自己的窗口，因此不能把connect-src none解释为全面禁止网络。父页面验证来自该窗口的握手和随机标识后传入文件，载体写入HTML前删除消息桥；文件脚本不能访问父页面、配对存储或继续接收其他文件。

预览响应不缓存、不发送Referer并要求不索引；全站frame-src允许同源载体，其他页面仍由frame-ancestors none与X-Frame-Options DENY拒绝被嵌入。主页面不因预览而启用unsafe-inline/unsafe-eval。该路径不是文件上传或服务器读取接口，直接打开也没有本地文件内容。PDF/Office没有新增预览或转换服务；下载能力不超出原生连接支持范围。实际Cloudflare响应与完整预览交互仍以当前验收记录为准。

文章正文提供该语言.md或.mdx源文件的GitHub编辑链接，浏览器直接进入GitHub登录/fork/PR流程；网站不接收提交或持有GitHub凭据。见[贡献流程](content-contributions.md)。
