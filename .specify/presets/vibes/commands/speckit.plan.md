---
description: '为已有规格制定实现计划；仅研究影响实现的未决问题，按需生成附加产物。'
---

# plan

用户输入：`$ARGUMENTS`。结合当前对话理解请求，遵循AGENTS的任务路由与授权边界。

仅当`.specify/extensions.yml`存在时读取`.specify/presets/vibes/references/hooks.md`，在本阶段执行前后处理`before_plan`与`after_plan`；未配置时静默跳过。

1. 运行`.specify/scripts/bash/setup-plan.sh --json`取得FEATURE_SPEC、IMPL_PLAN和SPECS_DIR。读取spec及本任务相关现状、代码和已有约束；不重复已读且未变化的材料。
2. 依项目plan-template说明真实技术决定、职责、文件路径、必要验证与交付。复用现有技术和工具，不为填写模板预建模块或补齐无关的技术层次。
3. 仅研究影响实现的未决技术问题或需要长期说明的重要取舍；有必要才在spec写research-trigger并生成research.md。没有这类问题时直接继续，不逐依赖、逐技术调查通用最佳实践，也不默认派发研究Agent。
4. data-model.md、contracts/*.md、quickstart.md默认不生成。确有用途才由Agent在spec的approved-artifacts及正文列明必要性；该字段不是审批，不逐文件询问。不需要research时，后续设计和实施不以它为前置条件。
5. 按实际风险和现有检查规则定义完成条件，相关失败经验只在plan记录适用措施一次。必要文档说明与代码同批交付。

完成标准：计划足以执行，真实未决事项有明确处理方式，无无用途产物。用户已授权完整实施且范围不变时继续tasks；仅请求规划或约定审阅点时交付后等待。
