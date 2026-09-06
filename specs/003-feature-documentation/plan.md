---
tense: 'frozen'
describes: '功能文档归并和历史编号映射'
status: 'complete'
amended-by: []
---

# 实施计划

## 技术决定与职责

保留explore-browse、article-read、content-maintenance、project-commands、document-governance五个稳定文件名，重写标题与七个栏目。其余七篇在核对信息归属后合并移除，索引分访客与维护者两组。配置和完整命令留原技术/操作文档，不重复全文。

scripts/docs-index.ts解析当前功能文档可选legacy-feature-ids数组，旧编号只映射到一个真实当前文档；不可与当前编号冲突，不建立跳转链。历史规格feature-ids通过此映射查找现状，shaped-by检查和冻结保护保留。docs-policy.ts沿用目录白名单；不建立新的文档注册文件。

## 宪章检查与预算

用户已确认结构；无依赖、产品或部署变化。002仅追加amended-by，已冻结正文逐字保留。当前规则与模板同步解释操作路径粒度和旧编号追溯，篇幅提示不改变。

## 验证与交付

先覆盖合并/重命名映射与缺失、重复、无效编号失败，再运行npm run check。核对所有文档链接和涉及的文件/测试名称；将旧网页验收作为历史证据，不新勾选未执行项。复用当前维护分支，不单独创建PR。

## 现状说明与源码对应

PROJECT_ANALYSIS保留定位与总览，具体产品路径留features，数据/配置/接口/规则/检查发布集中system。删除重复ARCHITECTURE入口及用户指定旧文件，修正静态资源与动态API、搜索清空动作、关联数据可见性等错误。历史spec正文不重写。

scripts/docs-sources.ts把code-sources精确文件或目录映射到Git管理范围的实现文件，以路径和内容字节计算SHA256；docs:check比对code-revision并检查所有实现文件有对应说明。内容正文和作品数据不参与架构摘要，数量通过内容命令读取。只读--revisions输出候选摘要，维护者核对实际说明后再记录，不能作为自动文案审阅。

新增complete状态表示实现完成，保留merged兼容；main中的complete同样冻结，状态不依赖合并后再次改文档。测试使用Node内置测试与临时Git基线，不新增依赖。
