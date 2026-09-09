---
tense: 'living'
describes: '连接电脑上的Agent，在阅读时交流或进入项目动手'
status: 'current'
shaped-by: ['013']
code-sources:
  [
    'src/components/LocalAssistant.astro',
    'src/components/LocalAssistantDisabled.astro',
    'src/scripts/paseo-boot.ts',
    'src/features/paseo-webui/',
    'src/layouts/Layout.astro',
    'src/pages/[locale]/works/[id].astro',
    'third_party/paseo-webui/patches/',
    'tests/paseo-loading.spec.ts',
    'tests/paseo-chat.spec.ts',
    'tests/paseo-recovery.spec.ts',
    'tests/paseo-csp.spec.ts',
    'tests/fixtures/paseo-webui/',
    'tests/unit/paseo-webui-contract.test.ts',
    'tests/unit/paseo-page-context.test.ts',
    'tests/unit/paseo-fixture-headers.test.ts',
  ]
code-revision: '39a358bae3966343bba158a0f1dc5fd37b39e4c0c7b8ed992e3eb005e31f7b30'
---

# 功能名：使用本地助手

## 一句话说明

访客把自己电脑上的Paseo连接到Vibes，在阅读作品时与自己的Agent交流，或打开已有项目继续动手；会话和文件操作由Paseo原生工作台提供。

## 用户操作路径

1. 在`/zh/`、`/en/`或作品详情点右下角“本地助手”。第一次点击立即显示安装与连接说明，并开始准备工作台；没有点击时不下载Paseo资源或连接电脑。无JavaScript可继续阅读，助手入口不启用。
2. 在要运行Agent的电脑上，按说明打开Paseo官方桌面App下载页或CLI安装说明。桌面App打开后自动启动服务；电脑需要保持开机、运行Paseo。手机也能使用网页，但仍依赖这台电脑。
3. 在电脑上安装并登录Codex或其他受支持的Agent。Paseo不提供模型账号，使用沿用用户自己的账号和配置。桌面App从Settings → 当前host → Pair Device取得配对信息；CLI按启动提示启用中继并显示配对二维码。
4. 点“已安装，去连接”，在Paseo原生界面完成配对并等到电脑在线。已有配对由Paseo恢复；“工作台已准备”仅表示界面可用，不表示电脑已连接或模型可用。需要重看说明时点顶部帮助。
5. 选择Chat开始日常交流：在连接的电脑准备`~/Vibes`工作目录，默认选择可用的Codex Luna及该模型原生默认思考强度。已有同名目录会保留；没有Codex/Luna或目录不可用时显示具体原因，可重试、选择其他Agent/项目或进入连接设置。打开Chat只准备草稿，点击发送后才创建Agent。
6. 要在已有项目里工作时选Build，从原生项目入口选择文件夹和工作区，再选择Agent与模型。Chat与Build保留各自位置；已有会话的配置、草稿和附件沿用Paseo保存，新会话表单遵循原生偏好，不承诺每个项目独立保存所有模型设置。
7. 输入问题并发送，查看逐步回复、推理与工具卡；需要批准时在原生审批入口决定，运行中可点停止。菜单可进入历史会话，选择原有会话继续；错误、断线和恢复状态由Paseo显示。
8. 点“专注交流”把同一工作台展开；点“返回边读边聊”或展开状态下的关闭按钮回到小窗，小窗再点关闭才收起。桌面宽屏在文章旁显示，较窄屏和手机在底部保留阅读空间；文章仍可滚动。收起不会停止电脑上的任务，也不等于断开或忘记设备。

窄屏时助手与文章入口上下排列，展开的章节目录显示在入口上方，让出阅读控件的操作空间。

连接设置也保留手工添加直接连接或自建中继地址的入口；能否连通仍取决于浏览器对安全连接和本地网络访问的要求，以及电脑上Paseo的来源校验。页面允许相应连接类型不等于已通过所有网络环境的验收。

### 带着文章提问

在作品详情点“和Agent聊这篇”，当前草稿会附上一个可删除的文章引用，同时保留输入文字和普通附件。引用只包含公开标题、作品标识和标准网址，不含正文、摘要、本地路径或浏览器信息；不会自动打开原站或代替用户发送消息。更换引用只替换已有的Vibes文章引用。

点引用上的移除按钮可删掉它；缩放、收起重开、切换文章或刷新不会把已删引用重新附上。再次明确点击“和Agent聊这篇”才产生新的引用请求。暂时附加失败会保留草稿并提供重试。提交时以原生文字附件发送，标为不可信页面资料，不作为指令或操作授权。无公开HTTPS标准网址的本地页面不显示文章入口。

### 打开Agent产出的文件

点击原生消息中的文件链接，进入工作区文件窗口查看文本、图片、Markdown或HTML；带行号的文本链接定位到对应行。文件由连接电脑提供，HTML的隔离和下载边界见[接口与服务](../system/interfaces.md)。PDF/Office没有新增专用预览，二进制、过大文件和不可读文件使用原生反馈；通用下载受连接类型限制，纯中继连接不等同直接连接下载。

