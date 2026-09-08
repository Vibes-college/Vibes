---
tense: 'living'
describes: '本地助手的连接、协议、状态与资源边界'
status: 'current'
shaped-by: ['011']
code-sources:
  [
    'src/lib/assistant/',
    'src/components/assistant/',
    'src/components/assistant-ui/',
    'src/scripts/assistant.ts',
    'src/scripts/assistant-app.tsx',
    'src/components/ui/',
    'src/components/icons/',
    'src/hooks/',
    'src/lib/utils.ts',
    'src/scripts/assistant-boot.ts',
    'src/components/AssistantHost.astro',
    'tests/assistant.spec.ts',
    'tests/fixtures/assistant-daemon.ts',
    'tests/unit/assistant.test.ts',
    'tests/unit/assistant-store.test.ts',
  ]
code-revision: '1c78bb3a6a0ef9c174eb094305e1d231cab8b9b6d8408bf821b2af7cf17871b0'
---

# 本地助手连接与状态

用户步骤见[使用本地助手](../features/local-assistant.md)。Vibes静态页面通过官方Paseo中继连接用户授权的电脑，本地daemon负责Agent、模型登录与工具权限；网站没有模型代理、账号服务或对话数据库。

## 官方组件与已发布接口

聊天采用`@assistant-ui/react@0.15.18`的ExternalStoreRuntime和官方[Elements](https://www.assistant-ui.com/elements)完整源码，Markdown为`@assistant-ui/react-markdown@0.14.14`。Thread、AssistantModal、ThreadListSidebar、ModelSelector、Reasoning、ToolGroup、ToolFallback及Sources沿用官方布局；shadcn依赖在`src/components/ui/`。保留完整上游组件，适配范围是中文、Paseo能力开关、数据/动作和少量槽位。未接入的附件、编辑、重生成、分支与语音随runtime能力隐藏，不显示虚假入口。

App把消息及会话交给runtime，将发送、停止和审批交回Paseo。配对与新会话使用官方表单，provider来自电脑，ModelSelector只列出实际模型；普通审批映射官方approval，问题用ToolFallback与官方控件保留Paseo字段。Sources显示作品资料，菜单提供刷新、断开/重连、附带开关及忘记；桌面可全屏，手机侧栏为Sheet。

`components.json`登记registry、别名和aui前缀；`official.css`只扫描助手目录，reset限制于assistant-ui-scope，门户带同一作用域，保持Explore样式。`cn`支持aui前缀类合并。许可随静态文件提供：`public/licenses/assistant-ui.txt`、`public/licenses/shadcn-ui.txt`。升级需核对本地适配差异。

`@getpaseo/client`及`@getpaseo/protocol`固定0.7.2。`paseo-client.ts`持有唯一DaemonClient并创建高层PaseoApi：会话、工作区、模型、发送及历史用高层API；发布版本尚未在高层暴露的选择性订阅、停止、审批及连接事件集中在此文件。升级时核对实际npm包，不能直接照搬较新网站文档。没有引入旧项目的定制daemon或隐藏Chat RPC。

`@getpaseo/relay@0.7.2`的浏览器export指向未发布src文件，Astro只对`@getpaseo/relay/e2ee`精确映射到已发布dist入口；没有把整个浏览器构建切到Node条件。所有依赖固定于锁文件，不用运行时CDN。

## 配对与隐私

输入接受v2 JSON或HTTPS链接hash中的offer。`pairing.ts`限制长度10000字符、serverId格式和长度、32字节公钥；只接受`relay.paseo.sh[:443]`及TLS，丢弃额外字段。随后SDK加密握手，连接及重连核对serverId。CSP只新增`wss://relay.paseo.sh`，不开放任意WebSocket或浏览器直连本地端口。

保存键为`vibes.local-assistant.v1`，值只有offer、随机clientId及selectedId。默认sessionStorage，显式勾选才改为localStorage；两者切换先移除旧副本。刷新恢复存储的设备和会话，正文仅在内存，daemon是历史来源。忘记分别尝试清两份存储并关闭客户端；浏览器阻止删除时提示手动清除此站点数据，不显示已忘记；断开保留恢复信息且不取消本地任务。浏览器存储不可用时给出错误，不把凭据放URL。SDK日志关闭，不把配对或消息交给分析服务；Vibes服务器不持有模型密钥或消息明文。

中继转发加密数据；模型服务仍可能处理用户发送给所选Agent的内容，具体行为由电脑上的Agent与模型配置决定。用户在审批卡提交决定，daemon最终执行，不把前端按钮当权限边界。

## 状态与恢复次序

`store.ts`是唯一UI状态所有者。每次连接/重连先验证设备身份，并行读取最近200个活跃会话与可用provider，再订阅选中会话并读取canonical tail（200条），完成后开放发送/审批。新建先打开用户填写的cwd工作区，按所选provider/model创建普通Paseo会话。

选择会话、断开和新连接会使旧异步结果失效；软重连也作独立代次隔离。快照读取中缓存选中会话事件，快照安装后按次序归并；seq重复被去重，epoch变化、缺序号或跳号重新读取tail。早期记录按before游标加载；返回reset、staleCursor或gap时换成新的权威tail。最多2000条，流继续增长时保留最近记录并显示历史入口，缓冲超限重新拉取，不把缺口当完整历史。

发送、停止与审批同一时间只允许一个请求；运行、初始化或待审批时禁发。messageId每次真实发送随机生成，不自动重发。超时/拒绝无法证明是否已执行时显示“结果未确认”，必须先刷新状态。工具按turn/callId更新原卡；完成、失败、取消从daemon事件读取，不以空闲推断成功。关闭面板与跨页导航不停止任务。

审批以agentId和requestId绑定待审批，远端确认后刷新状态。工具审批支持allow/deny；已识别的question支持选项、多个问题、多选与自由文字，答案按问题header提交到updatedInput.answers。未知格式不猜答案，保留拒绝并提示到电脑处理；不调用assistant-ui的本地addToolResult来伪造远端批准。

## 上下文与输出

作品资料由WorkDetail公开数据属性提供，经客户端限制为标题300、原作链接2000、规范链接2000、简介4000字符；作为引用资料附在用户文字后，不成为系统指令。发送前可展开查看并取消附带；切换作品重置附带选项。不会读取私有文件或抓取链接正文。

`timeline.ts`按canonical序号合并文本与工具生命周期，工具参数/结果预览有界。Markdown禁原始HTML，图片只显示替代文字，链接仅允许HTTP(S)，新标签加noopener/noreferrer。无前端工具执行、iframe、附件下载或消息指定的交互UI。有效作品引用段转为来源标签，发送原文仍保留完整引用。聊天界面与SDK只在点开后加载：assistant-boot→assistant.ts→assistant-app.tsx两级显式导入让大依赖预加载表留在点击之后；范围和独立硬预算见[系统规则](rules.md)。

## 代码下载、压缩与缓存

首次点击立即显示加载提示并阻止重复点击，然后动态导入官方界面与SDK；加载失败可重新点击。页面尚未刷新时模块和React root复用，收起/再打开或站内导航不重建连接。刷新后从设备恢复信息重新连接、同步权威历史；代码缓存与会话恢复是两回事。

构建JS/CSS文件名带内容指纹，`public/_headers`对`/_astro/*`设置`public, max-age=31536000, immutable`；中英文HTML为`public, max-age=60, must-revalidate`。新HTML引用新指纹，未改变文件可复用浏览器缓存。缓存可能被浏览器清理，Cloudflare边缘缓存与浏览器缓存各自生效，不保证第二次永不联网。

本地budget统计完整助手依赖的gzip总量，不代表线上实际传输、执行时间或内存。Cloudflare按客户端能力协商传输压缩，浏览器自动解压；解压后的代码仍需解析和执行。预览验收记录实际Content-Encoding、Cache-Control和浏览器首次/重复加载，不能把单独SDK测量当作完整聊天界面大小。依据：[Cloudflare压缩](https://developers.cloudflare.com/speed/optimization/content/compression/)、[HTTP缓存](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)。

[Cloudflare实测](../../specs/011-local-paseo-assistant/research.md)记录完整聊天JS的压缩正文、解压大小、点击至表单及浏览器重启后的缓存；它是单次桌面测量，未代表真机手机性能。浏览器缓存用fromDiskCache与transferSize核对，边缘命中用首次网络响应的CF-Cache-Status核对，不把缓存保存的旧响应头当作再次联网证据。

## 电脑端准备与真实验收

常见CLI路径是`paseo daemon start`启动、`paseo daemon pair`取得配对信息，实际命令以已安装版本帮助为准。首次必须在电脑完成受支持Agent的安装与登录；后续手机连接仍需要电脑联网且唤醒，不要求公网开放本地监听端口。不会自动升级或改写用户已有Agent配置。

已在本机官方Paseo0.5.0与客户端0.7.2之间完成加密适配层握手与受控README任务；Codex使用应用内已安装0.153.3。旧/usr/local/bin/codex0.144.1无法读取这台电脑较新的配置，Claude本机登录已过期，均不能当作可执行成功。实际启动时仅为daemon选择兼容Codex的PATH，未修改Codex配置；这是一组已验版本，不承诺所有版本组合兼容。真实Chromium UI已完成配对、新建会话、README与作品任务、停止、刷新和断开重连；审批及设备范围见功能文档。

协议夹具使用官方E2EE和消息schema验证发送、工具、审批、停止及断线；CI不接用户电脑或真实模型。真实浏览器测试单独连接已授权daemon，在隔离测试目录运行受控任务，保留去秘密结果，配对信息及私有历史不提交。
