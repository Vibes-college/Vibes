---
tense: 'living'
describes: '录制原作交互并交付可播放的本地演示'
status: 'current'
shaped-by: ['018']
code-sources:
  [
    'src/features/great-ui/data/local-recordings.json',
    'src/features/great-ui/Recording.jsx',
    'src/features/great-ui/useRecordingView.js',
    'tests/great-ui-previews.spec.ts',
    'tests/unit/great-ui-content.test.ts',
    'tests/great-ui/learning.spec.ts',
  ]
code-revision: '8c7008e0bf36d9484dc42373bb3ec571bd7f63e11a7027060eb4d8d819c1aa38'
---

# 功能名：录制与维护交互演示

## 一句话说明

维护者打开原作、实际操作、录下关键过程，再把短片和来源记录交给页面使用。这个流程已用于[Great UI学习工作台](great-ui-learning.md)；它保存实际画面，不靠下载原作者的视频来生成录屏。

## 用户操作路径

1. **选定动作。** 先查看页面，确定要展示的初始状态、一次关键操作和结果。例如“悬停图像→变为字符画→移出恢复”，或“点击主题按钮→过渡→新主题稳定”。来源页、许可和是否允许公开使用分别核对；录屏不会自动获得再发布授权。
2. **准备画面。** 用自己的临时浏览器标签页，等待字体、图片和交互就绪，关闭无关面板。滚动案例先调整到效果即将进入画面的位置。核对实际视口和截图尺寸，不能只凭设置调用成功判断大小。
3. **开始录制。** 通过内置浏览器提供的CDP能力启动`Page.startScreencast`，接收截图帧。录制期间点击、悬停或滚动原作的实际控件；选择器和坐标必须来自当次页面观察，不照搬其他案例。
4. **停止并转码。** 停止截图流，按帧时间戳生成时间线；裁去页面工具栏等无关区域，编码为静音H.264 MP4，并从有代表性的画面生成海报。
5. **接入并验收。** 登记文件与来源，把视频接到真实播放器；检查自动播放、暂停、进度、放大、手机尺寸和失败反馈，再保存证据。最后关闭录制标签页，恢复改变过的视口和网络设置。

```mermaid
flowchart LR
  A[观察原作与确定动作] --> B[录制真实浏览器画面]
  B --> C[按时间戳编码MP4与海报]
  C --> D[登记来源与文件摘要]
  D --> E[在实际页面播放与检查]
```

## 已实测的捕获参数

48件Great UI均保留连续原始帧和时间线。桌面与手机先分别观察；30件另录手机构图，其余使用完整桌面构图，来源记录说明复用理由。消息、滚动与模拟部署按实际动作延长，不能为统一时长裁断过程。

| 项目     | 使用值与含义                                                               |
| -------- | -------------------------------------------------------------------------- |
| 浏览器   | Codex内置浏览器，原作公开交互页面                                          |
| 布局视口 | 桌面1280×720或900高；手机390×844，长列表可用1000高；DPR 2                  |
| 捕获     | JPEG，quality=95，everyNthFrame=1，最大3000像素                            |
| 帧取样   | 接收实际帧，以时间戳间隔至少1/30秒取样；不是承诺每秒捕获到30个不同画面     |
| 输出     | 高清30fps、H.264、4:2:0（可含全范围yuvj420p）、方形像素、无音轨、faststart |
| 时长     | 高清按动作保留完整过程（上限60秒）；封面至多12秒                           |
| 证据     | 原作地址、时间、动作、原始帧与时间戳、输出文件大小及SHA-256                |

先按当前浏览器工具文档取得当前标签页和CDP能力，不保存或复用旧的标签页ID。关键调用如下：

```javascript
await cdp.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 95,
  maxWidth: 3000,
  maxHeight: 3000,
  everyNthFrame: 1,
});
// 循环读取Page.screencastFrame，保存选中的帧和metadata.timestamp。
// 每个收到的帧都要确认，包括没有保存的帧：
await cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
// 结束或出错时停止，放在清理路径中，避免遗留截图流：
await cdp.send('Page.stopScreencast');
```

