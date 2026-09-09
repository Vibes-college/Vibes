---
tense: 'living'
describes: 'Paseo原生助手的来源、接入边界和构建维护'
status: 'current'
shaped-by: ['013']
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
code-revision: 'fe15a40910a491824ec49f4d54723eb8b18a9822ff0cefcfbb0317759f85f204'
---

# Paseo原生助手

访客操作见[使用本地助手](../features/local-assistant.md)。本篇解释谁负责连接、数据如何经过边界，以及维护者怎样重建相同的助手。

## 谁负责什么

Vibes在已有页面内直接挂载固定Paseo Web应用。宿主只管理首次加载、安装说明、界面尺寸、页面语言与显式文章引用；配对、连接协调、会话目录、历史、草稿、工具、审批、停止与文件窗口沿用原生实现。没有另一个Vibes会话客户端或聊天代理服务。精简页头尚未接回的工作区操作和插件执行限制见[使用本地助手](../features/local-assistant.md#已知问题--待办)，当前预览不代表所有原生Web入口均已可用。

`src/scripts/paseo-boot.ts`是普通页面的轻量入口；首次点击才导入`host.ts`并请求原生资源。宿主验证资源配置，以SRI加载CSS和入口脚本，只挂载一个原生根。Astro站内切页保留该根和动态CSS规则；收起保留原生尺寸与状态，并发送可见性、焦点和页面前后台变化。收起不会停止电脑上的任务。

`operable`只表示原生界面已挂载，不能作为电脑在线或Agent可用的判断。已有设备由原生注册表加载完成后发出不带设备信息的`saved-hosts`事件，宿主据此关闭首次安装说明；用户主动打开帮助时仍保留说明。在线、离线、正在连接及会话状态继续由原生界面展示。

## 固定上游与补丁

来源为官方`getpaseo/paseo`的v0.7.2，提交`9400a49af670fdb5db4af58e73f8df98588dbea9`。`third_party/paseo-webui/upstream.json`固定仓库、提交、依赖锁和Apache-2.0许可证摘要；`patches/series.json`规定源码与已安装依赖补丁的顺序和摘要。补丁保留直接挂载、宿主尺寸与活动边界、生产状态订阅修正以及Chat/Build和文章引用接线，不包含旧PR的减包实验。

每项补丁的目的、验证和移除条件由`third_party/paseo-webui/patches/maintenance.json`登记。升级时先在独立源码验证官方变化，再决定保留、改写或移除补丁；不能只改版本号或刷新摘要。原生测试与类型检查随构建执行；上游源码和node_modules不提交本仓库。

## 重建与交付

1. `npm run paseo:fetch`下载并核验固定源码到`.scratch/paseo-webui/upstream`，不会安装依赖；已存在且不符合身份或含未保存修改时失败并保留目录。按项目依赖许可准备该版本完整安装树，不能借用会被其他任务修改的源码或共享可变依赖。
2. `npm run paseo:build`校验源码、锁、许可证、补丁和依赖修改前后内容，顺序应用补丁，运行官方Web构建、原生专项测试与类型检查，再恢复本次应用的补丁。若构建改动了受跟踪源码，保留现场供检查，不用reset覆盖未知修改。
3. 成功产物位于`.scratch/paseo-webui/artifacts/product`。入口、资源清单和每个文件大小/摘要写入回执；许可和已安装第三方声明随产物交付。输出先写临时目录，全部成功才替换正式产物；失败不能沿用旧成功产物。
4. `npm run build`验证当前源码/补丁对应的产物，再将清单资源复制到`dist/vendor/paseo/{内容标识}/`。缺失、过期、被篡改或含符号链接的产物会阻断构建。网页引用版本化地址，用户首次打开时加载；更新部署后重新打开页面才使用新版本。
5. GitHub Actions的`npm run paseo:ci`按同一固定锁安装指定workspace，禁用任意生命周期脚本，再明确执行固定上游包修补和server构建，最后执行同一产品构建。该命令只接受CI环境，不是本地绕过安装确认的入口。

`npm run paseo:test-prepare`只构建测试所需的同版官方server，不安装依赖。Playwright同时拥有网站预览和隔离mock daemon，测试后清理自己创建的进程和会话。内置mock验证真实协议与UI状态，不代表真实模型或真机验收。

`npm run dev`通过`paseo-webui-dev.ts`提供同一份已核验资源和HTML预览载体，不需要手动复制到public；缺失或过期产物返回明确错误，先重新构建原生资源。开发服务不代替构建后Cloudflare响应策略的验收。

环境变量：`VIBES_PASEO`默认启用，可显式设为`enabled`；`disabled`只供本地对照，发布构建拒绝。旧`VIBES_PASEO_PROFILE`不再支持。`SITE_URL`用于文章公开标准链接；本地验证文章入口应设置`https://vibes.college`，本地HTTP默认地址不会被当作可发送的公开文章引用。其他运行配置见[配置](configuration.md)。

## Chat、Build与数据边界

Chat准备发生在连接的电脑：官方API创建或检查`~/Vibes`目录，再寻找或打开对应项目工作区。已有同名目录不会被清空；同名文件、权限错误会显示失败。每个host保留准备阶段，同一个页面并发点击共用一次准备；不确定的工作区创建先查询原生列表，无法确认时给原生项目入口，不盲目再次创建。多浏览器标签页不承诺只创建一次。

准备完成后读取真实provider/model列表，优先使用Codex的`gpt-5.6-luna`或其`luna`别名及该模型原生默认思考强度。缺少Codex或Luna时显示原因和重试、选择Agent/项目、连接设置入口。打开Chat只准备草稿，首次提交才创建Agent。默认目录只是方便使用的路径，不构成执行权限沙箱。

Chat/Build保存各自工作区位置；Build项目选择页保留原生路由参数和草稿标识。已有Agent的配置、消息草稿和附件由Paseo原生存储维护；新Agent表单沿用原生偏好，不承诺每个项目独立保存所有模型设置。Vibes不覆盖Build配置来套用Chat默认值。

文章页面只提供公开标题、slug和HTTPS标准网址。点击“和Agent聊这篇”才产生一次请求标识，在原生草稿水合后附加可删除的引用；替换已有Vibes文章引用，保留普通附件和输入文字。正常重开、缩放或切页不会重新添加已删除引用，再次明确点击文章入口可带入新的引用。

提交时引用转为原生text附件，明确标注为不可信页面数据，不能当作指令或授权；不含文章全文、作者资料、摘要、浏览器凭据或本地路径，也不自动请求原站。配对信息留在原生浏览器存储与连接流程；宿主事件不接收凭据，不写入网站内容库或Cloudflare业务接口。

文件由原生会话链接进入workspace文件窗口，使用Paseo原生读取/订阅和显示能力。文本、图片、Markdown、HTML依各自组件处理；PDF/Office没有新增预览，二进制与过大文件按原生反馈。通用下载仍受原生连接类型限制，纯relay不能冒充direct TCP下载。HTML实际安全边界及响应头见[接口与服务](interfaces.md)。

## 验证与限制

资源总量、首个入口和压缩体积作为解释指标；普通Explore脚本预算继续硬性执行。不能用入口变小代替首开、操作、收起、恢复或长时体验结论。完整采样协议与门槛见[013计划](../../specs/013-paseo-web-integration/plan.md)。

对应单测检查源码/补丁身份、依赖恢复、非法路径、SRI/资源清单和宿主合同；浏览器用例见功能说明。完整真实Agent路径、60分钟固定负载和iPhone真机结果以验收证据为准；测试存在不等于该项已经通过。
