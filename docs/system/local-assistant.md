---
tense: 'living'
describes: 'Paseo原生助手的来源、接入边界和构建维护'
status: 'current'
shaped-by: ['013', '014']
code-sources:
  [
    'src/features/paseo-webui/',
    'scripts/paseo-webui-assets.ts',
    'scripts/paseo-webui-build.ts',
    'scripts/paseo-webui-dependencies.ts',
    'scripts/paseo-webui-licenses.ts',
    'scripts/paseo-webui-sandbox.ts',
    'scripts/paseo-webui-preview.ts',
    'scripts/paseo-webui-dev.ts',
    'third_party/paseo-webui/',
    'tests/unit/paseo-asset-contract.test.ts',
    'tests/unit/paseo-build-config.test.ts',
    'tests/unit/paseo-webui-build.test.ts',
    'tests/unit/paseo-webui-dependencies.test.ts',
    'tests/unit/paseo-webui-sandbox.test.ts',
    'tests/unit/paseo-preview.test.ts',
    'tests/unit/paseo-webui-contract.test.ts',
    'tests/unit/paseo-page-context.test.ts',
  ]
code-revision: 'e5c3c26b17eaeb6aad2d727af9c543d902e8845aee086fc203a619927d387614'
---

# Paseo原生助手

访客操作见[使用本地助手](../features/local-assistant.md)。本篇解释谁负责连接、数据如何经过边界，以及维护者怎样重建相同的助手。

## 谁负责什么