捕获循环通过CDP能力的`readEvents`读取`Page.screencastFrame`，记录并推进事件游标，每批最多100条、等待上限30ms。帧的`data`为base64 JPEG；保存为连续编号文件，并保留原始时间戳。动作在同一个循环中按已观察的控件执行，例如第1秒点击一次、第3.5秒点击另一个方向。不能只保存首尾两帧后声称录下了过渡过程。

页面不持续重绘时，帧数可能很少。编码时必须保留相邻帧的真实时间差，不能直接把文件序列按固定帧率拼起来，否则会改变原作速度。`Page.startScreencast`并非带音频的系统录屏；需要讲解或原声音轨时另选录音流程。

## 转码、海报与大小

把保存帧写成FFmpeg concat清单，文件顺序对应帧时间顺序；每个`duration`是下一帧时间减去当前帧时间，最后一帧延续到录制结束，并在清单末尾再列一次最后的文件。例如：

```text
ffconcat version 1.0
file '00000.jpg'
duration 0.050
file '00001.jpg'
duration 0.042
file '00002.jpg'
duration 0.500
file '00002.jpg'
```

下面是高清素材的编码示例。`capture/frames.ffconcat`和`output/demo.mp4`是示例路径，先创建输出目录并换成当前案例路径；已有输出保留，使用新文件名。

```sh
ffmpeg -n -safe 0 -i capture/frames.ffconcat \
  -vf 'crop=2304:1084:128:196,scale=1920:-2,setsar=1' \
  -r 30 -fps_mode cfr -c:v libx264 -preset medium -crf 18 \
  -pix_fmt yuv420p -an -movflags +faststart output/demo.mp4

ffmpeg -n -ss 3.5 -i output/demo.mp4 \
  -frames:v 1 -q:v 3 output/poster.jpg

ffprobe -v error -show_entries stream=codec_name,width,height,pix_fmt \
  -show_entries format=duration,size -of json output/demo.mp4
```

裁切值只适用于本次原作布局，不能作为所有页面的固定值。先检查帧尺寸、效果覆盖范围和按钮位置；滚动文字与页面级主题过渡尤其不能裁掉关键部分。宽高需适合yuv420p；`scale=1920:-2`自动计算偶数高度，最后的`setsar=1`保证浏览器显示尺寸与记录一致。`faststart`将播放所需索引放在文件前部，便于尽早播放。海报时间选择实际有内容的一帧，不能统一取开头的空白。

高清素材默认CRF 18，复杂画面按清晰度与体积调整并逐件登记。轻量封面从已编码高清素材裁切片段，宽度不超过480像素，按实际内容调整帧率与质量。海报使用JPEG，选已展示关键内容的帧，避免空白或整屏遮罩。Great UI全套素材预算48MiB，单高清视频2MiB、单封面短片150KiB、封面短片总计4MiB、单海报200KiB。这是48件素材的存储约束；合集只取当前轻量短片，详情只取一份对应高清素材，普通首页脚本预算保持原上限。正式站已有素材可用`npm run media:prepare`处理，命令见[内容维护](content-maintenance.md)；不要把它和浏览器录制当作同一步。

## 来源记录与播放检查

