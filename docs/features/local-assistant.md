---
tense: 'living'
describes: '浏览作品时与自己的本地Agent协作'
status: 'current'
shaped-by: ['011']
code-sources:
  [
    'src/components/AssistantHost.astro',
    'src/components/assistant/',
    'src/components/assistant-ui/',
    'src/lib/assistant/',
    'src/scripts/assistant-boot.ts',
    'src/scripts/assistant.ts',
    'src/scripts/assistant-app.tsx',
    'src/components/ui/',
    'src/components/icons/',
    'src/hooks/',
    'src/lib/utils.ts',
    'tests/assistant.spec.ts',
    'tests/fixtures/assistant-daemon.ts',
    'tests/unit/assistant.test.ts',
    'tests/unit/assistant-store.test.ts',
    'tests/unit/assistant-recovery.test.ts',
    'tests/unit/assistant-diagnostics.test.ts',
  ]
code-revision: 'cedf562cf740c3526dcd481aaeff0f0668d5a4687d00a6f8dfd76eaf56730e61'
---

# 功能名：使用本地助手

## 一句话说明

访客在Explore打开助手，连接自己电脑的Paseo，把当前作品交给本地Agent讨论或执行任务，并在同一面板查看回复、处理审批、停止及恢复对话。

## 用户操作路径

