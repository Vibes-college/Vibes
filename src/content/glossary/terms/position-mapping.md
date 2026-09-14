---
id: 'position-mapping'
title: '位置映射'
english: 'Position mapping'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：GitHub 贡献悬浮卡',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/GithubCard.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 位置映射 / Position mapping

把指针在某个区域里的位置转换为角度、位移等反馈值。

## 常见变体

位置映射为倾斜、位移、光照中心。

## 适合用在哪里

卡片反馈、指针光晕和局部互动。

## 什么时候不用

不能默认键盘与触屏存在持续的光标位置。

## 提示词例子

```text
将指针相对卡片中心的位置映射为小角度倾斜，限制最大值，离开时回到中性状态。
```
