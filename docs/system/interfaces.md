---
tense: 'living'
describes: '接口与外部服务'
status: 'current'
shaped-by: ['001', '003']
code-sources:
  [
    'src/scripts/search.ts',
    'src/scripts/explore.ts',
    'src/pages/robots.txt.ts',
    'src/pages/sitemap.xml.ts',
    'scripts/release.ts',
    'scripts/release-policy.ts',
    'src/components/WorkDetail.astro',
  ]
code-revision: 'c1e28a7ec5122d50dcf9dd9099ed42eb5c39d74130c8218949b1414d9804ad97'
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

## 2 构建生成的两个静态资源地址

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

## 3 浏览器内部的搜索接口（不是本项目的 HTTP API）

搜索不请求项目后端，而是读取构建时生成的同站 Pagefind 静态索引。

- 输入：搜索字符串，以及可选的 `tag` 类型筛选。
- `q` 在写入网址前最多保留 160 个字符。
- 内部调用形式：`search(query, { filters: { tag } })`；没有标签时不传筛选项。
- 返回：Pagefind 结果数组。每个结果有 `id`，并可异步读取 `url` 和 `meta`。
- `meta` 中会包含作品 ID、类型、标题、摘要、预览图信息等。
- 前端会检查结果必须属于本站、当前语言和合法作品 ID，并转义文本后才生成卡片。
- Pagefind 加载或分片失败时，页面显示错误并允许重试；单次操作超过约 15 秒会被视为失败。

实现：`src/scripts/search.ts`、`src/scripts/explore.ts`。Pagefind 的 `init`、`destroy` 和 `search` 是依赖库的浏览器接口，不是 VIBES 对外承诺的 API。

## 4 维护和发布命令接口

这部分是给维护者用的命令行入口，不是访客 API：

- `npm run content:validate`：检查内容文件和发布关系，不写入文件。
- `npm run content:revision -- <id>`：输出某作品的原文摘要、语言状态和译文是否待复核。
- `npm run db:reset`、`npm run db:migrate`：只操作本地测试 D1。
- `npm run build`：检查内容、生成静态网站和 Pagefind 索引。
- `npm run verify`：类型、格式、文档、单元测试、本地数据库和浏览器验收。
- `npm run deploy`：检查当前提交后发布到受控独立测试站；不是自动部署，也不接收任意线上地址。

发布脚本还会调用 GitHub CLI 的 `gh api` 读取当前提交的检查结果，以及 Wrangler 的 `deploy`、`versions view`、`rollback`。这些是维护工具对外部平台的调用，不是网站访客可以调用的接口。

## 外部平台与认证

scripts/release.ts调用`gh api`以GET读取`repos/Vibes-college/Vibes/commits/{sha}/check-runs`，输入为当前40位SHA，要求verify和budget完成且成功；沿用gh现有认证，不读取或暴露token。查询失败阻断发布，不绕过限流。

同一脚本调用现有Wrangler的deploy、versions view和rollback，目标账户/Worker/origin固定在scripts/release-policy.ts；上传验证后的dist，保存平台返回版本ID。沿用本机OAuth或CLOUDFLARE_API_TOKEN，不迁移旧业务密钥。Wrangler错误传递给调用者，不自动重试不确定的发布；版本ID未能解析时保留日志并要求核对，避免盲目再次发布。

没有GitHub自动部署凭据或新增业务API。独立测试站实际发布、修订及恢复已验收；命令、边界和原始证据位置见[CI](../system/checks-and-release.md)。

## 新增服务时需要说明

用途、调用文件、方法与地址、输入/返回、认证变量名、超时/重试/限流、失败时的反馈和对应测试。只列名字，不保存秘密值。作品的外链不等于平台集成。
