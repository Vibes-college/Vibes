---
tense: 'living'
describes: '功能名：搜索与分类筛选'
status: 'current'
shaped-by: []
---

# 搜索与分类筛选

## 当前行为

首页点击Papers得到4条，输入LoRA缩为1条；q/type写入网址，刷新及从文章返回保留条件。无结果有提示，Clear search & filters恢复24条；搜索框×只清搜索词，保留分类。

英文不区分大小写，空格分隔词须同时匹配，最多160字符。只搜索已加载卡片标题、作者和简介，不搜正文；依赖JS，无后端搜索。

## 文件与依赖

src/scripts/explore.ts、src/components/Explore.astro、src/layouts/Layout.astro、src/data/works.ts。依赖 [目录](explore-browse.md)。

## 验收与测试

验证筛选4→1、刷新/返回保持、空结果/清除恢复、×保留分类及多词匹配。tests/explore.spec.ts前两个测试覆盖主流程；×和多词暂无专门自动断言，需手动验收。
