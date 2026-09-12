---
tense: 'frozen'
describes: 'PR模拟合并验收复用与准备去重依据'
status: 'in-progress'
amended-by: []
---

# 验收复用研究

## R1：证明内容一致而非假定PR绿灯足够

决定：完整Ready PR写入实际checkout SHA和完整Git tree的验收记录，main对照相同tree、最新可信运行与attempt、完整覆盖和同仓库合并关系。

理由：GitHub默认pull_request checkout为模拟合并提交；run的head_sha不能直接当实际checkout。模拟合并和最终merge/squash提交号可以不同，但文件树完全相同仍是同一套代码。最终tree还覆盖CI、锁文件、测试与补丁；内容或规则变化自动完整回退。

替代：无条件删除main回归不能覆盖直接push/基线变化；只查历史success会掩盖新失败；仅比较业务源码会漏掉验收规则变化。无需将PR生产dist直接提升或搬运node_modules。

来源：[GitHub事件与模拟合并](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)。

## R2：运行与证据来源边界

决定：用当前main SHA查关联PR并核对merge_commit_sha；指定workflow和head查询最新PR运行，随后检查完成成功状态。读取当前run_attempt的jobs，要求唯一verify/budget成功；精确匹配唯一未过期artifact及其run/attempt/repository/head身份。缺失、歧义、分页上限、过期、错误或不支持状态均回退，不从旧绿灯拼接证明。

理由：同一run重跑会保留旧artifact，仅名称不能证明当前attempt；fork运行于主仓库也不代表head可信。实际读取PR12合并后的run 34684292725，pull_requests数组为空但head_sha及run_attempt仍保留；因此先按head选择最新运行，再通过小记录绑定PR身份，不能要求合并后API仍返回非空关联。记录为小型JSON，仅解析数据并通过Git提交接口复核tree，不执行记录路径/命令。

来源：[workflow runs](https://docs.github.com/en/rest/actions/workflow-runs)、[attempt jobs](https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run-attempt)、[artifacts](https://docs.github.com/en/rest/actions/artifacts)、[提交关联PR](https://docs.github.com/en/rest/commits/commits#list-pull-requests-associated-with-a-commit)。研究Agent只读复核了上述边界。

## R3：一次准备，不跨job搬运行时

决定：paseo:ci、完整verify与budget共用同一runner；预算保留同名轻量结果gate。main快速路径重新生成Paseo与正式dist，省去已复用的原生测试及完整E2E。

理由：当前verify/budget各执行一次paseo:ci，后者包括安装、server准备、Web构建、原生测试和类型检查。串行追加budget构建的成本小于额外建立共享大artifact的下载和维护成本；省算力不等于墙钟减半，实际耗时据运行记录报告。

替代：prepare artifact再分发需要携带fixture server及依赖，体积和信任边界更复杂；首版不采用跨job或跨PR依赖缓存方案。

## R4：保留生产检查并补齐当前smoke缺口

决定：main重新构建、预算、产物摘要和版本校验，deploy使用同次产物；线上核对双语页、CSP、Paseo关键脚本/样式及预览载体。预期字节和资源路径取自当前dist。

理由：现有smoke只核对SHA和双语页基本内容，不能发现Paseo资源返回错误内容或响应安全策略丢失。补齐部署边界可验证生产配置与资源，仍不把HTTP通过宣称为完整真实Agent或真机验收。

证据查询期间可能发生人工重跑；下载记录和核对tree后，再次读取同head最新run，要求ID、attempt及成功状态与最初一致，变化或读取失败选择full。判定完成后的未来人为操作不属于可原子锁定的GitHub读取事务。
