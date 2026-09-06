---
tense: 'living'
describes: '仓库地图'
status: 'current'
shaped-by: ['002']
---

# 仓库地图

| 板块     | 位置                                 | 用途                                |
| -------- | ------------------------------------ | ----------------------------------- |
| 实现     | src/、public/、db/、scripts/、tests/ | 网站、产品内容、素材、工具与测试    |
| 协作     | AGENTS.md、.agents/、.specify/       | Agent入口、宪章、固定版本技能与模板 |
| 当前系统 | docs/                                | 功能现状、配置和操作说明            |
| 变更记录 | specs/                               | 编号规格、计划与任务；合并后冻结    |

## 当前系统说明

- [产品定位](PRODUCT_OVERVIEW.md)、[架构](ARCHITECTURE.md)。
- [功能索引](features/README.md)：当前行为、入口、验收标准、自动测试及shaped-by。
- technical/：[配置](technical/CONFIG.md)、[数据库](technical/DATABASE.md)、[规则](technical/CONSTANTS.md)、[集成](technical/INTEGRATIONS.md)。
- operations/：[命令](operations/CLI.md)、[CI与发布](operations/CI.md)、[资产名称](operations/SECRETS_CHECKLIST.md)。
- design-assets/：用户设计参考图片；[LESSONS](LESSONS.md)：不可改写的原则决策条目。

## 实现文件

src/pages是网址，components/layouts是页面零件与外框，styles/scripts是样式与交互，data是作品数据，content/articles是访客阅读的正文。产品文章使用自己的内容字段，不是治理文档。

public保存静态文件，scripts提供检查工具，tests验证行为，db仅保存本地测试库结构与样例。没有必要再套一层code目录改变导入和工具路径。

## 工具配置与生成数据

package.json/lock管理命令和依赖；astro、tsconfig、eslint、prettier、playwright、wrangler配置分别管理构建、类型、代码格式、测试和部署。.github是CI，.git是版本历史，.openai是Sites绑定，.dev.vars.example是无秘密值示例，.gitignore控制提交范围。这些交由AI按功能维护，保留工具稳定路径。

node_modules、dist、.astro、.wrangler、test-results和playwright-report是安装/构建/运行结果，不手改。.DS_Store由macOS生成。清理运行数据前确认影响。

## 变更、参考与临时材料

[specs索引](../specs/README.md)指向当前任务；每目录默认spec/plan/tasks，research按需记录技术未知或重要取舍。额外数据模型/契约/验证指南由Agent在spec列明必要性与用途。规格目录不设总行数上限，保留必要需求与决定。

[resources](../resources/README.md)保存被忽略的外部快照和原始本地证据；另一台电脑不一定有这些文件。.scratch只保存不提交的临时材料。工作流水账放PR/git，根目录不堆研究报告。每份治理文档顶部标签标明是否为现状、是否冻结；规则由docs:check校验。
