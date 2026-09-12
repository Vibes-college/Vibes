---
tense: 'living'
describes: '项目Agent规则与Skills的使用和维护'
status: 'current'
shaped-by: ['015']
code-sources: ['.specify/presets/vibes/']
code-revision: '26d102ea60016855ae1f42cd635059a2c9cc736b4c404e798810589a43e2584a'
---

# Agent规则维护

## 描述任务与选择执行方式

向Agent说明要完成的事即可。AGENTS按任务引导读取相关功能、宪章或交付说明；已读且未变化的材料不重复读。范围明确且已授权时，Agent完成实现、必要验证、文档与PR更新；遇到本任务引起的失败先修复，只有必要决定、权限或外部条件缺失时才等待。

独立问题每轮最多三个，依赖问题逐个问，回答不限制词数。要求“先给我方案”“写完规格等我看”时，该阶段就是当前终点；要求完整实施时，进入plan、tasks或看到辅助清单不再重复询问是否继续。用户合并PR、真实人工审阅和依赖授权等边界仍有效。

## Skills与阶段推进

现有10个`speckit-*`名称保留；输入`$speckit-plan`等命令使用当前阶段技能。各技能从项目命令源生成，按当前对话理解授权：单阶段请求交付后结束，完整请求在无阻塞时继续后续阶段。

- plan仅研究影响实现的未决技术问题；research与附加产物按必要性声明，不逐依赖调查或强制造文件。
- checklist仅审查需求质量，默认是辅助审阅。空复选框不等于阻塞，也不允许Agent代替审阅者勾选；明确人工门槛和当前实际阻塞仍暂停依赖步骤。
- converge对照需求引用和实际工作去重，已有未完成任务继续引用原编号；零新增任务不等于全部完成。
- 没有`.specify/extensions.yml`时直接跳过hook。配置存在才读取preset中的公共hook参考，按真实条件、授权和结果处理，不用打印命令代替执行。

完整实施与阶段审阅都在当前对话中使用Skills，阶段推进由该会话统一负责。不要启动`specify workflow run speckit`：原生引擎将各阶段派发为独立命令，只按退出码判断完成，不能可靠承接模型提出的必要问题，也会与Skills自主续行重复。上游workflow原件保留，可用`specify workflow resolve speckit`检查结构，但不是本项目支持的执行入口。

## 修改、重新生成与检查

1. 修改根目录AGENTS或宪章时同步相关说明；修改技能时编辑`.specify/presets/vibes/commands/speckit.<name>.md`，公共hook说明在`references/hooks.md`。声明及命令列表在`preset.yml`，已启用登记在`.specify/presets/.registry`。不直接编辑`.agents/skills/`生成文件。
2. `specify preset resolve speckit.plan`等命令显示当前来源；只调整文档模板则编辑`.specify/templates/overrides/`，模板不会替换Skill正文。
3. 先核对Git差异并保存有效工作，确认集成管理文件没有未归入项目源的人工修改，再用`specify integration upgrade codex --force`重新生成。Spec Kit 1.0.4把preset生成的Skills与原始安装摘要比较，普通upgrade会报10个已修改文件，故此处需要force；它只用于已核对、可重建的生成文件，有未知修改先保留并定位来源。`integration install`、`preset enable`不用于重建。
4. 检查生成文件的`metadata.source`为`preset:vibes`，逐项核对内容；重复生成应得到相同结果。升级Spec Kit版本时先在隔离目录验证preset生成、模板解析和执行边界，未知行为不要直接覆盖工作区。
5. 复核本文及相关说明后更新code-revision，再运行`npm run docs:check`与`npm run format:check`。纯规则改动的CI范围和混合改动升级条件见[检查与发布](checks-and-release.md)。必要时使用原生CLI验证生成和workflow结构，不能把文字检查当作实际执行证据。

以上命令由Agent执行，用户无需手写配置。项目预设、登记和生成Skills均随Git保存，新的checkout可直接使用已提交Skills；本机重新生成需要Spec Kit 1.0.4或经过上述验证的兼容版本。

## 恢复与限制

恢复项目规则时，依据已确认的Git版本同时恢复preset源、登记及生成Skills，再核对解析结果；不要只恢复一份生成文件。当前对话中的授权与用户暂停点按最新明确指令执行，不用修改共用workflow配置。

这些指令规定Agent的决策边界，不能保证模型每次都正确执行；验收需同时看实际工作和证据。完整CI与原生生成检查不会自动运行有副作用的workflow、模型或第三方hooks。当前行为的更新及有效验收见[规划开发与维护文档](../features/document-governance.md)。
