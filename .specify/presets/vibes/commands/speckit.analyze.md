---
description: '只读检查已有spec、plan与tasks的矛盾、遗漏和任务覆盖，输出具体修正建议。'
---

# analyze

用户输入：`$ARGUMENTS`。结合当前对话理解请求，遵循AGENTS的任务路由与授权边界。

仅当`.specify/extensions.yml`存在时读取`.specify/presets/vibes/references/hooks.md`，在本阶段执行前后处理`before_analyze`与`after_analyze`；未配置时静默跳过。

1. 运行`.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks`。文件缺失时说明缺哪一项；已授权完整流程且可补齐时返回对应阶段，不要求用户重复发命令。
2. 按需读取spec需求与验收、plan决定和tasks映射，核对当前项目约束。只报告有影响且能定位的问题：范围冲突、无法验证的需求、遗漏任务、无依据扩展和错误依赖。
3. 每项说明位置、触发条件、影响和最小修正方向，按实际严重程度排序。不为凑数量制造问题，不把纯风格建议当阻塞。
4. 本分析过程只读，不修改任何文件；直接给出具体修改建议，不先询问是否需要建议。用户仅要求审查时交付结束；已有明确修复授权时，可在分析结束后继续授权范围内的修正步骤，无需再问。

完成标准：必要问题有明确处理方式，未覆盖范围据实报告。阻塞项修复并复核后才能继续依赖实施；非阻塞建议不自动扩为任务。
