---
tense: 'living'
describes: '第三方 API 与服务集成'
status: 'current'
shaped-by: ['001']
---

# 第三方 API 与服务集成

## 网站运行时

**当前没有第三方业务 API 调用。** 目录和文章在构建时生成，搜索按意图加载同站Pagefind全文索引；不存在登录、支付、邮件或 AI API 接口。旧项目清单中的 Google、Stripe、Creem 等不代表新项目已经接入。

`src/content/works/` 中的来源 URL 和文章 Markdown 中的外部链接是供访客点击的链接，不是代码后台调用。`src/components/WorkDetail.astro` 使用新标签页及 `noopener noreferrer` 打开原始作品。页面不保证外部网站永远可用。

## 以后新增服务时必须补充

每个服务记录：用途、实际调用文件、请求方法与路径、输入/返回结构、认证变量名字、超时/重试/限流方式、失败时用户看到什么、对应测试。只记录变量名；密钥值由你保存在本地私密文件或线上后台。

## Pagefind构建工具

Pagefind 1.5.2为已授权开发依赖，安装于package.json/package-lock.json；使用本机对应平台CLI，不是远端搜索API。不需要API密钥或用户数据上报。scripts/build.ts在Astro后按[data-pagefind-body]生成索引；全部草稿或空目录不调用Pagefind并移除旧索引，防止导航回退索引，src/scripts/search.ts通过动态模块加载、search及结果data接口查询同语言发布内容；无需第三方服务。首页不预下载；15秒超时显示失败，索引/分片重试重建实例，程序下载失败保留q刷新。中英搜索、错误重试和5000×2隔离验收均已通过。文档：[搜索API](https://pagefind.app/docs/api/)、[多语言](https://pagefind.app/docs/multilingual/)。

## 发布时的平台工具

scripts/release.ts调用`gh api`以GET读取`repos/Vibes-college/Vibes/commits/{sha}/check-runs`，输入为当前40位SHA，要求verify和budget完成且成功；沿用gh现有认证，不读取或暴露token。查询失败阻断发布，不绕过限流。

同一脚本调用现有Wrangler的deploy、versions view和rollback，目标账户/Worker/origin固定在scripts/release-policy.ts；上传验证后的dist，保存平台返回版本ID。沿用本机OAuth或CLOUDFLARE_API_TOKEN，不迁移旧业务密钥。Wrangler错误传递给调用者，不自动重试不确定的发布；版本ID未能解析时保留日志并要求核对，避免盲目再次发布。

没有GitHub自动部署凭据或新增业务API。独立测试站实际发布、修订及恢复已验收；命令、边界和原始证据位置见[CI](../operations/CI.md)。
