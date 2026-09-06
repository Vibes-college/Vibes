---
tense: 'frozen'
describes: 'Tasks: 多语言 Explore 内容基础'
status: 'in-progress'
amended-by: []
---

# Tasks: 多语言 Explore 内容基础

**Input**: 同目录spec.md、plan.md与research.md。

**状态**：已获继续实施授权；完成项按实际证据勾选。测试依据规格的验收场景和项目强制检查生成。新增路径是目标，不代表已有文件。每个任务连同相关功能文档一起完成，不把文档同步拖到最后。自行维护代码职责清楚，必要注释解释原因和约束，300行仅审阅提示。

## Phase 1: Setup

- [x] T001 在 `resources/evidence/001-multilingual-explore/multilingual-baseline.md` 记录当前 Git 基线、24件作品内容和 UI 截图、本地 verify/budget 结果；盘点既有 URL 查询参数与 PR 基线关系。
- [x] T002 核对 Pagefind 与当前 Astro/Node 兼容后，以已授权开发依赖加入 `package.json`、`package-lock.json`，在 `docs/technical/INTEGRATIONS.md` 记录版本与用途，不安装同类库。

## Phase 2: Foundational

先完成全部基础任务，再接入用户路径。

- [x] T003 在 `src/content.config.ts` 与 `src/lib/content/schema.ts` 定义作品、语言、事实和标签 schema，按plan.md数据约定 校验字段与文件身份。
- [x] T004 在 `src/lib/content/catalog.ts` 与 `src/lib/content/validate.ts` 实现集合读取、全局ID/排序/引用/别名校验及清晰错误定位，复用现有预览类型。
- [x] T005 在 `src/lib/i18n/routes.ts`、`src/lib/i18n/messages.ts` 定义 zh/en 路由、UI文案与同作品语言定位，不复制散落字符串。
- [x] T006 在 `scripts/migrate-content.ts` 将 `src/data/works.json` 与 `src/content/articles/` 迁移到 `src/content/works/{id}/`、`src/data/taxonomy.json`，保持24个ID、顺序、正文、预览、来源并生成差异报告 `resources/evidence/001-multilingual-explore/content-migration.md`。
- [x] T007 在 `tests/unit/content.test.ts` 和 `tests/unit/content-validation.test.ts` 覆盖迁移等价、重复ID、未知语言、无效来源、缺失原文、失效标签与别名冲突；失败阻断构建。

## Phase 3: US1 用熟悉的语言发现并理解 AI (P1)

**独立验收**：同一测试作品的已审核中英文详情可切换，缺失译文有原文入口；手机/桌面视觉保持，旧链接可用，分类和搜索覆盖整个语言目录。

- [x] T008 [P] [US1] 在 `tests/unit/i18n.test.ts` 先覆盖语言身份、未知语言、缺失/草稿译文、旧URL参数、0/1件作品的前后边界。
- [x] T009 [US1] 在 `src/pages/[locale]/index.astro`、`src/pages/[locale]/page/[page].astro`、`src/pages/[locale]/tags/[tagId]/[...page].astro` 实现每页24项的静态目录及分类分页，复用 `src/components/Explore.astro` 外观。
- [x] T010 [US1] 在 `src/pages/[locale]/works/[id].astro`、`src/components/WorkDetail.astro`、`src/scripts/detail.ts` 接入按语言内容、语言入口与同语言全目录前后切换，保留原有阅读交互。
- [x] T011 [US1] 在 `src/components/LanguageSwitch.astro`、`src/layouts/Layout.astro` 接入本地化UI、正确lang和缺失译文提示，提供同作品原文入口；用 `src/content/works/` 的明确审核样例验收，不自动发布全部AI译文。
- [x] T012 [US1] 在 `src/pages/index.astro`、`src/pages/explore/index.astro`、`src/pages/works/[slug].astro` 和构建重定向输出中兼容旧路径与筛选查询；未知路径返回404，避免生成伪语言内容。
- [x] T013 [US1] 在 `package.json` 的构建链加入 Pagefind，给 `src/components/WorkDetail.astro` 设置内容区、语言和分类元数据，排除导航、草稿及重复列表页。
- [x] T014 [US1] 在 `src/scripts/search.ts` 实现聚焦后加载、输入后查询、一次初始化、过期请求抑制和结果分批读取；首页不预加载模块或索引。
- [x] T015 [US1] 在 `src/scripts/explore.ts` 和 `src/components/Explore.astro` 替换全卡片DOM搜索，支持全文与分类交集、q/返回恢复、清空、加载、空结果、失败重试和安全文本输出。
- [x] T016 [US1] 在 `tests/explore.spec.ts` 验证中英文/缺失译文、旧路径、无JS分页、正文搜索、手机键盘与前后切换，以及聚焦前无Pagefind请求；同时更新 `docs/features/explore-browse.md`、`explore-filter.md`、`article-read.md`、`responsive-access.md`、`not-found.md`。

