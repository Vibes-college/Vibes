---
description: '为新功能或重要变更创建、更新尚未冻结的需求规格；小修复不自动启动。'
---

# specify

用户输入：`$ARGUMENTS`。结合当前对话理解请求，遵循AGENTS的任务路由与授权边界。

仅当`.specify/extensions.yml`存在时读取`.specify/presets/vibes/references/hooks.md`，在本阶段执行前后处理`before_specify`与`after_specify`；未配置时静默跳过。

1. 从用户输入与已有上下文确认目标和边界，已明确的内容不重复问。复用当前需求的未冻结spec、分支和PR；只有新需求才按specs索引分配未使用编号，并按AGENTS创建codex/分支。
2. 用`.specify/scripts/bash/resolve-template.sh spec-template --json`取得项目模板。新建时写入`specs/NNN-name/spec.md`；更新时保留已有有效内容，不覆盖冻结正文。将当前目录写入被忽略的`.specify/feature.json`的`feature_directory`。
3. 描述用户路径、范围、稳定FR/SC编号与可观察验收。只对无法合理推断且影响结果的未决事项提问，每轮最多3个；其余合理假设据实记录。不要把示例、技术最佳实践或建议自动扩为需求。
4. 用`.specify/scripts/bash/resolve-template.sh checklist-template --json`读取项目模板，维护内置`checklists/requirements.md`，按实际需求质量记录证据；缺口能在授权范围内解决时直接修正。未完成项不伪装已通过，不因格式示例反复新增清单。
5. 更新specs索引与必要修订关系。首版spec形成即创建或更新Draft PR，交付可打开链接；详细流程见docs/system/checks-and-release.md。

完成标准：spec准确覆盖用户需求，剩余决定已明确记录，当前需求可定位。已获完整实施授权且无阻塞时继续plan；仅请求规格或用户约定审阅点时交付后等待。
