---
id: 'wave-timing'
title: '波形时序'
english: 'Wave timing'
aliases: []
category: '动效类型'
provenance: '案例整理'
sources:
  [
    {
      'title': 'Great UI：波浪节奏转场',
      'author': 'Vibes（基于 Saurabh Sharma 的 Great UI 案例整理）',
      'url': 'https://github.com/Saurabh-2607/GreatUI/blob/eda1b85ed81ab45d0f0cbc27dc0206560d11c801/components/ui/SineWavePageTransition.tsx',
      'section': '固定版本实现；通用解释由Vibes整理，具体参数和限制保留在作品中',
    },
  ]
---

# 波形时序 / Wave timing

用周期函数安排各元素的开始时间，让规则位移组成连续起伏的边缘。

## 常见变体

正弦式延迟、相位偏移、镜像波形。

## 适合用在哪里

条带或网格形成连续起伏的边缘。

## 什么时候不用

波形只是安排时间的方式，不代表真实物理模拟。

## 提示词例子

```text
用平滑周期函数安排各条带延迟，限制峰谷差，保证整组很快完成。
```