1. 先在电脑按[官方Paseo说明](https://paseo.sh/docs)安装Paseo和至少一个支持的Agent，完成Agent登录，启动daemon并取得配对链接。电脑保持联网与唤醒；安装与兼容说明见[本地连接](../system/local-assistant.md)。
2. 手机或电脑打开Vibes的`/zh/`或`/en/`，点右下角“本地助手”。立即显示加载提示，首次此时才下载聊天组件。把官方v2配对链接或JSON粘贴进输入框，点击“连接电脑”；有效配对通过官方中继加密连接，成功后显示“已连接”。无效配对不联网，连接失败时检查电脑和网络后重试。
3. 默认只在当前标签页保存配对，刷新可恢复；需要以后继续使用时，在连接前勾选“在此设备记住电脑”。关闭助手只收起界面；“断开连接”保留恢复信息，电脑上的任务继续执行；“忘记电脑”断开并清除此浏览器的配对、会话索引、诊断和待确认操作索引。它不撤销其他设备、不删除电脑会话。
4. 点左上角侧栏按钮，在官方会话列表搜索或选择已有会话；标题下显示任务状态，“会话选项”显示Agent、模型和目录；或点“新建会话”，选择可用Agent、填写电脑上的完整目录路径、读取真实模型列表并选模型，再创建会话。列表为最近的至多200个活跃会话；独立启动、未由Paseo管理的桌面聊天不在接管范围。
5. 在作品详情打开助手，输入框旁显示作品来源标签。点击可核对标题、Vibes链接、原作链接和简介，点旁边移除按钮取消附带；“会话选项”可重新勾选附带；输入自己的问题后发送。切换作品会换成当前作品资料，首页没有作品资料。不自动抓取原站、整篇正文或电脑文件。
6. 在官方assistant-ui Thread中查看连续回复与可折叠推理，展开工具组和工具卡查看参数与结果。复制按钮复制已显示的回复；消息中的HTML不运行，图片只显示替代文字，外部链接需手动打开。工具在电脑执行，Vibes服务端不接收对话。
7. 遇到审批，在卡片核对真实工具/问题后选“允许本次”“拒绝”或填写回答；提交时等待电脑确认，不能重复点击。暂不支持的问题格式保留“拒绝”，也可到电脑处理。需要中断时点“停止”，收到电脑状态后才结束；运行或待审批期间不再发送新任务。
8. 页面刷新、断线或后台返回时，助手核对连接并恢复历史、运行状态和待审批；过程中保留同会话的上次完整记录并标明过期，暂不能发送或审批。临时失败会自动退避重试，“刷新状态”也可唤醒恢复；主动“断开连接”后不会因返回页面而自动连回。“结果待核对”出现时，先刷新并检查电脑；权威证据不足时仍保留提示，明确核对后可点“我已核对，继续操作”，此按钮只解除本地拦截，不会重发或宣称成功。更早记录每次读取200条，最多显示2000条，达到上限后可返回最新记录，完整历史仍在电脑。
9. 桌面显示官方AssistantModal，可点右上角按钮全屏；手机显示全屏弹层，侧栏使用官方Sheet；界面随站点中英文切换，用户文本和工具输出保留原文。按Escape或关闭按钮收起，键盘焦点回到入口。没有JavaScript时仍可浏览作品，助手显示需要启用JS的说明。

连接问题持续时，在“会话选项”点“导出连接诊断”，保存JSON文件供排查。文件包含版本、连接/补齐阶段、耗时和失败类别，不包含配对材料、消息或工具正文；默认保存在本地且不自动上传。浏览器存储失败时会提示诊断和跨刷新核对可能不完整。身份不符时停止自动恢复，需核对配对；一般超时不直接断言电脑已关机。手机长后台/锁屏的实际支持证据见下方验收。

### 操作之后发生什么

```mermaid
flowchart TD
  A[打开助手，提交配对] --> B[SDK通过官方中继建立加密连接]
  B --> V[核对设备身份]
  V --> C[读取可用Agent与会话]
  C --> D[选择会话，恢复权威历史和状态]
  D --> E[确认作品资料并发送]
  E --> F[电脑上的Agent执行，返回文字和工具事件]
  F --> G{需要用户决定}
  G -->|审批或问题| H[浏览器提交决定，等待电脑确认]
  H --> F
  G -->|完成或停止| I[显示真实结束状态]
  F -->|断线或页面恢复| R[探活现有连接，必要时串行重建]
  R --> V
  D -->|临时失败| W[保留旧记录，退避重试]
  W --> R
```

## 涉及的文件

- 页面与入口：`src/components/AssistantHost.astro`、`src/layouts/Layout.astro`、`src/scripts/assistant-boot.ts`、`src/scripts/assistant-app.tsx`。
- 聊天与连接操作：`src/components/assistant-ui/`保留官方完整Elements源码及默认布局，`src/components/assistant/`为Paseo连接、会话、上下文及审批界面。
- 数据与状态：`src/lib/assistant/`，字段、恢复次序、兼容与容量见[本地连接说明](../system/local-assistant.md)。
- 作品资料来自`src/components/WorkDetail.astro`已发布的公开元数据，不增加后台内容接口。

## 验收标准

- [ ] 当前恢复版本的真实daemon配对、新建会话、作品上下文、工具、允许/拒绝、停止及恢复待复验。
- [x] 2026-09-07桌面Chromium、移动Chromium/WebKit的36项助手回归通过，包含320px、假在线、历史失败、回执丢失、20轮恢复及身份错误；新增订阅/审批丢回执场景随完整验证再记录。
- [ ] 当前恢复版本的内置浏览器实际布局与交互复核待完成。
- [ ] 当前恢复版本的Cloudflare预览、首次加载/缓存与实际增量待记录。
- [ ] 真实iPhone Safari后台/锁屏/网络/长离开矩阵待测；此前用户报告返回“正在连接→电脑连接失败”。

2026-09-07基础版本的真实Chromium、Cloudflare、用户口述Safari成功范围及原始证据仍保留于[研究](../../specs/011-local-paseo-assistant/research.md)和resources/evidence/011-local-paseo-assistant/；恢复与操作状态代码已改变，不能把基线通过项当作新版本验收。用户深入任务疑似浏览器`.js`工具失败尚缺原始类别，不能归因权限不足。自动化设备模拟不等于真机通过。

## 对应的自动化测试

`tests/assistant.spec.ts`覆盖加密SDK配对、会话/模型/目录、公开上下文选择、文字/工具、审批允许/拒绝/多选、停止、拒绝发送、刷新、重连、中英文导航、忘记、320px和焦点。`tests/fixtures/assistant-daemon.ts`使用发布协议及官方加密实现模拟本地端，另覆盖假在线、历史失败重试、回执丢失跨刷新核对、20轮恢复/清理与身份不符，属于回归夹具，不是真实模型执行证据。

`tests/unit/assistant.test.ts`验证配对、存储、文本和工具归并；`tests/unit/assistant-store.test.ts`验证状态所有权、禁止重复执行、确认时机与重连；`assistant-recovery.test.ts`验证旧逻辑移植后的所有权/清理/退避及活动记录；`assistant-diagnostics.test.ts`验证白名单、容量、过期、存储失败和去正文操作核对。真实环境测试使用浏览器UI连接电脑daemon，去秘密证据保存在`resources/evidence/011-local-paseo-assistant/`，不向Git或PR上传凭据/私有对话。

## 依赖的其他功能

[浏览与搜索作品](explore-browse.md)、[阅读作品详情](article-read.md)。电脑端安装、登录和运行由Paseo与所选Agent提供。

## 已知问题 / 待办

手机Safari基础路径已有用户口述通过，离开后返回连接失败尚未定位；工具错误不能仅凭`.js`后缀归因权限不足，现有审批不代表所有工具均可执行。研究、源码证据及待验场景见[对照研究](../../specs/011-local-paseo-assistant/research.md)。首版仅一个已配对电脑，采用粘贴配对，不提供相机扫码、终端、文件树、diff编辑器、语音、附件、编辑或重新生成。浏览器“忘记”只清本浏览器；对电脑访问权的撤销按Paseo官方机制处理。旧Agent CLI可能不能读取较新的本地配置，需要使用兼容版本，不能以daemon能连接推断模型一定能执行。
