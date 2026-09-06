---
tense: 'living'
describes: 'Spec Kit开发工作流'
status: 'current'
shaped-by: ['002']
---

# Spec Kit开发工作流

## 当前行为

Spec Kit1.0.4提供Codex技能；AGENTS先读宪章，再读功能索引。新功能和跨模块改造通过specify/clarify明确，plan需用户确认，tasks执行，analyze检查一致性，implement实现，converge核对缺口和现状同步。

项目使用.specify/templates/overrides裁剪模板，上游原件保留。research仅在技术未知或重要取舍需要解释时生成；data-model/contracts/quickstart默认不生成，由Agent在spec列明必要性与用途。规格以完整决策和清楚边界为准，开发中可改，合并后冻结。

交付时同步功能最终行为及shaped-by、功能索引和spec索引；未完成则不能宣称收敛。docs:check检查文档规则，不替代产品验收。开发中的tasks随Git保留，临时稿只在.scratch。

## 文件与依赖

.agents/skills/speckit-*/SKILL.md、.specify/templates/overrides、.specify/scripts/bash、.specify/feature.json、.specify/memory/constitution.md。依赖Python3.11+、uv和Agent；工具不是网站运行依赖。

## 验收标准与测试

specify version和integration list可识别Codex；模板解析器能读取覆盖模板；check-prerequisites定位当前spec/plan/tasks。npm run docs:check校验标签、索引和冻结规则，tests/unit/docs-*.test.ts覆盖失败边界。完整实现/部署流程须另行真实验收。

## 限制

技能生成不表示每个命令已跑完；上游技能要求与本项目宪章冲突时遵从用户确认的文档纪律。没有自动合并、自动发布或自动审核译文。

小修复或文档修正可直接执行与验证，不强制新规格或全部阶段；已有未冻结规格覆盖的调整在原稿完善。