Vibes在已有页面内直接挂载固定Paseo Web应用。宿主只管理首次加载、安装说明、界面尺寸、页面语言与显式文章引用；配对、连接协调、会话目录、历史、草稿、工具、审批、停止与文件窗口沿用原生实现。没有另一个Vibes会话客户端或聊天代理服务。精简页头尚未接回的工作区快捷操作和插件执行限制见[使用本地助手](../features/local-assistant.md#已知问题--待办)。

`src/scripts/paseo-boot.ts`是普通页面的轻量入口；首次点击才导入`host.ts`并请求原生资源。宿主验证资源配置，以SRI加载CSS和入口脚本，只挂载一个原生根。Astro站内切页保留该根和动态CSS规则；收起保留原生尺寸与状态，并发送可见性、焦点和页面前后台变化。收起不会停止电脑上的任务。

宿主提供同一行44px工具栏的原生插槽和尺寸/收起按钮，原生`src/embedded/toolbar.tsx`通过React portal在插槽内渲染新对话或菜单动作。进入compact时恢复当前工作区的会话或草稿；已在compact主动打开文件或终端时，原生通过surface事件请求full，保留目标标签。窄屏full保留原生`MobileWorkspaceTabSwitcher`，不额外添加Agent/Terminal新标签加号菜单；返回compact再选择最近会话，不复制草稿或关闭文件、终端标签。

文件入口复用官方`useIsCompactFormFactor`：窄屏full在左侧History/Plan下方提供Files，`src/embedded/mobile-files.tsx`先关闭左菜单，再分发官方`workspace.tab.open`的`files`/`supporting`动作。`src/app/_layout.tsx`沿原生`CompactExplorerSidebarHost`呈现全宽高的`CompactExplorerSidebar`/`MobilePanelOverlay`，不在菜单内展开树或复制文件状态。选择文件沿原生路径打开file tab并关闭overlay；宽屏仍用右侧文件栏，不另设文件入口断点。

“新建工作区”沿原生全局动作和路由进入创建页面。`src/components/left-sidebar.tsx`把关闭按钮外框的`pointerEvents="box-none"`交给React Native Web属性编译，避免透明容器截住首行点击，按钮本身仍可关闭菜单。

嵌入时Unistyles首次配置使用`initialTheme: light`，完整浅色配色在首屏前生效；AppearanceProvider水合已保存设置后仍选择light，不让系统深色、保存的深色或插件主题覆盖。该分支不自动写回用户主题偏好；独立Paseo继续沿用原有自适应与主题设置。

全屏固定后方body并保存阅读位置，离开全屏或收起时释放；Astro替换body前释放旧页面锁，在新页面恢复自身滚动后重锁，浏览器前进后退不沿用前一页位置。手机小窗按visualViewport定位，触屏输入至少16px，切换尺寸和收起不主动恢复输入焦点；没有禁止用户手动缩放。真实Safari键盘行为仍以真机验收为准。

`operable`只表示原生界面已挂载，不能作为电脑在线或Agent可用的判断。已有设备由原生注册表加载完成后发出不带设备信息的`saved-hosts`事件，宿主据此关闭首次安装说明；用户主动打开帮助时仍保留说明。在线、离线、正在连接及会话状态继续由原生界面展示。

## 固定上游与补丁

来源为官方`getpaseo/paseo`的v0.7.2，提交`9400a49af670fdb5db4af58e73f8df98588dbea9`。`third_party/paseo-webui/upstream.json`固定仓库、提交、依赖锁和Apache-2.0许可证摘要；`patches/series.json`规定源码与已安装依赖补丁的顺序和摘要。补丁覆盖直接挂载、宿主尺寸与活动边界、生产状态订阅修正、首次目录与原生草稿选择、单工具栏与compact展示、听写操作和文章引用接线，不包含旧PR的减包实验。

每项补丁的目的、验证和移除条件由`third_party/paseo-webui/patches/maintenance.json`登记。升级时先在独立源码验证官方变化，再决定保留、改写或移除补丁；不能只改版本号或刷新摘要。本地产品构建和完整CI准备执行原生测试与类型检查；仅main可信复用路径可按下方规则省去重复回归。上游源码和node_modules不提交本仓库。

## 重建与交付

1. `npm run paseo:fetch`下载并核验固定源码到`.scratch/paseo-webui/upstream`，不会安装依赖；已存在且不符合身份或含未保存修改时失败并保留目录。按项目依赖许可准备该版本完整安装树，不能借用会被其他任务修改的源码或共享可变依赖。
2. `npm run paseo:build`校验源码、锁、许可证、补丁和依赖修改前后内容，顺序应用补丁，运行官方Web构建、原生专项测试与类型检查，再恢复本次应用的补丁。若构建改动了受跟踪源码，保留现场供检查，不用reset覆盖未知修改。
3. 成功产物位于`.scratch/paseo-webui/artifacts/product`。入口、资源清单和每个文件大小/摘要写入回执；许可和已安装第三方声明随产物交付。输出先写临时目录，全部成功才替换正式产物；失败不能沿用旧成功产物。
4. `npm run build`验证当前源码/补丁对应的产物，再将清单资源复制到`dist/vendor/paseo/{内容标识}/`。缺失、过期、被篡改或含符号链接的产物会阻断构建。网页引用版本化地址，用户首次打开时加载；更新部署后重新打开页面才使用新版本。
5. GitHub Actions的`npm run paseo:ci`按同一固定锁安装指定workspace，禁用任意生命周期脚本，再明确执行固定上游包修补和server构建，最后执行同一产品构建。该命令只接受CI环境，不是本地绕过安装确认的入口。完整CI在同一verify环境中只执行一次，再依次进行网站完整验收与预算；budget检查读取明确结果。
6. main已证明最终文件树与完整PR验收一致时，`npm run paseo:production`重新安装固定依赖、应用补丁并构建Web和回执，省去测试server构建、原生测试及类型复查；来源、锁、许可证、补丁摘要和恢复检查继续执行。入口要求GitHub main push及可信复用标志，普通PR、本地和手动运行不能借它跳过测试；证据判定和失败回退见[交付规则](checks-and-release.md)。

`npm run paseo:test-prepare`只构建测试所需的同版官方server，不安装依赖。Playwright同时拥有网站预览和隔离mock daemon，测试后清理自己创建的进程和会话。内置mock验证真实协议与UI状态，不代表真实模型或真机验收。

`npm run dev`通过`paseo-webui-dev.ts`提供同一份已核验资源和HTML预览载体，不需要手动复制到public；缺失或过期产物返回明确错误，先重新构建原生资源。开发服务不代替构建后Cloudflare响应策略的验收。

环境变量：`VIBES_PASEO`默认启用，可显式设为`enabled`；`disabled`只供本地对照，发布构建拒绝。旧`VIBES_PASEO_PROFILE`不再支持。`SITE_URL`用于文章公开标准链接；本地验证文章入口应设置`https://vibes.college`，本地HTTP默认地址不会被当作可发送的公开文章引用。其他运行配置见[配置](configuration.md)。

## 首次预设与数据边界

首次进入且没有原生已选工作区时，准备发生在连接的电脑：官方API逐级创建或检查`~/Vibes`与其下的`Chat`，核对目录类型/权限，再寻找或打开`~/Vibes/Chat`对应项目工作区。已有同名目录不清空；同名文件、权限错误显示失败。官方目录API会登记项目，最终只打开Chat工作区。每个host保留准备阶段，同页并发共用一次准备；不确定创建先查询列表，不盲目重发，多标签不承诺只创建一次。

准备完成后，已有会话或草稿沿用原生状态；初始草稿不带provider/model setup，不查询或等待Codex/Luna。原生Composer恢复已存偏好，没有偏好时由用户选择本机可用的Agent和模型；Vibes不自动选择provider、模型、模式或强度，也不要求ChatGPT订阅。只准备草稿，首次提交才创建Agent。默认目录不是权限沙箱。

界面不提供Chat/Build模式。后续启动沿用原生当前工作区选择与恢复逻辑；项目选择保留原生路由参数和草稿标识。已有Agent的配置、消息草稿和附件由Paseo原生存储维护，不承诺每个项目独立保存所有模型设置。初始目录预设不会反复覆盖用户之后选择的项目。

新草稿直接使用原生`src/hooks/use-agent-form-state.ts`解析，不再注入嵌入专用模型fallback，不写第二份preferences。已有选择、显式初始配置和用户主动清空按原生规则保留；已保存的旧`~/Vibes`准备记录继续复用，既有工作区不搬迁，新浏览器恢复当前工作区也不强制改到Chat。

文章页面只提供公开标题、slug和HTTPS标准网址。点击“和Agent聊这篇”才产生一次请求标识，在原生草稿水合后附加可删除的引用；替换已有Vibes文章引用，保留普通附件和输入文字。正常重开、缩放或切页不会重新添加已删除引用，再次明确点击文章入口可带入新的引用。

提交时引用转为原生text附件，明确标注为不可信页面数据，不能当作指令或授权；不含文章全文、作者资料、摘要、浏览器凭据或本地路径，也不自动请求原站。配对信息留在原生浏览器存储与连接流程；宿主事件不接收凭据，不写入网站内容库或Cloudflare业务接口。

文件在full的workspace文件窗口内使用Paseo原生读取、订阅、编辑和显示能力。可编辑且不超过1MiB的文本沿用原生CodeMirror编辑器与自动保存；文本、图片、Markdown、HTML依各自组件处理，PDF/Office没有新增预览，二进制与过大文件按原生反馈。通用下载仍受原生连接类型限制，纯relay不能冒充direct TCP下载。HTML实际安全边界及响应头见[接口与服务](interfaces.md)。

## 听写与音频边界

compact的文字发送按钮只取决于当前是否有文字；空输入始终麦克风，焦点与曾经点击不改变规则，清空立即恢复，仅有引用或其他附件也保留麦克风。full及其新建工作区表单保留原生输入呈现与allowEmptySubmit创建语义，不应用compact主按钮规则。该呈现直接从文字与原生录音状态派生，不另存键盘模式。录音仍由用户明确点击启动，录音发送确认继续沿原生转写、提交和排队路径携带附件；按钮恢复不代表提交成功。转写失败保留原生重试/丢弃入口，重复确认和迟到结果由原生听写状态处理。

原生`src/hooks/use-dictation.ts`取消时先关闭尚在启动的麦克风，再回到idle，随后可以再次录音，不等待旧网络启动确认。启动尝试标识隔离旧确认与失败，取消收尾丢弃剩余音频片段，避免旧录音污染或停止新录音。

compact的停止Agent、模型选择关闭和拖入附件不触发隐式输入focus；显式文字快捷键仍可聚焦。嵌入的compact/full均隐藏Realtime按钮并阻止其启动快捷键，不改daemon已有语音配置；听写入口保持可用。该呈现边界不改变原生停止结果、附件归属或提交语义。

浏览器采集的音频通过原生连接送到电脑上的dictation服务，最终文字回到Composer后才提交Agent。官方默认本地路径使用英语Parakeet模型，在电脑完成转写；Vibes没有音频上传或转写业务接口，也不替换用户电脑上的语音provider配置。当前验收范围不含中文、云端转写、实时Voice或TTS，麦克风权限和真实设备结果独立验证。

## 验证与限制

资源总量、首个入口和压缩体积作为解释指标；普通Explore脚本预算继续硬性执行。不能用入口变小代替首开、操作、收起、恢复或长时体验结论。完整采样协议与门槛见[013计划](../../specs/013-paseo-web-integration/plan.md)。

对应单测检查源码/补丁身份、依赖恢复、非法路径、SRI/资源清单和宿主合同；浏览器用例见功能说明。完整真实Agent路径、60分钟固定负载和iPhone真机结果以验收证据为准；测试存在不等于该项已经通过。
