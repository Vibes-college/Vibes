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
    'third_party/paseo-webui/',
  ]
code-revision: '9f8b54b443ff7b3b91c8462a244c3fa848d08e5260789ab39c827febef177ad2'
---

# 原生Paseo嵌入边界

用户操作和有效验收见[本地助手](../features/local-assistant.md)。当前H是固定0.7.2的完整WebUI嵌入实验，尚未做A/B外围拆包选择；不能作为正式发布配置。

## 构建与资源

先按[检查与发布](checks-and-release.md#paseo实验构建边界)准备已授权上游依赖及固定源码，再运行：

```sh
node --experimental-strip-types scripts/paseo-webui-build.ts H
VIBES_PASEO_PROFILE=H VIBES_OUT_DIR=.scratch/paseo-webui/h-site npm run build
```

未设`VIBES_PASEO_PROFILE`时Astro在构建图形成前将入口替换为空组件，不输出助手客户端chunk、入口或原生资源；仅在页面条件中不渲染组件仍会遗留chunk，因此不能作为构建排除。H必须显式指定`.scratch/`内输出，发布模式VIBES_DEPLOY=1及其他配置拒绝。构建期间`build-config.ts`核对固定提交、锁文件、完整source/dependency补丁记录、摘要前缀及每个声明资源的大小、哈希和真实路径；不接受符号链接或越界路径。页面只接受一个入口JS及最多20项CSS，路径必须属于同一16位摘要前缀，携带SHA256完整性值。未知字段不向运行时复制。

原生补丁为Metro设置`/vendor/paseo/{摘要}`前缀；摘要来自固定提交、H配置与补丁清单。Astro完成后`paseo-webui-assets.ts`将声明资源及Paseo许可、第三方许可说明复制到该前缀。H使用完整原生产物。脚本预算从已核验清单读取全部原生JS，宿主仅允许动态加载；静态引用/预加载原生入口、漏列脚本或摘要改变都失败，共享宿主依赖保留在公共预算。首次打开暂以全部原生JS加宿主独有依赖作保守上界，不能据此宣称拆包收益；冻结目标来自budget-baseline.json，H目前不满足最终门槛。最终不可变缓存发布验收仍未完成。隔离daemon托管H测试站时不自动应用Cloudflare的`_headers`，不能据此声称正式CSP已通过。

## 加载与长期实例

轻量`paseo-boot.ts`只在按钮点击后动态导入host。host先建立原生环境，再并行下载SRI脚本和CSS；全部资源成功后调用原生mount。并发调用共享Promise，成功资源不重复下载，失败资源才清除缓存后重试。脚本执行完却没有合法mount，或mount失败，要求整页刷新；30秒未完成提供刷新入口，不另开第二实例。

H在G1直接挂载适配上增加契约和presentation边界；保留上游根providers、独立React运行时、HostRuntime、SessionProvider及原生页面路由。宿主不实现第二套聊天或任意RPC；契约字段见[接口](interfaces.md#paseo宿主契约)。公开草稿命令类型已定义，实际composer接入未完成。

容器跨Astro页面持久化；原生React Native、Unistyles和Reanimated的具名样式节点及CSS链接同样保留。原生history使用内部路由，不改变Explore的地址。收起、导航不dispose；退出命令最终整页刷新，网页内单例、监听器与连接随文档销毁，不删除设备。

## 焦点、页面状态与存储

宿主分别传递面板可见、原生区域有焦点、网页在前台三个信号；ResizeObserver只采用非零容器尺寸，收起不把原生宽高压成0。原生浏览器焦点通知来自宿主订阅，键盘处理以原生区域焦点为边界；收起不把后台同步伪装成用户停止。

配对和存储由上游持有；同源隔离daemon提供的初始连接信息由原生流程处理。宿主不复制设备注册、密钥、聊天记录或权限内容，不把它们送入站点URL。当前退出回归只比较设备registry摘要，不能替代IndexedDB副本、忘记设备、迟到事件及恢复矩阵的完整验证。真正停止、断开、忘记需分别通过原生操作，不能混作“关闭面板”。

## 测试与限制

`PASEO_HOST_URL=http://127.0.0.1:6792 npx playwright test tests/paseo-loading.spec.ts`要求已由AI准备的H本地站及同版daemon；只接受本机地址，未指定明确跳过。测试使用实际生产资源，记录请求、挂载及连接计数；离线和404为受控浏览器故障。真实浏览器截图与本地原始日志存host/证据目录，性能统计另按冻结实验执行。

当前未通过正式中继/CSP、最终资源门槛、完整恢复、真机或上线验收。完整原生语音与外围入口仍需按A/B能力矩阵验证，不能以显示按钮证明可用。

Astro客户端将原本公共的小型启动/辅助模块合并到site-boot，减少逐文件gzip开销，保留原生及媒体动态边界；`includeDependenciesRecursively:false`不把延迟依赖拉入该组。入口导出使用allow-extension保留既有导出，完整MDX/媒体回归仍是交付必需检查。