## Phase 4: US2 持续维护日更内容 (P1)

**独立验收**：新增原文、审核译文、更新原文、复核译文，观察发布状态与索引；无效关系阻断；5000×2合成目录首中末均可搜索打开，测试不覆盖真实内容。

- [x] T017 [P] [US2] 在 `tests/unit/content-revision.test.ts` 覆盖原文正文/可翻译字段/事实变更触发待复核，纯排序变更不触发，旧译文保留和复核清除状态。
- [x] T018 [P] [US2] 在 `tests/unit/content-relations.test.ts` 覆盖自关联、不存在目标、反向重复、同名不同ID、双向读取与可选事实排序/锚点/链接。
- [x] T019 [US2] 在 `src/lib/content/revision.ts` 与 `src/lib/content/catalog.ts` 实现稳定sourceRevision计算、draft/published规则和派生待复核状态，不引入自动发布翻译。
- [x] T020 [US2] 在 `src/lib/content/relations.ts` 和 `src/data/work-facts.ts` 接入单一关联及按作品排序的可选事实，使用稳定标签和语言目标；不生成合集或人物页。
- [x] T021 [US2] 在 `src/components/WorkDetail.astro` 显示待复核译文和可选事实，来源/筛选/锚点仅在有效时可导航，缺失译文事实明确回退。
- [x] T022 [US2] 在 `scripts/validate-content.ts` 与 `package.json` 接入构建前校验、修订摘要查询和内容维护命令；同步 `docs/operations/CLI.md`、`docs/features/content-maintenance.md`、`docs/technical/CONSTANTS.md`。
- [x] T023 [US2] 在 `scripts/measure-explore.ts` 生成隔离5000×2合成语料并输出构建耗时、文件数、首屏/搜索体积及首中末正文命中报告 `resources/evidence/001-multilingual-explore/explore-scale.md`，结束清理临时数据。
- [x] T024 [US2] 在 `scripts/search-performance.ts` 按plan固定网络/CPU条件测量5次冷/热查询及请求时机，在 `tests/explore.spec.ts` 补充内容生命周期和规模分页回归；记录达标情况，失败不降低目标掩盖。

## Phase 5: Delivery 与交叉验收

