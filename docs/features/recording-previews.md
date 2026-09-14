---
tense: 'living'
describes: '录制原作交互并交付可播放的本地演示'
status: 'current'
shaped-by: ['018']
code-sources:
  [
    'src/features/great-ui/data/local-recordings.json',
    'src/features/great-ui/Recording.jsx',
    'tests/unit/great-ui-content.test.ts',
    'tests/great-ui/learning.spec.ts',
  ]
code-revision: '1ce98e4d7d57839cfeee30c55685c77a2dee74096dfdd0664bf1ffd77807d4ba'
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

2026-09-14的11段Great UI录屏使用下表。每段约7秒；录制仍按真实时间进行。较快是因为各段只展示关键动作，并复用同一套捕获、编码和检查过程。

| 项目     | 使用值与含义                                                           |
| -------- | ---------------------------------------------------------------------- |
| 浏览器   | Codex内置浏览器，原作公开交互页面                                      |
| 布局视口 | 1280×720；截图流限制最大1280×720，实际像素需另核对                     |
| 捕获     | JPEG，quality=82，everyNthFrame=1                                      |
| 帧取样   | 接收实际帧，以时间戳间隔至少1/24秒取样；不是承诺每秒捕获到24个不同画面 |
| 输出     | 24fps、H.264、yuv420p、无音轨、faststart                               |
| 时长     | 约7秒，按动作需要调整；不能截掉结果或留下长时间空白                    |
| 证据     | 原作地址、时间、动作、原始帧与时间戳、输出文件大小及SHA-256            |

先按当前浏览器工具文档取得当前标签页和CDP能力，不保存或复用旧的标签页ID。关键调用如下：

```javascript
await cdp.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 82,
  maxWidth: 1280,
  maxHeight: 720,
  everyNthFrame: 1,
});
// 循环读取Page.screencastFrame，保存选中的帧和metadata.timestamp。
// 每个收到的帧都要确认，包括没有保存的帧：
await cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
// 结束或出错时停止，放在清理路径中，避免遗留截图流：
await cdp.send('Page.stopScreencast');
```

本次循环通过CDP能力的`readEvents`读取`Page.screencastFrame`，记录并推进事件游标，每批最多100条、等待上限80ms。帧的`data`为base64 JPEG；保存为连续编号文件，并保留原始时间戳。动作在同一个循环中按已观察的控件执行，例如第1秒点击一次、第3.5秒点击另一个方向。不能只保存首尾两帧后声称录下了过渡过程。

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

下面是本次实测的编码参数。`capture/frames.ffconcat`和`output/demo.mp4`是示例路径，先创建输出目录并换成当前案例路径；已有输出保留，使用新文件名。

```sh
ffmpeg -n -safe 0 -i capture/frames.ffconcat \
  -vf 'crop=1248:560:16:84,scale=960:-2' \
  -r 24 -fps_mode cfr -c:v libx264 -preset medium -crf 27 \
  -pix_fmt yuv420p -an -movflags +faststart output/demo.mp4

ffmpeg -n -ss 3.5 -i output/demo.mp4 \
  -frames:v 1 -q:v 3 output/poster.jpg

ffprobe -v error -show_entries stream=codec_name,width,height,pix_fmt \
  -show_entries format=duration,size -of json output/demo.mp4
```

裁切值只适用于本次原作布局，不能作为所有页面的固定值。先检查帧尺寸、效果覆盖范围和按钮位置；滚动文字与页面级主题过渡尤其不能裁掉关键部分。宽高需适合yuv420p；`scale=960:-2`自动计算偶数高度。`faststart`将播放所需索引放在文件前部，便于尽早播放。海报时间选择实际有内容的一帧，不能统一取开头的空白。

本机FFmpeg没有可用的WebP编码器，本次海报使用JPEG。使用什么格式以已安装工具和实际画质为准，不为了沿用文件后缀假造格式。本次本地工作台的媒体预算为总计2MiB、单文件400KiB；这是该入口的预算，不是以后所有视频的通用上限。正式站已有素材可用`npm run media:prepare`处理，命令见[内容维护](content-maintenance.md)；不要把它和浏览器录制当作同一步。

## 来源记录与播放检查