输入区可通过“添加附件 → 添加图片”选择本地图片，点缩略图打开原生灯箱；选择图片不会自动发送消息，移除按钮可从草稿中删除附件。

### 中断后继续

资源下载失败时安装说明仍可读，检查网络后点“重试加载”；初始化失败按提示刷新。工作台已打开后，站内切页、语言切换、小窗与全屏切换沿用同一原生界面。离线、电脑睡眠或网页转入后台后，返回时查看原生连接与会话状态，恢复连接后再继续；不要把加载完成提示当作Agent执行成功。

需要断开或忘记电脑时使用Paseo原生连接设置。忘记、清除浏览器存储或换浏览器后可能需要重新配对；收起助手只隐藏界面。任务执行权限来自电脑上的Agent配置，`~/Vibes`默认目录不构成文件访问沙箱。

## 涉及的文件

- 页面与外框：`src/layouts/Layout.astro`、`src/pages/[locale]/works/[id].astro`、`src/components/LocalAssistant.astro`。
- 加载、尺寸与文章引用：`src/scripts/paseo-boot.ts`、`src/features/paseo-webui/host.ts`、`src/features/paseo-webui/contract.ts`、`src/features/paseo-webui/page-context.ts`、`src/features/paseo-webui/shell-copy.ts`。
- 原生接入：`third_party/paseo-webui/patches/`；固定来源、构建和更新方式见[本地助手系统说明](../system/local-assistant.md)。

## 验收标准

- [ ] 普通浏览不请求Paseo；首次点击立即出现安装说明，慢网和资源失败仍能查看、重试。
- [ ] 真实电脑完成首次配对和再次连接，Chat能发送并得到真实Agent回复，Build能在选定项目执行并产生可查看文件。
- [ ] 缺模型、目录错误、配对失败和掉线显示真实状态，并提供可继续的入口。
- [ ] 文章引用仅由明确入口添加，可删除且不覆盖草稿；再次打开或切页不自动复添或发送。
- [ ] 小窗、全屏、收起重开、站内切页保留会话与输入；收起不取消运行中的任务。
- [ ] 原生工具、审批、停止、历史与文件路径在实际连接上可操作；HTML预览遵守隔离边界。
- [ ] 桌面与手机的阅读、键盘输入、选择文字和滚动可用；长时负载及iPhone真机后台恢复通过专项验收。

验收项按完整范围打勾，局部验证、旧PR或mock用例不能代替未覆盖部分。阶段预览提供当前已接入的连接、Chat/Build、会话和文件路径；漏掉的原生入口与插件运行保留后续接回，当前不宣称可用。长时与真机完整矩阵也保留后续验收，范围见[013规格](../../specs/013-paseo-web-integration/spec.md)。

## 对应的自动化测试

- `tests/paseo-loading.spec.ts`：普通浏览/无JS零加载、即时引导、资源失败重试、单一根与动态样式保留。
- `tests/paseo-chat.spec.ts`与`tests/fixtures/paseo-webui/`：真实固定版mock协议下的流式输出、工具、审批、停止、会话选择和文章引用；设备、家目录和工作目录由fixture隔离。
- `tests/paseo-recovery.spec.ts`：隐藏与恢复时的原生连接、订阅和活动状态；模拟信号不代替真机挂起。
- `tests/paseo-csp.spec.ts`：真实图片选择、blob缩略图与灯箱解码、带行号文件链接及HTML交互与隔离；fixture按构建后的响应头路径规则运行，实际Cloudflare响应仍需部署验收。
- `tests/unit/paseo-webui-contract.test.ts`、`tests/unit/paseo-page-context.test.ts`和`tests/unit/paseo-fixture-headers.test.ts`：宿主事件、公开文章字段、非法输入和预览响应头边界。

测试文件存在不表示当前全部通过；真实模型、Cloudflare部署与手机验收以对应记录为准。

## 依赖的其他功能

- [浏览与搜索作品](explore-browse.md)、[阅读作品详情](article-read.md)：提供助手和文章引用入口。
- [检查与发布网站](project-commands.md)：交付经过身份校验的原生资源和同一套响应头。

## 已知问题 / 待办

- 首次打开需要下载完整Paseo应用，耗时取决于网络和设备；安装说明先显示，工作台大小不代表可交互速度。
- Agent必须在用户电脑上可用；原生会话和文件能力仍受模型、连接类型与电脑权限约束。
- 精简页头尚未接回原生工作区菜单、脚本、编辑器与Git操作入口，当前预览保留这一缺口。设置中的插件入口仍在，但固定原生版本的插件执行需要eval，主页面没有开放，因此插件运行尚未接通；不能宣称完整Paseo Web能力已可用。
- 原生Browser标签页和remote SSH属于官方桌面端专属能力，不属于Web接入承诺；语音需电脑端正确配置服务，并由浏览器用户授权麦克风。
- 长时固定负载、真实iPhone键盘/旋转/锁屏和完整辅助技术路径保留后续专项验收，不把模拟浏览器通过写成真机结论。
