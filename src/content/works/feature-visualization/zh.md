---
{
  'locale': 'zh',
  'status': 'published',
  'title': 'Feature Visualization',
  'summary': 'Feature Visualization — 神经网络看见的世界，是什么样子？',
  'description': 'Distill 的可视化文章探索神经网络内部特征。通过图像与解释，理解如何观察模型学到的表示，以及这些方法的局限。',
  'previewText':
    {
      'eyebrow': 'DISTILL · 2017',
      'display': "Looking inside\na neural network",
      'note': 'Feature Visualization',
    },
  'mediaText':
    {
      'distill-cover-zoom':
        { 'title': '文章封面', 'alt': 'Distill Feature Visualization 原文封面' },
      'distill-channel-zoom':
        {
          'title': 'Channel objective',
          'alt': '原文的通道目标可视化',
          'caption': '来自原文 Objectives 部分：通道目标。',
        },
      'distill-neuron-zoom':
        {
          'title': 'Neuron objective',
          'alt': '原文的神经元目标可视化',
          'caption': '来自原文 Objectives 部分：神经元目标。',
        },
    },
}
---

## 神经网络究竟在寻找什么

Distill 的这篇长文讨论特征可视化：通过优化输入，让网络的某个神经元、通道或其他目标产生较强响应。文章也区分了特征可视化和归因。前者寻找能够激活某种行为的例子，后者分析具体输入的哪些部分影响了输出。 [查看来源](https://distill.pub/2017/feature-visualization/)

## 漂亮图像只是调查的开始

可视化会受到目标、初始化和约束方式的影响。同一个特征也可能对应多种不同图像。阅读时不要急着把一个通道命名为“猫”或“眼睛”；先比较多种例子，再问这种解释是否能预测新的输入会产生怎样的响应。

### 三个值得观察的角度

下面是 Vibes 的阅读提示，用来组织问题与比较材料。

| 观察角度       | 先问什么           | 阅读时留意               |
| -------------- | ------------------ | ------------------------ |
| 优化生成的图像 | 某个目标偏好的输入 | 可能包含优化伪影         |
| 数据集中的样本 | 真实材料中的响应   | 相关性不一定解释机制     |
| 多个可视化结果 | 同一特征的变化范围 | 单一例子容易让人过度概括 |

---

## 带着一个小练习继续探索

在原文选择一组多样性示例，先只看第一张并写下你的判断，再展开整组。记录判断发生了什么变化。这个阅读练习展示了为什么解释工作需要反例：一张图可以启发假设，却通常不足以支持稳定结论。

### 把阅读变成自己的判断

1. **先理解材料。** 用自己的话解释作品要解决的问题，保留你尚未理解的概念。
2. **再记录观察。** 把亲眼看到的结果与自己的推测分开，写下形成判断时的条件。
3. **回到原始来源。** 遇到影响结论的细节，继续阅读原文、文档或完整节目，不只依赖这份导览。

> 阅读笔记：有价值的探索，既包括发现新的可能，也包括知道一个结论适用于什么条件。

## 来源与延伸阅读

- [Feature Visualization · 原始来源](https://distill.pub/2017/feature-visualization/)

本文为 Vibes 根据公开资料撰写的中文导览；阅读提示、比较角度与练习为编辑整理，并非原作者原话。技术能力与页面内容可能随版本更新，具体以原始来源为准。

图库引用文章的原创封面、channel 与 neuron 目标图；按 CC BY 4.0 缩放并转换为 WebP，作者与来源保留。
