---
description: '用户明确要求时，将当前tasks转为本仓库GitHub issues，并避免重复创建。'
---

# taskstoissues

用户输入：`$ARGUMENTS`。结合当前对话理解请求，遵循AGENTS的任务路由与授权边界。

仅当`.specify/extensions.yml`存在时读取`.specify/presets/vibes/references/hooks.md`，在本阶段执行前后处理`before_taskstoissues`与`after_taskstoissues`；未配置时静默跳过。

1. 运行`.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks`定位tasks，读取要转为issue的任务范围。
2. 核对当前Git仓库与remote。只有用户明确要求创建issues时才写GitHub；只读规划、审查或存在tasks本身不是发布授权。
3. 确认目标是用户指定且可访问的仓库。对照已有issues的规格路径与任务编号，复用已存在的对应项，不因再次运行重复创建。
4. 按已确认任务生成可执行的标题、说明、依赖和验收引用，不把每个内部子步骤都扩为独立issue，不添加无依据的新功能。关联仅指向已验证的本仓库对象。

完成标准：报告实际创建或复用的issue链接与任务对应，失败和未创建项据实说明。
