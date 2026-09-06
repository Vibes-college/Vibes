---
tense: 'living'
describes: '搜索与分类筛选'
status: 'current'
shaped-by: ['001']
---

# 搜索与分类筛选

## 当前行为

分类进入`/{locale}/tags/{tagId}/`，关键词写入q参数；旧type参数转换为分类路径。搜索框×只清关键词，保留分类；空结果按钮清除关键词和分类。刷新、浏览器返回及同标签页详情的Explore返回保留搜索位置。

Pagefind搜索整个语言的已发布标题、简介、正文及标签，分类取交集；列表DOM不保存全量内容。首次聚焦或带q链接才加载搜索模块/索引，普通首页不预加载。关键词最多160字符，输入延迟150ms；结果每批24项，点击加载更多。加载、无结果、失败和重试均有提示；15秒超时显示失败，索引/分片失败的显式重试重建搜索实例；搜索程序下载失败则保留q重新加载页面，清除浏览器缓存的模块失败；过期结果不覆盖新查询。

## 文件与依赖

src/scripts/explore.ts处理界面，src/scripts/search.ts加载和查询Pagefind，src/components/Explore.astro提供列表；src/lib/i18n提供路径与文案。依赖[目录](explore-browse.md)、[内容维护](content-maintenance.md)。

## 验收与限制

2026-09-05本地Playwright桌面/手机通过分类4→1、刷新、正文独有词搜索、返回恢复、失败重试、清空以及无意图时零Pagefind请求；tests/explore.spec.ts。搜索需要JavaScript。中文索引不做词干还原；真实大语料性能以规模报告为准。
