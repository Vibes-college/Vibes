---
tense: 'frozen'
describes: '发布SDK与本地助手接入取舍'
status: 'in-progress'
amended-by: []
---

# 发布SDK与本地助手接入取舍

## 官方daemon与单连接

采用官方`@getpaseo/client@0.7.2`，一条DaemonClient连接用`createPaseoApi`取得公开会话与provider能力。发布API缺少完整取消和审批确认，集中调用internal的cancelAgent及respondToPermissionAndWait；不把旧fork的隐藏Chat服务视为官方协议。放弃整套Expo嵌入，避免继承旧路由、门户和资源体积。依据：[发布包](https://registry.npmjs.org/@getpaseo/client/0.7.2)、[官方SDK边界](https://github.com/getpaseo/paseo/blob/main/packages/client/README.md)。

## 完整复用assistant-ui官方界面

用户明确要求采用完整官方开源UI与Elements，不能只用runtime再自行拼接外壳、会话选择和工具卡。采用官方registry的Thread、AssistantModal、ThreadListSidebar、ModelSelector、Sources及递归依赖，保留完整源码和默认布局；通过ExternalStoreRuntime接Paseo，开发集中于数据、恢复、审批和作品上下文。源码在src/components/assistant-ui/elements/与src/components/ui/，来自2026-09-07官方registry，以shadcn4.21.0安装；runtime0.15.18、Markdown0.14.14固定，组件由Git保存。适配涉及中文、Paseo能力、数据/动作、历史/上下文槽位和样式作用域，MIT许可在public/licenses。未支持能力隐藏，不虚构语音、附件或重新生成；没有Assistant Cloud服务实例。

普通审批映射官方ToolFallback approval并等待daemon确认，多问题使用相同容器和官方表单保留协议字段；推理为reasoning，工具为tool-call，作品为Sources。Markdown关闭原始HTML、限制链接并阻止消息图片自动请求。依据：[ExternalStoreRuntime](https://www.assistant-ui.com/docs/runtimes/custom/external-store)、[发布元数据](https://registry.npmjs.org/@assistant-ui/react/0.15.18)。

## 配对与浏览器入口

ConnectionOffer v2含serverId、daemonPublicKeyB64、relay endpoint/useTls。官方解析器不限定地址且只检查公钥非空，应用需补32字节长度、输入上限及官方WSS精确允许列表。配对是设备信任材料，默认标签页存储，可主动记住或清除，不进入日志和网站服务端。官方relay仅转发加密数据；不让浏览器持有模型API密钥。依据：[安全说明](https://paseo.sh/docs/security)、[协议发布元数据](https://registry.npmjs.org/@getpaseo/protocol/0.7.2)。

relay@0.7.2的浏览器/import入口指向tarball不存在的src/e2ee.ts，Node条件指向实际dist/e2ee.js；在Vite对精确子路径使用createRequire.resolve alias，不全局启用Node条件，也不复制密码实现。依据：[relay发布包](https://registry.npmjs.org/@getpaseo/relay/0.7.2)。

## 执行与恢复

发送默认interrupt并清pendingPermissions，因此运行或待审批禁发；messageId只提供部分时间线去重，不能当执行幂等保证，超时不自动重发。取消与审批等待daemon确认，不因点击就显示结束。selective_agent_timeline能力必须显式启用；每次重连重新订阅并refetch。Canonical seq/epoch是权威行号，同messageId可有多个文本片段，不能仅按messageId去重。先注册监听再取快照，缓冲增量并隔离generation。缺序号或缺口时重新读取，旧会话不能覆盖新选择。依据：[server发布元数据](https://registry.npmjs.org/@getpaseo/server/0.7.2)。

## 懒加载与交付

复用现有Astro持久节点和动态import，普通浏览不加载SDK或React聊天；assistant-boot→assistant.ts→assistant-app.tsx两级显式导入让大依赖预加载表留在点击之后；不增加每卡片React island。完整官方UI和SDK依赖实测约644KB gzip，以700KB设首次发布独立硬预算，不修改已存在的普通脚本/MDX门槛，静态引入不能逃逸。完整SDK包含多种daemon方法和协议验证，首版保留官方实现，不复制裁剪内部代码。无需新增托管服务：现有Cloudflare预览/生产流程仍是交付权威。模拟协议、真实daemon和真机证据分别验收。
