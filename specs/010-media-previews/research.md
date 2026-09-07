---
tense: 'frozen'
describes: '媒体生命周期与处理取舍'
status: 'complete'
amended-by: []
---

# 媒体生命周期与处理取舍

## 浏览器中的展示与下载

决定：原生video/audio，延迟赋值source；200ms可见停留，手机1个/桌面2个自动预览，播放承诺在页面离开后不能重启。静音加playsinline，点击同步调用有声播放；不等待canplaythrough再调用。播放器失败保持海报和按钮，离屏暂停、销毁时移除source。

理由：preload只是提示，单靠它不能保证零请求；本地播放管理可以覆盖Astro连续导航与隐藏封面。替代方案：全卡片播放器或统一重型框架会增加首屏与解码资源，不采纳。

来源：[WebKit播放策略](https://webkit.org/blog/6784/new-video-policies-for-ios/)、[原生视频](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video)。历史策略仅说明设计基础，实际iPhone需另验收。

## 素材处理与预算

决定：复用已安装ffmpeg/ffprobe及Sharp，使用参数数组与本地输入，视频生成H.264/yuv420p/faststart无音轨独立预览。音频解码PCM计算峰值波形；不在浏览器下载整曲计算。版本、清单与来源受Git管理，原始大文件可放resources不提交。

理由：机器已安装工具，不新增依赖；构建不应隐式下载或转码。现有optimize-images默认单帧Sharp路径可能使动画WebP静态化，需识别pages并保持或明确拒绝超预算动画，不能静默静态化。替代方案：先部署转码服务不符合当前规模。

来源：[ffprobe](https://ffmpeg.org/ffprobe.html)、[MP4 faststart](https://ffmpeg.org/ffmpeg-formats.html#mov_002c-mp4_002c-ismv)。新增预算为本项目设计值，不是网页测量结果。

## 外部嵌入与存储

决定：登记平台只在点击后创建iframe，限制frame-src与权限；退出移除。组件按固定ID导入，不接受任意代码。iframe load不等于内容成功，保持原站入口与手动失败退出。

理由：对方frame-ancestors/X-Frame-Options可能拒绝嵌入，父页面无法可靠探测所有跨域错误。不绕过对方限制。小型素材先沿用Workers静态文件；数据协议允许审核HTTPS来源。规模增长再选R2自定义域/Stream，不默认创建远端资源。

来源：[iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)、[R2公共桶](https://developers.cloudflare.com/r2/buckets/public-buckets/)、[Stream](https://developers.cloudflare.com/stream/)。R2不自动转码，r2.dev不用于生产。
