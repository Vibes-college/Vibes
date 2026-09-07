---
tense: 'frozen'
describes: '分章评价实施方案'
status: 'complete'
amended-by: []
---

# 实施方案

SectionReaction.astro渲染紧靠标题的微型按钮。section-reactions.ts负责单例工具条、位置、输入与本地持久化；粒子通过CSS/WAAPI绘制，静止时不保留帧循环。detail.ts复用接近正文的初始化入口，reaction-entry.ts负责正文空闲预加载与提前点击加载，首页不加载评价模块。

按钮采用参考中的微笑加号SVG资源；表情使用系统emoji，不引入整份emoji字典、图片下载或新字体。iPhone使用系统Apple表情，其他系统按自己的emoji字体渲染。少量变体只影响图形外观，不影响动作节奏。

保留正常标题h2，在其外层定位角标按钮，共享popover脱离正文裁切；选择按作品locale路径+标题id保存。尊重减少动态偏好，退出页面清理。用现有Playwright与内置浏览器验证，保留原有读取路径与Safari修复。

## 交付

继续当前详情页PR #6的未合并体验批次，007是独立规格，006记录前序阅读行为。同步article-read、相关系统说明及源码对应；性能预算以实测判断，Cloudflare阶段预览给用户试用。
