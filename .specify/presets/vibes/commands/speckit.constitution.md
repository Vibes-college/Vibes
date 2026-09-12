---
description: '按明确的规则变更更新项目宪章，保留现有结构、有效原则与必要同步。'
---

# constitution

用户输入：`$ARGUMENTS`。结合当前对话理解请求，遵循AGENTS的任务路由与授权边界。

仅当`.specify/extensions.yml`存在时读取`.specify/presets/vibes/references/hooks.md`，在本阶段执行前后处理`before_constitution`与`after_constitution`；未配置时静默跳过。

1. 读取用户要求与宪章相关段落。已有宪章时以现行结构为基础，只改本次规则及必要一致性内容；新项目无宪章时才用`.specify/scripts/bash/resolve-template.sh constitution-template --json`生成初稿。
2. 先判断规则适用范围、收益与冲突；已有明确授权则执行，只有关键决定缺失才问。不要仅为更强措辞把所有建议改成无条件MUST，明确授权与完成条件，保留用户指定的审批边界。
3. 根据项目版本规则更新版本及真实日期，保留front matter与历史追溯。长期现状不写变更流水账；修改理由和同步摘要放PR或当前规格，不在宪章顶端追加Sync Impact Report。
4. 重大规则修订按项目要求记录DECISIONS，更新受影响的现状说明、模板或检查；已冻结spec仅更新允许的修订关系，不修改旧正文。
5. 按影响完成文档或工具检查，不为纯规则措辞改动触发网页验证。仅改用户授权的规则，不重新组织整套治理结构。

完成标准：当前原则无矛盾，执行入口与相关说明一致；报告修改、验证及真实限制。
