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
    'third_party/paseo-webui/',
  ]
code-revision: 'e46ee60d1ae10ec6c068bbe93d3102e69e5ec32c7e146d45e5eaf50cc7bf8964'
---

# 原生Paseo嵌入边界

用户操作和有效验收见[本地助手](../features/local-assistant.md)。当前H是固定0.7.2的完整WebUI嵌入实验，A1仅在此基础上验证Mermaid按需加载；尚未完成A/B选择，二者都不是正式发布配置。

## 构建与资源

先按[检查与发布](checks-and-release.md#paseo实验构建边界)准备已授权上游依赖及固定源码，再运行：

```sh
node --experimental-strip-types scripts/paseo-webui-build.ts H
SITE_URL=https://vibes.college VIBES_PASEO_PROFILE=H VIBES_OUT_DIR=.scratch/paseo-webui/h-site npm run build
```

未设`VIBES_PASEO_PROFILE`时Astro在构建图形成前将入口替换为空组件，不输出助手客户端chunk、入口或原生资源；仅在页面条件中不渲染组件仍会遗留chunk，因此不能作为构建排除。H和A1必须显式指定`.scratch/`内输出，发布模式VIBES_DEPLOY=1及其他配置拒绝。构建期间`build-config.ts`核对固定提交、锁文件、完整source/dependency补丁记录、摘要前缀及每个声明资源的大小、哈希和真实路径；不接受符号链接或越界路径。页面只接受一个入口JS及最多20项CSS，路径必须属于同一16位摘要前缀，携带SHA256完整性值。未知字段不向运行时复制。

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
