---
tense: 'frozen'
describes: 'PR交付工作台技术计划'
status: 'complete'
amended-by: []
---

# PR交付工作台技术计划

## 技术决定与职责

沿用现有Astro、TypeScript、Wrangler与GitHub Actions，无新增依赖。保留单一维护PR，纳入003尚未合并的必要文档整理。

.github/workflows/check.yml仅监听PR及main推送，显式处理ready_for_review；Draft运行check但不运行浏览器和budget构建，Ready按整个PR范围检查；main按影响验收并以同一工作流needs依赖进入部署，避免workflow_run执行不可信代码。阶段预览使用本机独立手动命令，记录PR head SHA，部署前复核未变化。预览采用版本上传，不提升正式版本；正式部署只接受main当前提交。工作流并发取消检查，正式发布串行且不取消进行中的部署。

scripts/release*.ts拆分本地预览/正式交付守卫、Cloudflare调用和版本证据。发布记录带SHA、目标、Cloudflare版本和线上验证结果；失败不清理。生产源站固定https://vibes.college，配置wrangler.jsonc管理明确正式域名，不更改其他域。

治理历史迁移至docs/DECISIONS.md；docs/LESSONS.md为living经验清单。冻结保护显式识别唯一历史迁移并核对原正文，之后DECISIONS只追加；旧规格正文不改。新增经验格式校验，避免超过30条或已转化缺少证据。PR模板和Spec模板加入任务进度、经验复核和上线收尾要求。

清理通过可审计脚本及本地AI收尾执行，核对GitHub已合并、部署成功、源码已整合、工作区干净及无其他占用；拒绝清理当前工作目录或未知资源。脚本默认只报告候选，AI确认条件后执行；用户已授权符合条件的清理，不逐项再问。

## 宪章检查与预算

用户已确认整体方案与正式域名，覆盖旧测试域名限制；合并依然由用户决定。部署凭据仅存GitHub secrets，配置缺值由AI处理或给用户具体操作步骤。保留回滚版本，不新增套餐、依赖、产品功能。需同步全部受影响的源码对应说明与规则。

## 验证与交付

使用现有node:test覆盖触发决策、Draft/Ready门槛、过时SHA、发布失败与清理拒绝、经验格式与冻结迁移；运行npm run verify、npm run budget和git diff --check。本地验收与云端结果分别记录。用ego-browser确认PR清单、预览与正式站可见行为；main正式部署待用户合并后执行，不能提前勾选上线验收。
