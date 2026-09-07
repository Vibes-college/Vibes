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

- [2026-09-06] 现象：连续导航返回搜索结果两次出现约123px滚动偏差｜证据：resources/evidence/005-continuous-navigation/verify-initial-failures.log及专项回归
  原因：异步结果短暂令页面变矮，换页后的scrollend可能先覆盖目标history滚动值，page-load才读取已太迟。
  转化：[explore.ts](../src/scripts/explore.ts)在before-preparation保存目标位置，结果恢复后再对齐｜验证：[navigation.spec.ts](../tests/navigation.spec.ts)覆盖，WebKit连续5次专项通过｜转化日期：2026-09-06｜状态：已转化

- [2026-09-06] 现象：完整E2E多次因本地Wrangler代理中途退出失败｜证据：resources/evidence/008-prose-markdown/verify-repeated-service-failure.log
  原因：代理报告Network connection lost；与上游workers-sdk#15317症状一致，不能据此确定全部内部根因。
  转化：[browser-test.ts](../tests/browser-test.ts)及[navigation.spec.ts](../tests/navigation.spec.ts)在普通页面和独立缓存profile关闭前等待有限资源完成，超时仍失败｜验证：008完整verify两轮111通过；后续封面回归发现独立profile未走公共fixture，补齐清理，验证见006的cover-proximity证据目录｜转化日期：2026-09-06｜状态：已转化
