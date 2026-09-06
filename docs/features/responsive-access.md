---
tense: 'living'
describes: '功能名：手机阅读与基础键盘操作'
status: 'current'
shaped-by: []
---

# 手机阅读与基础键盘操作

## 当前行为

同一页面适配手机与电脑；320px目录及文章不使整页横向滚动，宽表格在自身区域滚动。简介两行，Tab焦点可见，Skip to content跳到主内容。

详情手机先概览后折叠正文，桌面顺序相同且最大宽780px；按钮/左右键/触摸切换相邻作品。根语言标记英文，正文局部中文，界面混用中英。基础语义不等于无障碍认证。

## 文件与依赖

src/styles/global.css、base.css、cards.css、article.css、responsive.css、detail.css；src/layouts/Layout.astro、src/scripts/detail.ts。依赖 [目录](explore-browse.md) 和 [详情](article-read.md)。

## 验收与测试

tests/explore.spec.ts检查320px列表和详情、溢出、嵌入、简介及Chromium触摸横滑。键盘完整路径及读屏暂无专门自动测试，设备覆盖需明确人工验收范围。
