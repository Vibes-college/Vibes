---
tense: 'frozen'
describes: '本地助手的浏览器适配与恢复设计'
status: 'in-progress'
amended-by: []
---

# 本地助手实现计划

## 技术决定与职责

- `src/components/AssistantHost.astro`、`src/scripts/assistant-boot.ts`提供持久宿主、入口与显式动态加载；`src/scripts/assistant-app.tsx`经assistant.ts中间入口在首次打开时建立React root，由官方AssistantModal管理弹层。使用现有Astro、React和TypeScript，不建服务端聊天API。
- `src/lib/assistant/pairing.ts`只接受v2官方加密relay配对，验证32字节公钥与地址；默认sessionStorage，选择记住后才localStorage。设备身份与会话索引可存，对话正文不存；忘记时清理本功能所有存储并关闭连接。
- `src/lib/assistant/paseo-client.ts`集中唯一DaemonClient及createPaseoApi包装、真实连接、目录、发送、取消、权限确认和历史订阅。其余模块不依赖internal接口。`store.ts`负责不可变状态、连接/会话generation、异步隔离、权威刷新和错误反馈；`timeline.ts`保留canonical行并转换稳定UI消息。
- `src/components/assistant/`使用assistant-ui ExternalStoreRuntime、官方完整Elements和shadcn组件及安全Markdown；保留Thread、AssistantModal、ThreadListSidebar、ModelSelector、Reasoning、ToolFallback和Sources默认布局。Paseo负责消息与执行；不启用Assistant Cloud、前端工具执行、编辑或重试生成。工具和审批独立按真实协议显示；审批绑定原会话与requestId。
- 页面作品数据只输出公开标题、规范链接、原作及简述；在发送前用来源标签核对或移除。助手使用当前语言，跨Astro导航更新语言/上下文并保留连接；关闭界面不取消任务。
- 固定`@assistant-ui/react@0.15.18`、`@assistant-ui/react-markdown@0.14.14`、`@getpaseo/client@0.7.2`、`@getpaseo/protocol@0.7.2`。依据发布代码处理API与文档的差异；精确alias修复relay/e2ee发布入口，不切全局Node条件，不复制加密代码。
- 每次connected重建目录和timeline订阅，先订阅再快照，按epoch/seq合并缓冲。缺序号、epoch改变或缺口重新拉权威tail；支持向前分页。历史刷新完成前禁用有副作用操作；发送超时不自动重发，运行/待审批禁用新发送。

## 宪章检查与预算

用户已确认assistant-ui与官方Paseo路线，相关依赖属于该授权。浏览器保存的是用户授权设备的配对材料，服务端/模型凭据留在电脑；宪章4.0.1澄清这一边界而不改变权限执行主体。内容不成为系统指令，输出不执行HTML/JS，正式CSP仅增加官方wss relay。

保留普通脚本21KB、MDX150KB等原硬预算；`assistant.[hash].js`作为唯一审核过的显式动态入口，其完整依赖树单独限制为700KB gzip（完整官方界面实测约644KB，包含SDK和全部实际依赖）。静态导入/预加载仍计普通预算；共享代码在实际触发路径计量，测试避免归属漏洞。320px、移动WebKit和桌面验证独立滚动与焦点，无JS保留作品阅读。

## 验证与交付

用户已批准research中的恢复方案。恢复调度/连接所有权置于独立模块，移植旧HostRuntime/ViewedTimeline的并发、代次与退避规则，保留活动跟踪纯逻辑；paseo-client扩展有界探活及白名单诊断接口，store保留canonical权威合并。浏览器生命周期绑定集中在入口，主动断开可阻止自动恢复。同会话恢复保留内存快照并禁止过期操作；本地诊断有容量/期限和导出边界，操作索引只含核对所需ID、不含正文。来源、调整及测试关系在research据实记录，不引入旧整站依赖或新npm依赖。

先写配对、事件合并、重复/过期响应和操作边界单元测试；浏览器使用受控官方协议中继夹具覆盖成功、失败、恢复和审批，不修改生产协议来配合测试。另用已安装官方daemon验证真实连接和受控任务，记录实际provider登录限制。

运行完整`npm run verify`与`npm run budget`，内置浏览器进行实际UI审阅，预览遵守现有Cloudflare PR流程。功能新增`docs/features/local-assistant.md`，系统新增`docs/system/local-assistant.md`，同步Explore/阅读/检查说明、索引与源码摘要。独立Agent审阅整个PR并复核修复后的最终SHA，才转Ready；合并由用户决定。

## PR工作台与经验复核

PR #10按tasks维护配对、执行、恢复和交付四阶段；阶段完成推送并更新描述，预览包含SHA与限制。落实异步响应隔离、串行E2E及iOS滚动经验；不启动或停止其他任务进程。实现、模拟测试、本机daemon和真机证据分别记录，未部署不称上线。
