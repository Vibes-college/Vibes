---
tense: 'frozen'
describes: '内容通道的技术决定'
status: 'in-progress'
amended-by: []
---

# 内容发布实现计划

## 技术决定与职责

scripts/check-scope.ts增加content范围，scripts/content-policy.ts借助现有锁定的MDX解析器检查AST：仅已批准默认导入、静态HTML与字面属性，拒绝任意表达式、export、事件和spread。Markdown及work.json由现有内容schema和编译器验证。未知文件混入即full。

.github/workflows/check.yml保留verify/budget名称。content执行check、一次生产构建与预算、预检和单Chromium内容冒烟；静态Paseo导出从仅main完整验收后保存的精确源码缓存恢复，消费仍逐文件核对摘要；未命中回退完整准备和回归。主站发布产物和线上核验沿用现有代码。

scripts/release.ts按内容分类运行同一检查组合，提供维护者按需PR阶段预览。fork不自动部署，不给其执行代码凭据，维护者审阅并移入仓库分支后再使用此入口。WorkDetail提供具体语言及扩展名的GitHub编辑链接，贡献操作集中在docs/system/content-contributions.md。

## 宪章与范围

修改当前检查规则和GitHub贡献边界，保留站内只读。不增加依赖，MDX解析使用@astrojs/mdx已锁定的编译依赖。整站构建/Pagefind仍是线性成本，不承诺万篇规模已验证。基础设施PR做完整回归，后续纯内容独立发布证明精简路径。

## 验证与交付

分类和MDX边界单测覆盖不可信执行和混合变更；内容冒烟检验发布文章的标题、正文、内部静态资源与窄屏，并检查既有MDX交互。基础设施运行verify与budget及CI，独立Agent审查最终SHA。代码和docs同批，合并后核对，文章上线后报告真实耗时与省去的测试。

已知Wrangler本地长套件可能ProxyController断连；保留失败日志，先判断服务故障，不能删测试或把未跑完算通过。优先CI可信完整证据，不与用户预览服务争端口。交付遵循docs/system/checks-and-release.md。
