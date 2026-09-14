---
id: 'luminance-mapping'
title: '亮度映射'
english: 'Luminance mapping'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：从图像变成字符画',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/PixelToAsciiImage.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 亮度映射 / Luminance mapping

把图像区域的明暗换成疏密不同的字符，以字符保留原图轮廓。

## 常见变体

亮度到字符密度、灰度级到字符表。

## 适合用在哪里

ASCII图像和装饰性数据视觉。

## 什么时候不用

源图像素不可读时必须显示替代结果；字符尺寸不能为零。

## 提示词例子

```text
将图像采样亮度映射为字符密度，限制网格大小，处理图片读取失败，并提供原图说明。
```
