---
tense: 'living'
describes: '原生Paseo嵌入实验的资源与运行边界'
status: 'current'
shaped-by: ['012']
code-sources:
  [
    'src/features/paseo-webui/',
    'src/components/LocalAssistant.astro',
    'src/components/LocalAssistantDisabled.astro',
    'astro.config.mjs',
    'src/scripts/paseo-boot.ts',
    'scripts/paseo-webui-assets.ts',
    'scripts/paseo-webui-sandbox.ts',
    'scripts/paseo-webui-build.ts',
    'scripts/paseo-webui-dependencies.ts',
    'third_party/paseo-webui/',
  ]
code-revision: 'fc575747f6f6418f85566e29f5df06378416f723a47b962edd7933985cae1779'
---

# 原生Paseo嵌入边界

用户操作和有效验收见[本地助手](../features/local-assistant.md)。当前H是固定0.7.2的完整WebUI嵌入实验，A1验证Mermaid按需，A2累计加入终端/文件主体，A3累计加入共享高亮与编辑器位置恢复，A4累计加入语言按需；尚未完成A/B选择，均不是正式发布配置。

## 构建与资源

先按[检查与发布](checks-and-release.md#paseo实验构建边界)准备已授权上游依赖及固定源码，再运行：

```sh
node --experimental-strip-types scripts/paseo-webui-build.ts H
SITE_URL=https://vibes.college VIBES_PASEO_PROFILE=H VIBES_OUT_DIR=.scratch/paseo-webui/h-site npm run build
```

未设`VIBES_PASEO_PROFILE`时Astro在构建图形成前将入口替换为空组件，不输出助手客户端chunk、入口或原生资源；仅在页面条件中不渲染组件仍会遗留chunk，因此不能作为构建排除。H/A1/A2/A3/A4必须显式指定`.scratch/`内输出，发布模式VIBES_DEPLOY=1及其他配置拒绝。构建期间`build-config.ts`核对固定提交、锁文件、完整source/dependency补丁记录、摘要前缀及每个声明资源的大小、哈希和真实路径；不接受符号链接或越界路径。页面只接受一个入口JS及最多20项CSS，路径必须属于同一16位摘要前缀，携带SHA256完整性值。未知字段不向运行时复制。

原生补丁为Metro设置`/vendor/paseo/{摘要}`前缀；摘要来自固定提交、所选配置与补丁清单。Astro完成后`paseo-webui-assets.ts`将声明资源及Paseo许可、第三方许可说明复制到该前缀。H使用完整原生产物。脚本预算从已核验清单读取全部原生JS，宿主仅允许动态加载；静态引用/预加载原生入口、漏列脚本或摘要改变都失败，共享宿主依赖保留在公共预算。首次打开暂以全部原生JS加宿主独有依赖作保守上界，不能据此宣称拆包收益；冻结目标来自budget-baseline.json，H目前不满足最终门槛。最终不可变缓存发布验收仍未完成。隔离daemon托管H测试站时不自动应用Cloudflare的`_headers`；CSP另用本地Worker实际响应验证。启用助手的构建仅为connect-src增加固定`wss://relay.paseo.sh`，普通构建仍同源；版本化vendor路径缓存一年且immutable，不新增任意脚本、frame或worker来源。当前欢迎/聊天路径没有独立WASM、字体或worker请求，不据此认定未来外围能力通过。

A1图表探针使用相同命令，将H改为A1、输出改为`.scratch/paseo-webui/a1-site`。`a1-mermaid-lazy.patch`先呈现原生高亮源码；用户点击才动态导入原生Mermaid host及其固定内联运行时，失败清除Promise后允许重试，成功复用模块。原有渲染策略、请求合并、iframe的allow-scripts隔离和event.source检查保留。源码模式下图表测量区域保留但inert，防止透明工具栏截获点击；短图表保留120px最小高度以容纳原生缩放工具栏。

A1构建从已验证的固定源码中读取生成文件的JSON字符串，不执行生成文件；`paseo-webui-sandbox.ts`计算唯一内联脚本的精确SHA256，记入构建回执并校验格式，再随站点已有哈希集合写入父页面CSP。不允许任意内联脚本，不增加frame来源或allow-same-origin，子iframe原有策略保留。生成格式或脚本数量改变时构建失败，不能静默放宽规则。H旧产物未带此哈希，不能将其图表入口算作已通过。

## 加载与长期实例

轻量`paseo-boot.ts`只在按钮点击后动态导入host。host先建立原生环境，再并行下载SRI脚本和CSS；全部资源成功后调用原生mount。并发调用共享Promise，成功资源不重复下载，失败资源才清除缓存后重试。脚本执行完却没有合法mount，或mount失败，要求整页刷新；30秒未完成提供刷新入口，不另开第二实例。

H在G1直接挂载适配上增加契约和presentation边界；保留上游根providers、独立React运行时、HostRuntime、SessionProvider及原生页面路由。HostRuntime仅在嵌入且没有明确初始连接配置时跳过默认localhost自动发现；设备注册、运行时单例、SessionProvider与同步协议保留。宿主不实现第二套聊天或任意RPC；契约字段见[接口](interfaces.md#paseo宿主契约)。

原生生产编译会丢弃useAgentHistory和聚合连接状态hook中仅用于失效通知的版本依赖，使页面在连接恢复后仍沿用初始快照。h-reactive-history.patch仅对这两个hook保留原有手动memo化，其他编译优化保留；tests/paseo-recovery.spec.ts延迟真实连接后释放原始帧，验证历史随后自动更新。升级时须在生产导出中验证同一场景，不能只运行未经过该编译器的单元测试。

`page-context.ts`从已发布作品投影有限字段，规范链接来自构建SITE_URL与作品路径；本机HTTP规范地址不作为公开作品资料，因此隔离体验也设置正式HTTPS的SITE_URL。标题/简述分别裁到240/2000字符，原作链接包含凭据、查询或fragment时整条省略，不改写成另一个地址。页面元数据节点不随助手容器持久化；mount完成及Astro换页后更新候选资料，普通目录传null。

`h-public-work.patch`只在原生composer加入公开资料按钮，通过原有replaceUserInput编辑原生草稿。资料使用有标签的JSON文本，不添加系统消息、任意RPC、自动发送或第二套消息队列；用户仍通过原生提交、错误恢复与审批流程操作。完整资料后缀可移除并保留之前输入；手动改写后不自动删除。新文章不会替换旧草稿，锁定/只读输入不允许附带；未发送资料随原生草稿存储，宿主不另存副本。

h-operation-feedback.patch只观察原生取消Promise，并在审批mutation明确关闭自动重试；不另发请求、不覆盖原生错误处理。停止反馈按host/agent和请求代次隔离，切会话、卸载或新回合使旧回执失效。收到取消响应只说明请求被处理，不能承诺子进程结束；无回执显示未知，等待权威状态恢复。

容器跨Astro页面持久化；原生React Native、Unistyles和Reanimated的具名样式节点及CSS链接同样保留。原生history使用内部路由，不改变Explore的地址。收起、导航不dispose；退出命令最终整页刷新，网页内单例、监听器与连接随文档销毁，不删除设备。

## 焦点、页面状态与存储

宿主分别传递面板可见、原生区域有焦点、网页在前台三个信号；ResizeObserver只采用非零容器尺寸，收起不把原生宽高压成0。原生浏览器焦点通知来自宿主订阅，键盘处理以原生区域焦点为边界；收起不把后台同步伪装成用户停止。

配对和存储由上游持有；同源隔离daemon提供的初始连接信息由原生流程处理。宿主不复制设备注册、密钥、聊天记录或权限内容，不把它们送入站点URL。当前退出回归只比较设备registry摘要，不能替代IndexedDB副本、忘记设备、迟到事件及恢复矩阵的完整验证。真正停止、断开、忘记需分别通过原生操作，不能混作“关闭面板”。

## 测试与限制

`mock-session.ts`为聊天和展示状态测试统一准备同版SDK、独立Git目录、临时浏览器上下文与取消/归档收尾。`mock-chat-selection.ts`通过服务端读取核对模型变更，并在两个目录间检查草稿隔离；工具错误借鉴固定上游工具UI夹具，仅修改一次合成timeline事件，保留真实身份和序号，不作为真实命令失败证据。`mock-presentation.ts`观察原生heartbeat和流式消息：收起不取消、不新增socket，展开复用同一HostRuntime；受控visibilitychange由宿主和原生AppState共同接收，恢复后核对连接及目录就绪。它不模拟实际Safari挂起或锁屏，不替代真机与100次矩阵。

`PASEO_HOST_URL=http://127.0.0.1:6792 npx playwright test tests/paseo-loading.spec.ts`要求已由AI准备的H本地站及同版daemon；只接受本机地址，未指定明确跳过。测试使用实际生产资源，记录请求、挂载及连接计数；离线和404为受控浏览器故障。真实浏览器截图与本地原始日志存host/证据目录，性能统计另按冻结实验执行。

本地Worker的真实CSP与官方TLS中继配对、已有会话及简单文字回复已验证；最终资源门槛、完整恢复、真机或上线验收未完成。完整原生语音与外围入口仍需按A/B能力矩阵验证，不能以显示按钮证明可用。

Astro客户端将原本公共的小型启动/辅助模块合并到site-boot，减少逐文件gzip开销，保留原生及媒体动态边界；`includeDependenciesRecursively:false`不把延迟依赖拉入该组。入口导出使用allow-extension保留既有导出，完整MDX/媒体回归仍是交付必需检查。

`tests/paseo-csp.spec.ts`另需PASEO_CSP_URL（本机Worker）、PASEO_PAIRING_FILE及PASEO_RELAY_LOG（均为.scratch内私有路径）；AI准备，不打印配对值。测试关闭后才生成失败上下文，不保存配对trace。整页刷新可能没有Playwright旧socket关闭事件，因此同时要求daemon对应连接关闭，不能把旧观察对象当实际泄漏；随后核对新页面零新连接及展开恢复。

`tests/paseo-chat.spec.ts`的操作反馈组需`PASEO_MOCK_URL=http://localhost:4393`，由AI先准备固定源码编译的6793开发mock daemon（所有真实provider禁用）、`.scratch/paseo-webui/h-site`生产H站，再运行`node tests/fixtures/paseo-webui/mock-host.mjs`。该测试宿主保留产物CSP，将同源`/ws`转发给mock服务；原生会把127.0.0.1规范为localhost，因此页面也使用localhost。连接注册仅注入无密钥的夹具地址，不作为配对验收。用例在独立Git目录创建mock会话，只丢弃指定请求并断线，不伪造成功回执；检查原生提示和实际发送次数，结束时取消并归档夹具。此组验证协议与界面正确性，不计真实模型性能、子进程停止或最终恢复矩阵。

A1专项由AI完成生产构建后，以`PASEO_MOCK_PROFILE=A1 node tests/fixtures/paseo-webui/mock-host.mjs`启动4393，随后运行`PASEO_MOCK_PROFILE=A1 PASEO_MOCK_URL=http://localhost:4393 npx playwright test tests/paseo-features.spec.ts`。构建与消费同一产物的浏览器测试必须串行，避免严格构建器清除旧回执时破坏在测样本；A1和H不能同时占用4393。

A2以相同命令选择A2、输出`.scratch/paseo-webui/a2-site`，协议夹具也选择A2。`a2-panel-body.patch`保留同步注册、描述与原生上下文，仅在RetainedPanel激活时下载终端或FilePane；下载失败保留明确重试入口，成功模块共享，隐藏不重新下载。已加载实例仍由原生生命周期持有；当前不能把隐藏等同资源已卸载。测试夹具按自己创建的目录终止测试终端后再归档，不能清理其他目录。

A2的`h-native-types.patch`补足Web专用unmount的HTMLElement类型桥接，依据固定react-native-web实际接收DOM根节点；允许导入`.ts`扩展以保持共享契约源码一致，并具体声明测试mock签名。原生app完整tsgo检查通过；H/A1旧探针回执保持原样，不把本站检查冒称原生类型检查。

A3以相同命令选择A3、输出`.scratch/paseo-webui/a3-site`，协议夹具也选择A3。`a3-highlight-lazy.patch`将颜色/主题与语法定义分成轻量入口；轻量支持列表通过类型约束与原生语法映射保持一致。聊天代码和工具详情在可见、激活且内容稳定160ms后加载共享运行时；不支持的语言不请求语法。保留原有LRU、100000字符保护、diff的旧/新全文语法处理和复制规则，设置页预览也使用相同边界。

Expo默认把不同异步块的交集升为首开common资源，因此单加import不能实现这条边界。`a3-lazy-common-dependencies.patch`将纯异步交集保留为一个异步文件，由实际消费者的加载路径声明前置资源；原生加载器等全部定义到达后才执行目标模块。URL缓存、并发去重、失败清除及重试继续使用Expo自己的加载器。只允许修改清单中的两个精确依赖文件并核对前后摘要，退出后恢复；遇到worker入口明确拒绝该实验构建，不宣称支持未适配的worker拆包。升级时须重验序列化器和运行时这一配对，不能只更新一端。

`a2-editor-lifecycle.patch`以原生FileEditorModel为弱键，仅保存选择及CodeMirror滚动快照；不复制草稿、不增加持久存储。layout清理阶段在DOM移除前保存位置并destroy；同一导航请求重建时恢复，新文件行定位请求优先。文件模型仍负责自动保存及关闭时取消观察/定时器；终端仍由原生控制器释放订阅、监听和渲染器，不发送kill来清理网页。

A2/A3导出在精确补丁应用期间运行原生tsgo；A3还执行原生高亮、终端和文件模型测试，以及实际安装版Expo加载器的顺序、去重和失败重试检查。专项测试为paseo-features、paseo-resources和paseo-highlight；普通构建明确跳过未启用的实验。当前累计工程探针不直接作为冻结的单变量A1—A6消融样本，最终实验须按各自配置重新构建并匹配输入/回执。

A4以相同命令选择A4、输出`.scratch/paseo-webui/a4-site`。`a4-language-lazy.patch`让英文静态保留、八种翻译动态加载；加载器合并同语言并发请求，失败清除缓存，provider仅应用仍有效的选择；嵌入模式的系统语言取宿主中英文，未嵌入时使用设备语言。失败提示不卸载应用，保留英文缺词回退。`tests/paseo-language.spec.ts`覆盖实际九语言请求边界、首次与切换失败重试及迟到下载隔离。

`a4-common-consumers.patch`按模块的完整使用者集合拆分共享块，再根据同步依赖建立前置资源及传递闭包，避免语言切换顺带加载语法。运行固定版本序列化器及Chunk方法的`verify-native-chunk-groups.mjs`检查模块唯一归属、共享依赖传递和worker拒绝；生产浏览器额外验证语言不会请求语法资源。A4导出执行原生类型检查及144项单元测试，B中英精简及最终预算尚未完成。

固定上游客户端插件通过globalThis.eval执行clientBundle，当前直接挂载的生产CSP禁止该操作。A4实际最小插件在原生设置页显示该策略错误，证据为probe-mermaid/a4-plugin-csp-settings.log；测试插件已移除，隔离daemon插件开关已恢复。客户端插件界面尚不可用，独立来源嵌入与缩小能力范围待决定，不能以后台工具可用替代该验收。
