---
tense: 'frozen'
describes: 'Agent规则适配与轻量检查实现计划'
status: 'in-progress'
amended-by: []
---

# 实现计划

## 技术决定与职责

使用Spec Kit 1.0.4原生项目preset保存10个命令源，由其注册机制生成现有Skills；上游原件保留。公共hook说明仅在扩展配置存在时读取。项目workflow overlay移除完整实施流程中的固定审批；用户要求阶段审阅时使用单阶段Skill，按约定交付并等待，不调用完整自动workflow。依据见research。

AGENTS保留执行边界并按任务路由；宪章维护授权与完成条件，交付文档维护PR流程，模板引用唯一流程。文档同步、有效证据、合并决定、远端保护与网站发布检查继续有效。

CI只为已知Agent指导Markdown、preset声明和workflow配置增加docs路径；混入脚本、网页、依赖和GitHub工作流仍完整检查。Draft对docs只检查文档与格式，其余仍基础检查；保留verify/budget保护状态，不使用跳过CI标记。

## 宪章检查与预算

用户已明确授权全部修正并要求减少纯规则CI。无npm依赖或网站功能变更，冻结spec仅追加修订关系。研究不逐技术泛查，不另建数据模型或quickstart。

## 验证与交付

- 对照FR-001至FR-012核对实际生成Skills与当前规则；原生preset再注册应生成相同内容，workflow解析后无固定gate；明确阶段审阅仍遵循用户约定。
- 用现有node:test验证纯规则、混合网站/脚本、未知路径和CI自身变更的分类边界；隔离原生CLI夹具验证生成与workflow，不运行模型。
- 本PR修改CI分类与GitHub工作流，按现行规则完整verify与budget；独立审查最终SHA后转Ready，用户决定合并。
- 同批文档说明调用、更新、重新生成与恢复方法；据实保存证据，语义核对后更新摘要。

## 相关经验

docs/LESSONS.md中的浏览器串行、有限资源等待和真机证据限制继续保留。交付流程见docs/system/checks-and-release.md，阶段证据写PR。
