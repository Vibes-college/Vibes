---
id: 'blur'
title: '模糊'
english: 'Blur'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：滚动文字揭示',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/TextReveal.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 模糊 / Blur

把文字或图像的边缘变软，削弱细节的清晰程度。

## 常见变体

固定模糊、从模糊到清晰、从清晰到模糊。

## 适合用在哪里

弱化背景或突出少量视觉内容。

## 什么时候不用

重要文字不能长期模糊；大面积连续模糊需核对绘制成本。

## 提示词例子

```text
只给主视觉加入轻微模糊变化，正文始终清晰，减少动效时显示清晰终态。
```
