---
tense: 'frozen'
describes: '技术未知与决策'
status: 'draft'
amended-by: []
---

# 技术未知与决策

## 内容规模与维护

未知：Git维护能否避免单个大JSON冲突且继续生成完整正文。决定每作品元数据+语言Markdown，Astro集合集中校验；理由是维护单件内容不需改全局数组。立即上CMS/线上D1增加首版不需要的编辑服务。依据：[Astro内容集合](https://docs.astro.build/en/guides/content-collections/)。

## 全文搜索与首页成本

未知：分页后如何检索未展示正文及中文。决定Pagefind构建索引并用JS API保留UI，聚焦后准备、输入后查询；理由是无需下载全量JSON或新搜索服务。DOM过滤不覆盖分页后内容，自写搜索引擎维护成本高。用户已批准开发依赖；分词和延迟需实际验证。依据：[多语言](https://pagefind.app/docs/multilingual/)、[API](https://pagefind.app/docs/api/)。

## 运行环境与未来业务

未知：参考仓库服务端栈能否直接搬到Cloudflare。决定本轮沿用Workers Static Assets，不照搬Node/EC2/PM2；公开内容可预生成，未来支付/报名/实时协作分开设计。Worker不是完整Node/Linux，全静态和全D1也不是永久限制。依据：[Worker Node边界](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)、[Astro按需渲染](https://docs.astro.build/en/guides/on-demand-rendering/)。

参考源码为本地resources/references/developer-roadmap-3d3d07c，提交3d3d07c5a7ed4a04627289bf7206716c8ab94ff6，仅源码核对；不能推断当前线上实现。详细本地调查位于resources/evidence/roadmap-3d3d07c-performance.md，不随Git同步。

## 翻译发布

决定原文先发布、译文审核后发布，旧译文遇原文更新继续可读并提示待复核。理由是用户明确选择保持可读且不误称最新；自动发布未审核译文与更新即下架均不采用。版本摘要派生状态，避免手工标志失真。
