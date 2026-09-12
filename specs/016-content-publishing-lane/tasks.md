---
tense: 'frozen'
describes: '内容发布通道执行清单'
status: 'in-progress'
amended-by: []
---

# 内容发布任务

- [ ] T001 [US1] 在scripts/content-policy.ts和tests/unit/content-policy.test.ts建立受限MDX边界，scripts/check-scope.ts及分类测试接入content，覆盖FR-001。
- [ ] T002 [US1] 在.github/workflows/check.yml接入可信Paseo缓存及缺失回退、内容检查与同SHA生产发布，覆盖FR-002、FR-003、FR-005。
- [ ] T003 [US1] 在playwright.content.config.ts和tests/content-publish.spec.ts实现正文、内部资源、窄屏冒烟；scripts/release.ts按scope预览，覆盖FR-002、FR-004。
- [ ] T004 [US2] src/components/WorkDetail.astro提供语言对应GitHub编辑入口，docs/system/content-contributions.md说明GitHub完整贡献与失败路径，覆盖FR-004、FR-006。
- [ ] T005 同步宪章、AGENTS、docs/features与docs/system受影响说明及源码对应；运行check、verify、budget，完成独立Agent最终SHA审查，覆盖SC-001至SC-004、SC-006。
- [ ] T006 准备AI原生UI指南的独立内容发布验收：保存正文分支、内容分类与本地验收方法、计时和线上核验步骤，覆盖SC-002、SC-005的执行准备。生产验收只能在流程进入main后执行，作为PR收尾必需项记录实际结果，不由实现清单勾选代替。

交付遵循docs/system/checks-and-release.md；检查/上线事实保留在PR和resources/evidence，不把待测写成已通过。
