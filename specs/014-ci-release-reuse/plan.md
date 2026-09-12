---
tense: 'frozen'
describes: '可信验收复用与生产检查设计'
status: 'in-progress'
amended-by: []
---

# 验收复用与生产检查实现计划

## 技术决定与职责

使用现有Node/TypeScript、GitHub Actions、GitHub CLI与Cloudflare，不新增npm依赖。流程由`.github/workflows/check.yml`组织，纯判定与GitHub读取分离。

1. 完整运行的verify job按顺序执行一次paseo:ci、verify和budget；成功后输出明确预算结果。保留名为budget的轻量必需检查，要求verify成功且预算明确通过或适用范围允许不适用；跳过、缺失和失败不能变成绿灯。重型产物不跨job传递。
2. 完整Ready PR末尾生成小型验收JSON，记录实际checkout SHA/tree、PR head/base、仓库和head仓库ID、PR号、run/attempt、规则schema与完整覆盖。artifact名称绑定run及attempt；不使用Draft或docs/tools记录证明完整覆盖。
3. main的scope阶段通过新的ci验收脚本读取当前合并关联PR及其最新对应workflow run。验证同仓库/main/merge SHA、run身份、最新attempt唯一成功的verify/budget、未过期且唯一的同attempt记录及实际checkout提交的tree。最终main tree必须完全相同；GitHub API、记录下载或内容解析异常均回退full并输出原因。
4. scripts/paseo-webui-build.ts新增仅可信main快速路径使用的生产准备入口；重建固定来源和补丁的Web产物，保留所有身份检查，省去已被复用的server测试准备、原生测试与类型复查。完整入口及本地verify语义不变。
5. main快速路径运行当前源码基础check、Paseo生产准备、网站budget构建和产物preflight；完整回退运行原有完整验收。scripts/release-artifact.ts继续绑定本次main SHA和内容摘要，deploy下载同一次运行的production artifact并复核。
6. scripts/release-smoke.ts及产物检查补齐双语页面、CSP、版本、Paseo脚本/样式的实际字节与HTML预览载体边界；预期来自已验证的本次dist，不接受外部任意资源或域名。HTTP smoke不替代用户交互验收。

证据只作为有大小限制的JSON读取，不执行任何PR文件或下载依赖。API需要contents/read、actions/read、pull-requests/read；Cloudflare secret仍只在deploy可用。旧main未产生新schema验收记录时完整回退。手动workflow_dispatch保留完整验收。

## 宪章检查与预算

用户授权改进CI等待，范围限发布基础设施；符合规格/分支/PR与用户决定合并规则。保留同次main生产gate成功、确切SHA产物、拒绝过时发布和上线后清理。必要时澄清宪章/入口的“完整验证”与“可信复用后生产检查”边界，历史004/013仅追加修订关系。完整tree包含工作流、依赖锁和补丁，不用部分目录摘要代替。文件按证明判定、API解析、产物/线上检查分责，300行只作审阅提示。

## 验证与交付

纯判定与本地Git/HTTP fixture测试覆盖同tree成功、不同tree、fork、旧/失败attempt、Draft、跳过、旧绿灯掩盖新失败、过期/伪造身份、API错误及直接push回退。生产smoke测试覆盖错误SHA、缺失/错误CSP、资源损坏/缺失和不安全路径。

基础设施变更按完整verify及budget验证；保留所有既有完整用例。记录现有main全量耗时作为基线，用真实CI的首次完整路径验证去重与receipt，快速路径使用可核对的判定测试及本地production artifact检查；实际合并后的首次快速发布由用户合并后验证，不提前宣称线上提速已完成。

## PR工作台与经验复核

Draft PR #13为唯一交付单位，spec编号014。按tasks推进并更新PR。Ready前由独立Agent审查最终差异与SHA，修复后复核；检查通过才通知用户合并。没有新UI，功能预览不适用。保留既有串行浏览器与连接释放经验，不用并行/重试改变测试标准。PR12收尾独立继续。