Great UI的已保存素材位于src/features/great-ui/media/；data/local-recordings.json记录每件原作地址、recordedAt、actions、durationSeconds、sourceFrames，以及视频和海报的path、bytes、sha256。content-build.mjs让页面使用对应本地文件，相关单元测试核对摘要。其他内容接入正式站时按[媒体数据结构](../system/content-model.md#多媒体资料与展示)登记，不再建立第二份没有来源的文件表。

- 原作线上页面不能证明其部署的源码版本。源码核对版本与页面录制日期分别保存；注明这是“本地录制原作交互”，不能标为作者原有MP4。
- 检查实际尺寸、总时长和关键过程的连续画面，再在真实页面中确认`videoWidth > 0`、`readyState >= 2`、无媒体错误、`currentTime`推进且确实播放。还要检查暂停、离屏暂停和减少动态效果。
- HTTP 200只证明收到响应；替换视频的测试只证明播放器逻辑。两者都不能代替真实媒体解码与播放检查。静态预览图保持图片，检查解码尺寸，不伪装为录屏。
- 原始帧、录制时间线和验收截图放resources/evidence中的当前任务目录；临时转码文件放.scratch。录制时不要带入账号秘密、聊天或无关窗口。
- 遇到403、429、登录或访问限制，不通过换参数、账号、代理或连续重试获取受限素材。原作公开交互仍可正常访问时，可以在许可范围内操作并独立录制；没有可用原作时保留缺口。

2026-09-14的实现回执在resources/evidence/018-great-ui-scale：11段新本地视频及海报已逐件核对摘要；live-media-playback.json记录实际工作台的46段MP4和2张图片检查通过。该结果仅代表当次检查，不保证外部媒体持续可用。

## 已知问题 / 待办

### 媒体稳定性

核心预览不能长期依赖不可控的原作者媒体直链。允许保存与展示的关键演示优先使用我们维护的短片和海报，保留原作链接用于溯源；正常打开仍直接播放，海报只用于加载或异常回退，不增加启动卡片。

当前Great UI仍有32段MP4和2张预览图依赖作者地址，尚未全部迁移。外部平台的嵌入也不等于永久可用：X官方说明，帖子被删除、转为受保护或账号被停用后，嵌入中的媒体不会继续加载，见[X嵌入说明](https://help.x.com/en/using-x/how-to-embed-a-post)。不能仅因平台较大就把它作为核心演示的唯一来源。

后续大量媒体的托管方式需要在正式接入时确定。本机文件不会自动成为线上资产；可以先随本站部署短片，规模增加后再使用自有媒体存储。若选Cloudflare R2，生产访问使用自定义域名并配置缓存；官方明确r2.dev开发地址有限流且不用于生产，见[R2公开访问](https://developers.cloudflare.com/r2/buckets/public-buckets/)。本说明没有创建存储服务或发布任何页面。

## 涉及的文件

- src/features/great-ui/media/：已交付的本地MP4与海报；data/local-recordings.json保存录制来源和摘要。
- src/features/great-ui/content-build.mjs与Recording.jsx：将当前媒体接到工作台播放器。
- scripts/prepare-media.ts与media-tools.ts：正式站已有本地媒体转码工具，不负责打开浏览器录制。
- resources/evidence/018-great-ui-scale/：最近一次录制和实际播放证据；本地原始证据不随网站发布。

## 验收标准

- [x] 2026-09-14在内置浏览器录制11件真实原作交互，生成本地MP4与海报，文件摘要检查通过。
- [x] 同日真实工作台的46段MP4解码并播放、2张图片正常；专用浏览器用例核对11个本地替代素材不再请求作者视频。
- [x] 同日桌面与手机模拟浏览器的自动播放和交互检查通过；内置浏览器确认本地字符画录屏播放。不是实际手机验收。
- [ ] 其余32段作者MP4与2张作者图片迁移到自有托管；尚未执行。

## 对应的自动化测试

- tests/unit/great-ui-content.test.ts：本地替代录屏与来源、文件大小及SHA-256一致，不再指向失效作者地址。
- tests/great-ui/learning.spec.ts：本地替代录屏实际解码并自动播放、不请求外部媒体；其余使用请求替身的用例只验证交互逻辑。
- 连续画面、合适的裁切和效果呈现仍需人工视觉核对；目前没有通用录制CLI，不能把文档参数当成已实现的新命令。

## 依赖的其他功能

[学习工作台](great-ui-learning.md)使用现有录屏；正式站媒体使用[内容维护](content-maintenance.md)的结构与交付流程。