- [x] T025 在 `src/config/site.ts`、`astro.config.mjs`、`src/layouts/Layout.astro`、`src/pages/sitemap.xml.ts`、`src/pages/robots.txt.ts` 统一SITE_URL、canonical/hreflang与已发布语言清单，删除 `public/robots.txt` 重复源；同步 `docs/technical/CONFIG.md`、`docs/features/site-metadata.md`。
- [x] T026 在 `tests/unit/site-config.test.ts` 验证配置缺失/非法值阻断发布，站内语言URL与测试域名一致，搜索/草稿/缺失译文不进入sitemap。
- [x] T027 在 `scripts/budget.ts`、`scripts/budget-policy.ts` 与 `tests/unit/budget.test.ts` 保留首屏原预算，增加搜索资源独立报告并核对实际Cloudflare文件数量/大小上限；同步 `docs/technical/CONSTANTS.md`，不默默放宽预算。
- [x] T028 在 `scripts/release.ts`、`package.json` 和 `docs/operations/CI.md` 建立受控发布/恢复入口，核对同一SHA的verify/budget、目标账户与独立测试URL；自动化凭据未配置时使用已有本机OAuth，不合并main。
- [x] T029 在 `.github/workflows/check.yml` 验证PR的verify/budget持续执行，若接入手动部署则新增 `.github/workflows/deploy.yml` 并限制目标/检查提交；同步 `docs/technical/INTEGRATIONS.md`、`docs/features/delivery-setup.md` 和 `project-commands.md`。
- [x] T030 按 `plan.md` 的验证场景 跑本地check/verify/budget与CI检查，完成 `resources/evidence/001-multilingual-explore/cloudflare-release.md` 的独立站新增、修订及上一版本恢复实录，记录SHA/版本/URL/时间及可见页面证据，保持旧域名不变。
- [x] T031 在 `src/data/works.ts` 与旧内容路径清理迁移后重复源及失效引用，核对每个自行维护代码文件职责清晰，超过300行进行审阅、必要注释与所有相关 `docs/features/` 路径、测试名称和验收状态，重跑受影响检查。
- [x] T032 更新 `docs/features/<受影响功能>.md` 为合并后的最终行为，更新shaped-by；更新 `docs/features/README.md` 与 `specs/README.md` 状态；使用converge核对全部需求及真实验收，未同步不算完成。

本地阶段证据：resources/evidence/001-multilingual-explore/记录迁移等价、浏览器截图与英文样例审核范围；2026-09-05完整verify通过35单元测试与24项浏览器/构建生命周期测试，2项按设备去重跳过。发布门槛另有同SHA单元用例，远端执行/恢复和规模速度仍未验收，不提前勾选T029/T030/T032。

5000×2隔离测试：首中末正文搜索、详情、无JS第二页/末页、中文/英文24→48条结果均通过；限速条件下中英文冷中位数2358/2872ms，热192/196ms。Node静态gzip服务测真实产物，不是Cloudflare边缘实测；26676文件超出Free20000容量，未自动升级。详见本地explore-scale.md。

优化后5000×2构建41.7秒（先前210.4秒），通过避免事实链接判定重复生成全目录译文视图实现；最终速度与尺寸以本地explore-scale.md为准。当前样例站142文件，_astro业务JS gzip4901B、首页9035B、交互源码7303B，budget通过。

## Phase 6: Convergence

- [x] T033 完成同SHA GitHub verify/budget、独立Cloudflare测试站首次发布、真实内容修订和上一成功版本恢复；核对恢复后的页面/索引/canonical并在resources/evidence/001-multilingual-explore/cloudflare-release.md及PR记录SHA、版本、URL和时间，补齐T029/T030的未执行证据 per FR-007、SC-005（partial，HIGH）。

交付验收：同SHA云端verify/budget、本地35单元/26浏览器测试及budget通过；Cloudflare首次51c98e5→修订b7057a9→恢复首次版本，页面、SEO、索引入口逐字及搜索结果验证通过。最终现状文档已同步，待用户决定PR合并；未切换旧域名。

## Phase 7: Convergence

- [x] T034 在scripts/build.ts明确限制Pagefind的正文根选择器，并在scripts/content-lifecycle.ts覆盖全部草稿/零发布目录的实际构建，验证0作品索引且不收录导航；保留有正文时的元数据和双语搜索验收 per FR-005、plan: 搜索索引范围、spec: 0件边界（partial，MEDIUM）。

零发布补验：原实现会把5个导航/说明页收入索引（有效RED）；显式正文选择器及零发布不生成索引后，全部草稿和空目录真实构建通过。完整verify仍为35单元+26浏览器/构建测试，2项设备去重跳过；最新5000×2复测通过，尺寸/速度见explore-scale.md。
