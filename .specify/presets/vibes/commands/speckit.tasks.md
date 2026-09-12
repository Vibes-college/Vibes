---
description: '将已确认范围的spec与plan转为可执行且按依赖排序的任务；保留已有有效进度。'
---

# tasks

用户输入：`$ARGUMENTS`。结合当前对话理解请求，遵循AGENTS的任务路由与授权边界。

仅当`.specify/extensions.yml`存在时读取`.specify/presets/vibes/references/hooks.md`，在本阶段执行前后处理`before_tasks`与`after_tasks`；未配置时静默跳过。

1. 运行`.specify/scripts/bash/setup-tasks.sh --json`取得FEATURE_DIR、TASKS_TEMPLATE_CONTENT及可用文档。读取spec、plan与实际需要的附加产物；缺少不需要的research、data-model、contracts或quickstart不构成阻塞。
2. 使用项目tasks模板，按真实依赖和用户路径组织任务。每项用稳定T编号、明确动作与真实文件路径；只对可独立完成的工作标[P]，无需为每个故事强造并行示例或空的基础/润色阶段。
3. 按行为风险列必要测试及失败路径；测试义务来自需求和项目检查规则，不以用户是否说TDD为条件，也不为可逆低影响措辞改动编写测试。已有有效证据可以引用，交付完整检查仍按影响执行。
4. 更新已有未冻结tasks时保留稳定编号、有效完成状态和证据；按需求引用与实际工作去重。计划不支持的工作不新增；有实质需求变化时同步spec与plan。
5. 列必要文档与索引同步、实际检查和适用的独立审查，交付流程引用docs/system/checks-and-release.md，不复制多份PR进度。经验措施只在plan维护。

完成标准：全部需求都有适当任务，任务无额外功能，依赖与验收清楚。已有完整实施授权且无阻塞时继续implement；仅请求任务清单时交付结束。
