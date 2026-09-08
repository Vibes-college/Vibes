---
tense: 'living'
describes: '待转化的失败经验'
status: 'current'
shaped-by: ['004']
---

# 失败经验（最多30条）

开始相关任务时读取；满足任一条件才记录：同类错误至少两次、导致回滚、耗时超过一小时、用户为同一问题抱怨两次。只记录可核实事实，不编造失败或原因。每条固定三行：日期与现象/证据、原因、转化计划/状态；同一原因合并，不写故事。

转化可直接落实到规则、模板/PR清单或自动检查，不要求逐级经过。已转化项必须链接措施与验证证据并记录日期；满30天且措施仍有效时由AI复核删除，历史由Git保留。超过30条先整理重复与到期项，不删除未解决教训凑数。原则的历史原因见[决策历史](DECISIONS.md)。

## 待转化

暂无满足记录条件且尚未转化的条目。

## 已转化

- [2026-09-08] 现象：原生助手手机历史页多次保留连接前错误，运行时已经在线｜证据：resources/evidence/012-paseo-webui-loading/host/h-history-before-fix.log及h-history-after-fix.log
  原因：生产React编译器丢弃可变外部状态的版本依赖；普通单元测试未经过该编译器，不能发现此问题。
  转化：[确定性延迟恢复测试](../tests/paseo-recovery.spec.ts)覆盖真实生产导出，[窄范围编译边界](../third_party/paseo-webui/patches/h-reactive-history.patch)保留依赖｜验证：修正前失败，修正后三配置通过；升级移除边界前重跑同场景｜转化日期：2026-09-08｜状态：已转化

- [2026-09-06] 现象：连续导航返回搜索结果两次出现约123px滚动偏差｜证据：resources/evidence/005-continuous-navigation/verify-initial-failures.log及专项回归
  原因：异步结果短暂令页面变矮，换页后的scrollend可能先覆盖目标history滚动值，page-load才读取已太迟。
  转化：[explore.ts](../src/scripts/explore.ts)在before-preparation保存目标位置，结果恢复后再对齐｜验证：[navigation.spec.ts](../tests/navigation.spec.ts)覆盖，WebKit连续5次专项通过｜转化日期：2026-09-06｜状态：已转化

- [2026-09-06] 现象：完整E2E多次因本地Wrangler代理中途退出失败｜证据：resources/evidence/008-prose-markdown/verify-repeated-service-failure.log
  原因：代理报告Network connection lost；与上游workers-sdk#15317症状一致，不能据此确定全部内部根因。
  转化：[browser-test.ts](../tests/browser-test.ts)及[navigation.spec.ts](../tests/navigation.spec.ts)在普通页面和独立缓存profile关闭前等待有限资源完成，超时仍失败｜验证：008完整verify两轮111通过；后续封面回归补齐独立profile清理仍复现；改为单worker串行以降低并发压力，验证见006的cover-proximity证据目录｜转化日期：2026-09-06｜状态：已转化

- [2026-09-07] 现象：iOS 26 Safari反复报告正文回第一节或封面｜证据：resources/evidence/006-detail-reading/bounce-investigation/findings.md
  原因：旧实现同时使用CSS吸附与脚本滚动；模拟浏览器未完整复现真机回跳，不能把模拟通过当作真机修复确认。
  转化：[detail-paging.ts](../src/scripts/detail-paging.ts)改为独立页面状态，移除吸附及逐帧滚动｜验证：[explore.spec.ts](../tests/explore.spec.ts)覆盖切页后等待、视口变化及正文原生滚动；真机仍待复测｜转化日期：2026-09-07｜状态：已转化
