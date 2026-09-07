---
tense: 'frozen'
describes: '多媒体封面的技术决定'
status: 'complete'
amended-by: []
---

# 多媒体封面的实施计划

## 技术决定与职责

沿用Astro预生成页面、TypeScript、Pagefind及原生媒体元素；不新增npm依赖或默认远端服务。

- src/lib/media/schema.ts定义图片、视频、音频、embed、demo、chart区分联合；media清单、presentation引用及mediaText分语言说明在src/lib/content/schema.ts接入。src/lib/media/validate.ts核对引用、尺寸、字幕/章节、数据列及本地文件，src/lib/content/revision.ts包含媒体文字修订。
- src/config/media.ts管理允许的外部资源域与嵌入提供者；media资源路径只允许审核后的本地公开路径或精确HTTPS来源。src/lib/media/card.ts产出首页最小安全投影，不向搜索发送完整视频/图表数据。客户端不打包Zod。
- scripts/prepare-media.ts及media-tools.ts通过参数数组调用现有ffmpeg/ffprobe与Sharp；本地源文件只读，输出到独立public/media子目录，产出manifest.json、封面、尺寸版本、无声H.264短片、音频试听及PCM真实波形。显式运行，不在常规构建或CI实时转码。动画图片不进入静态图片压缩路径。
- src/components/MediaDetail.astro与src/lib/media/render.ts负责有尺寸的初始HTML。首页保持卡片外观，将真实导航链接与媒体控制做同级元素；详情原站入口保持独立。图库/多媒体使用按钮切换，图片放大使用原生dialog。
- src/scripts/media.ts统一初始化、观察器、短暂停留调度和销毁；搜索更新发出刷新事件，移除/隐藏卡片立即停止；onPageLoad与detail:page、visibilitychange/pagehide共同约束生命周期。
- src/scripts/media-player.ts负责原生音视频、延迟source、字幕、进度/章节与音频文字同步；src/scripts/media-experience.ts点击才加载iframe或登记组件；src/scripts/media-chart.ts以自有SVG加原生表单展现有限数据图表；src/scripts/media-demo.ts提供可调整/拖动的自制演示。异步回调核对连接、可见性与销毁信号。
- 提供真实YouTube、Spotify、游戏、论文、博客、X及yaoda作品，附原创正文和真实图像。图表使用R的Anscombe数值。2048官方站点拒绝嵌入，改为MIT源码沙盒版，源码计入媒体预算；不修改外站嵌入限制。

素材协议：共有id/kind/provenance；图片有src/width/height/variants/focalPoint/animated/posterId；视频有sources/duration/width/height/hasAudio/posterId/captions/chapters；音频有sources/duration/artworkId/waveform/captions/chapters/transcript；embed限定平台配置；demo限定注册组件及参数；chart有列/单位、数据地址、映射、系列/范围筛选、日期和来源定位。mediaText按素材ID维护alt/caption/title/hint/context等语言说明。图表数据和演示代码只在启动后下载。

## 宪章检查与预算

需求与六类路径已由用户确认。保留既有UI、全文搜索、双语和无JS阅读；不开放编辑投稿。FR014将原先禁止媒体的规则改为有来源校验的按需媒体，不扩大执行权限。原21KB公共JS、40KB首页、12KB Explore源文件与200KiB图片门槛保持；卡片视频<=1MiB/12秒，试听<=512KiB/30秒，交互数据<=128KiB/2000行，完整本地媒体遵守Cloudflare单文件25MiB。每张卡片最小投影不携带完整素材列表。

手机<=1、桌面<=2自动动态预览，有声内容同时<=1；选择窗口内可见停留200ms再启动，减少动态/省流量不自动播放。时间性能记录实测，不以工具耗时冒充首屏指标。无iPhone连接时保留真机待测，不把WebKit模拟声称为真机验证。

## 验证与交付

单元测试先覆盖联合类型、来源拒绝、错误引用、字幕/章节范围、素材处理与搜索安全投影。Playwright验证六类媒体、网络加载边界、焦点/手势、后台/离屏/导航清理、异常重试、无JS、搜索与双语。验证命令verify与budget，内置浏览器作真实视觉/交互审阅；原始证据放resources/evidence/010-media-previews。

功能文档沿已有四条路径同步，系统数据/媒体规则/Markdown边界/交付命令同步；人工核对文字后刷新源码摘要。预览使用release:preview，不提升正式版本。用户授权前不合并，真机待测单独记录。

## PR工作台与经验复核

同一PR #9按三个阶段维护tasks、进度和证据。落实异步取消、连续导航和详情手势隔离；保留现有单worker本地回归，服务启动前核对所有者。实现完成不等于合并/部署。
