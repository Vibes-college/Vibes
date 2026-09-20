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

- [2026-09-20] 现象：暂停录屏后二次转屏使Linux WebKit卡死，本机macOS完整回归未复现｜证据：resources/evidence/018-great-ui-scale/release-2026-09-19/linux-native-stack.log及Linux重复媒体用例
  原因：暂停Blob换源阻塞原生GStreamer管线；延后换源、调整回收顺序或直接赋src仍复现，偶然通过不能证明已修复。
  转化：[recording-seek.ts](../src/features/great-ui/recording-seek.ts)使用有界data副本，取消下载及转换并拒绝旧结果回写；[媒体回归](../tests/great-ui-previews.spec.ts)确认新尺寸和暂停后才继续播放，覆盖超限、503、取消与清理｜验证：修正后本机46项通过/2项设备跳过、Linux15项通过/1项跳过，实际代码Linux转屏另连续20项通过；完整CI凭据在PR维护｜转化日期：2026-09-20｜状态：已转化

- [2026-09-14] 现象：对未接入正式站的本地工作台启动整站回归，用户连续指出范围错误｜证据：018任务对话及resources/evidence/018-great-ui-scale/verify.log中的中止运行
  原因：将组件路径和CI的保守分类直接套成本地验证，未先核对实际构建、引用和发布边界。
  转化：[检查与发布](system/checks-and-release.md)及[执行入口](../AGENTS.md)要求独立本地入口只运行自身检查；[great-ui:verify](../package.json)提供独立命令｜验证：018本地16项单元、66项浏览器、独立预算通过｜转化日期：2026-09-14｜状态：已转化

- [2026-09-06] 现象：连续导航返回搜索结果两次出现约123px滚动偏差｜证据：resources/evidence/005-continuous-navigation/verify-initial-failures.log及专项回归
  原因：异步结果短暂令页面变矮，换页后的scrollend可能先覆盖目标history滚动值，page-load才读取已太迟。
  转化：[explore.ts](../src/scripts/explore.ts)在before-preparation保存目标位置，结果恢复后再对齐｜验证：[navigation.spec.ts](../tests/navigation.spec.ts)覆盖，WebKit连续5次专项通过｜转化日期：2026-09-06｜状态：已转化

- [2026-09-20] 现象：完整E2E自2026-09-06多次因本地Wrangler代理中途退出失败；Linux CI的空白错误缺少随runner销毁的内部日志｜证据：resources/evidence/008-prose-markdown/verify-repeated-service-failure.log及[018 CI追踪](https://github.com/Vibes-college/Vibes/actions/runs/35495637388)
  原因：代理报告Network connection lost；与上游workers-sdk#15317症状一致，不能据此确定全部内部根因。
  转化：[browser-test.ts](../tests/browser-test.ts)及[navigation.spec.ts](../tests/navigation.spec.ts)在普通页面和独立缓存profile关闭前等待有限资源完成，超时仍失败；[CI](../.github/workflows/check.yml)另保留完整回归的Wrangler失败日志以便诊断｜验证：008两轮111通过及006单worker证据仍有效；018的首次导航CSS 500后服务退出，原样Linux专项20次通过，未确认内部根因，不把排空或串行视为彻底修复｜转化日期：2026-09-20｜状态：已转化

- [2026-09-07] 现象：iOS 26 Safari反复报告正文回第一节或封面｜证据：resources/evidence/006-detail-reading/bounce-investigation/findings.md
  原因：旧实现同时使用CSS吸附与脚本滚动；模拟浏览器未完整复现真机回跳，不能把模拟通过当作真机修复确认。
  转化：[detail-paging.ts](../src/scripts/detail-paging.ts)改为独立页面状态，移除吸附及逐帧滚动｜验证：[explore.spec.ts](../tests/explore.spec.ts)覆盖切页后等待、视口变化及正文原生滚动；真机仍待复测｜转化日期：2026-09-07｜状态：已转化
