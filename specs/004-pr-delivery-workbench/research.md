---
tense: 'frozen'
describes: '触发、正式域名与历史迁移的依据'
status: 'complete'
amended-by: []
---

# 交付流程技术取舍

## 检查与发布

决定：GitHub只运行PR和main事件，Draft使用独立check，Ready按整个差异检查；main必要检查成功后复用budget产物部署，部署job串行且上传前核对main SHA。阶段预览在本机完整验收后versions upload，不额外消耗GitHub浏览器CI。

理由：原工作流同时监听所有push和PR，且并发组包含事件名，产生重复运行。Draft不会自动禁止CI，必须显式区分；ready_for_review不是默认触发事件。Cloudflare Git自动构建若与GitHub同时启用，会重复构建并可能早于验收上线，因此选单一发布入口。替代方案：全部push完整CI、Cloudflare所有分支自动构建，均因额度及发布顺序未采用。

依据：[GitHub事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)、[权限](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)、[Cloudflare预览](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/)、[版本上传](https://developers.cloudflare.com/workers/versions-and-deployments/)。2026-09-06官方资料与现有Wrangler4.129.0代码核对。

## 正式域名与回滚

2026-09-06通过Cloudflare界面核对：vibes.college的DNS唯一记录是Worker vibecoding-college，普通Workers路由为空。用户已授权正式切换。决定wrangler.jsonc唯一custom_domain为vibes.college，首次部署切给vibes-explore；保留旧Worker作为首次切换恢复入口。现有Wrangler非交互deploy会覆盖该域名原Worker绑定，因此必须保持域名配置唯一且先确认目标。其他域不动。

后续生产版本保存发布前信息与已验证版本记录；恢复仅接受固定目标的记录，不能把旧独立测试站版本直接当正式版本。部署成功但线上检查失败保留证据并停止清理，不盲目再次上传。

依据：[Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)及本机Wrangler publishCustomDomains实现。凭据由AI配置最小必要权限，值不记入本文件。

## 决策历史与经验

决定原docs/LESSONS.md全文迁入DECISIONS且旧条目只追加保护保留；新的LESSONS采用living三行记录、30条上限。检查器仅对这一明确历史迁移进行原正文核对，不泛化允许冻结文件任意重命名。理由：历史决定不能按失败经验30天淘汰；经验可以转化和清退，职责不同。替代方案为混用同一文件，仍会冲突且误导读者，未采用。
