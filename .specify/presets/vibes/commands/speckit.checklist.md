---
description: '审查当前spec的需求完整性、清晰度与一致性；不用于功能测试或发布验收清单。'
---

# checklist

用户输入：`$ARGUMENTS`。结合当前对话理解请求，遵循AGENTS的任务路由与授权边界。

仅当`.specify/extensions.yml`存在时读取`.specify/presets/vibes/references/hooks.md`，在本阶段执行前后处理`before_checklist`与`after_checklist`；未配置时静默跳过。

1. 运行`.specify/scripts/bash/check-prerequisites.sh --json --template checklist-template`取得FEATURE_DIR与TEMPLATE_CONTENT，按请求的主题读取必要需求段落。
2. 用户主题和用途明确时直接生成；缺少会实质改变清单的问题才询问，独立问题每轮最多3个，不要求固定轮数、深度问卷或回答词数。
3. 只审查需求是否完整、清楚、一致、可验证；不把点击操作、自动测试或发布步骤包装成需求质量检查。用户需要功能测试或发布验收时转到项目对应验证路径，不调用本技能制造另一份清单。
4. 在未冻结规格的`checklists/<topic>.md`使用项目模板生成稳定CHK编号，并写清用途和适用阶段。默认是辅助审阅，只有用户或项目明确指定时才成为人工门槛。
5. 与文件内已有条目按需求引用及实际含义去重，只追加未覆盖项；保留已有条目与审阅者勾选状态。所有新增条目留空，`[x]`表示审阅者确认需求质量，不表示代码完成。不得为通过implement而代勾。

完成标准：清单贴合请求且没有重复条目，交付路径、适用范围和新增项数量；不自动开始实现或把空复选框变成审批要求。