Great UI素材位于public/great-ui/media/；data/local-recordings.json记录48件的原作地址、日期、录制方式、时长，以及视频和海报的path、bytes、sha256。renditions中的desktop、可选mobile与card分别保存实际宽高、时长、文件摘要和编码设置；捕获项另存原始时间线路径及摘要、视口像素、裁切、取景理由与实际动作。card来源指向对应高清素材及起点/时长。手机复用桌面时不伪造独立手机捕获。work.json中的learning.media指向本站路径，Markdown读取模块让站内与独立页面使用同一素材，单元测试核对摘要。其他内容接入正式站时按[媒体数据结构](../system/content-model.md#多媒体资料与展示)登记，不再建立第二份没有来源的文件表。

- 原作线上页面不能证明其部署的源码版本。源码核对版本与页面录制日期分别保存；注明这是“本地录制原作交互”，不能标为作者原有MP4。
- 检查实际尺寸、总时长和关键过程的连续画面，再在真实页面中确认`videoWidth > 0`、`readyState >= 2`、无媒体错误、`currentTime`推进且确实播放。还要检查暂停、离屏暂停和减少动态效果。
- HTTP 200只证明收到响应；替换视频的测试只证明播放器逻辑。两者都不能代替真实媒体解码与播放检查。静态预览图保持图片，检查解码尺寸，不伪装为录屏。
- 原始帧、录制时间线和验收截图放resources/evidence中的当前任务目录；临时转码文件放.scratch。录制时不要带入账号秘密、聊天或无关窗口。
- 遇到403、429、登录或访问限制，不通过换参数、账号、代理或连续重试获取受限素材。原作公开交互仍可正常访问时，可以在许可范围内操作并独立录制；没有可用原作时保留缺口。

当前48件高清与封面来源在resources/evidence/018-great-ui-scale/clear-recordings，包含逐件原始帧、时间线及参数；素材摘要已核对，完整播放验收见下方。社交卡片、顶部菜单与设备模型分别检查取景，模拟部署录到原作预设的失败结果；不把该动画描述为真实部署。图片揭示与头像组虽然原作者目录仅提供静态图，原作有实际悬停交互，本站使用独立录制的视频。

## 已知问题 / 待办

### 媒体稳定性

核心预览不能长期依赖不可控的原作者媒体直链。允许保存与展示的关键演示优先使用我们维护的短片和海报，保留原作链接用于溯源；正常打开仍直接播放，海报只用于加载或异常回退，不增加启动卡片。

当前Great UI的48件核心预览均使用本站文件，原作者直链仅保留在历史来源目录，不再作为页面播放地址。外部平台的嵌入也不等于永久可用：X官方说明，帖子被删除、转为受保护或账号被停用后，嵌入中的媒体不会继续加载，见[X嵌入说明](https://help.x.com/en/using-x/how-to-embed-a-post)。不能仅因平台较大就把它作为核心演示的唯一来源。

当前短片随本站静态产物交付，浏览器和Agent任务都使用本站地址；规模增加后再评估独立媒体存储。若选Cloudflare R2，生产访问使用自定义域名并配置缓存；官方明确r2.dev开发地址有限流且不用于生产，见[R2公开访问](https://developers.cloudflare.com/r2/buckets/public-buckets/)。当前不需要独立存储服务。

## 涉及的文件

- public/great-ui/media/：随站交付的MP4与海报；data/local-recordings.json保存录制来源和摘要。
- src/features/great-ui/markdown-content.ts、content-build.mjs与Recording.jsx：将同一份媒体接到站内和工作台播放器。
- scripts/prepare-media.ts与media-tools.ts：正式站已有本地媒体转码工具，不负责打开浏览器录制。
- resources/evidence/018-great-ui-scale/：最近一次录制和实际播放证据；本地原始证据不随网站发布。

## 验收标准

- [x] 2026-09-15完成48件高清与轻量短片、30件独立窄屏版本和海报；全部保留连续帧及参数，逐件来源与文件摘要检查通过。
- [x] 2026-09-14三类样板桌面Chromium、手机Chromium/WebKit共21项通过，包含播放、有效放大、拖动、焦点及按需请求；这不替代批量素材后的整体验收。
- [x] 2026-09-15独立入口69项通过，覆盖三浏览器48件真实播放；126个独立MP4完整解码通过。定位与旋转修复后，本机媒体专项40项通过、2项设备跳过，Linux WebKit另有9项媒体专项通过；正式CI全套待验收。
- [ ] 当前实现的正式站完整回归与site回执待复验。2026-09-15修复前本机340项通过、11项设备跳过；Linux CI仍有WebKit错误。此前Cloudflare预览与内置浏览器的桌面/390px手机操作证据保留，非真机验收。
- [x] 其余32段视频与两件图片案例均已独立录制并接到本站；没有下载或代理受限作者视频。

## 对应的自动化测试

- tests/unit/great-ui-content.test.ts：48件录屏与来源、文件大小及SHA-256一致。
- tests/great-ui/learning.spec.ts与tests/great-ui-site.spec.ts：分别检查独立和站内48件真实文件解码、播放与来源；媒体替身只能验证播放器逻辑，不代替实际素材验收。
- 连续画面、合适的裁切和效果呈现仍需人工视觉核对；目前没有通用录制CLI，不能把文档参数当成已实现的新命令。

## 依赖的其他功能

[学习工作台](great-ui-learning.md)使用现有录屏；正式站媒体使用[内容维护](content-maintenance.md)的结构与交付流程。
