---
tense: 'living'
describes: '第三方 API 与服务集成'
status: 'current'
shaped-by: []
---

# 第三方 API 与服务集成

## 网站运行时

**当前没有第三方业务 API 调用。** 目录和文章在构建时生成，搜索只过滤已加载的卡片；不存在登录、支付、邮件或 AI API 接口。旧项目清单中的 Google、Stripe、Creem 等不代表新项目已经接入。

`src/data/works.json` 中的来源 URL 和文章 Markdown 中的外部链接是供访客点击的链接，不是代码后台调用。`src/components/WorkDetail.astro` 使用新标签页及 `noopener noreferrer` 打开原始作品。页面不保证外部网站永远可用。

## 以后新增服务时必须补充

每个服务记录：用途、实际调用文件、请求方法与路径、输入/返回结构、认证变量名字、超时/重试/限流方式、失败时用户看到什么、对应测试。只记录变量名；密钥值由你保存在本地私密文件或线上后台。
