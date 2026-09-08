---
tense: 'living'
describes: '接口与外部服务'
status: 'current'
shaped-by: ['001', '003', '004', '005', '009', '010', '012']
code-sources:
  [
    'src/features/paseo-webui/contract.ts',
    'src/scripts/search.ts',
    'src/scripts/explore.ts',
    'src/pages/robots.txt.ts',
    'src/pages/sitemap.xml.ts',
    'scripts/release.ts',
    'scripts/release-policy.ts',
    'src/components/WorkDetail.astro',
  ]
code-revision: 'f523201367f207476ba039522c3af6495010316ac877aab42acf5e3fba4d7775'
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

release-utils.ts通过gh api GET读取固定仓库Vibes-college/Vibes的pulls/{number}、git/ref/heads/main以及Actions运行/jobs。preview核对open PR的head，production核对当前main与同一运行verify/budget依赖结果；cleanup核对已合并、上线SHA包含合并、main部署job成功。查询错误阻断，不绕过限流。clean-up通过git远端引用查询与带预期SHA的删除操作防止清理额外提交。

本机预览使用Wrangler OAuth，生产job仅注入GitHub环境secret CLOUDFLARE_API_TOKEN，账户/Worker/origin固定在release-policy.ts。release.ts只做versions upload/rollback，release-ci.ts做deployments list与deploy；生产仅绑定vibes.college，不同时启用另一套Git自动发布。平台上传错误传递，不盲目重试不确定发布。

范围分类读取已上线/__release.json确定main累计影响，未知基线完整验证。线上验收fetch每请求10秒超时，最多6轮、轮间5秒，检查确切SHA及两种语言首页；失败保留证据，不清理。只有验收轮询重试，上传不自动重试。详细边界与实际状态见[交付](checks-and-release.md)。

## 新增服务时需要说明

用途、调用文件、方法与地址、输入/返回、认证变量名、超时/重试/限流、失败时的反馈和对应测试。只列名字，不保存秘密值。作品的外链不等于平台集成。

站内导航和提前准备使用同站详情HTML GET，没有新增业务API。Astro公共`navigate`与`prefetch`接口分别处理导航和HTTP预取；搜索加载器按zh/en返回独立Pagefind实例，创建时核对当前文档语言，过时加载以AbortError终止。

文章图片可引用HTTPS外链，浏览器直接向图源请求；img-src允许HTTPS图片，主页面脚本、连接与字体仍同源，媒体文件及iframe按登记来源。第三方图源中断不阻止其余正文阅读，维护者应提供替代文字与尺寸；详见[Markdown排版](markdown.md)。

MDX组件在文章内部按client指令启动，同页共享React模块，从本站加载；没有新增业务接口。构建只执行受信仓库组件，不读取远程MDX。需要后台的组件不能仅靠复制源码接入，须明确新的接口与权限。

## 作品媒体

媒体和平台登记见src/config/media.ts及[媒体规则](rules.md#媒体加载与体积)。浏览器只在点击后创建YouTube、Spotify、B站或已核对原站的iframe；媒体下载、账号和地区限制由平台决定，无平台API密钥。音视频文件只从同源或指定来源加载，图表数据经有界GET读取；完整来源不提前挂到元素。2048点击后仅读取`/media/2048/game-bundled.txt`，发布模板内含固定游戏样式与脚本，不再从沙盒请求子资源；仍以不允许同源访问的sandbox运行，不访问父页面或持久存储。旧`game.txt`保留给已打开页面；初始化未成功会给出完整刷新入口。精确脚本授权及体积限制见[运行配置](configuration.md)。

## Paseo宿主契约

`src/features/paseo-webui/contract.ts`定义版本1的直接模块挂载接口及严格数据校验；当前尚未接入Explore入口。挂载类型要求同一容器返回同一实例，真正退出后需整页重载才能重新挂载；收起和普通导航不调用退出。具体生命周期实现及其验收由012接入任务完成，接口定义不等于运行行为已通过。

宿主命令只有展示（可见、焦点、页面前台分别传递）、中英locale、公开作品草稿/取消和dispose；没有聊天、审批、停止或任意RPC。草稿只接受作品ID（100字符）、标题（240）、简述（2000）、规范链接和可空原作链接（各2048）；URL必须是无用户名、密码、查询或fragment的HTTPS地址。草稿来自公开发布元数据，不能从当前配对URL或聊天状态提取；自由文本长度校验无法识别所有秘密，调用方仍须保证来源公开，资料不自动发送。

助手事件仅有首次可操作、请求收起、初始化/可操作/已退出状态及固定错误码（资源、初始化、致命）和是否可重试；不接收原始异常、工具内容或连接凭据。未知类型/版本/字段、继承字段及访问器均拒绝；成功校验返回新对象。直接模块模式没有postMessage桥，未引入source/origin消息校验分支。单元测试位于`tests/unit/paseo-webui-contract.test.ts`。
