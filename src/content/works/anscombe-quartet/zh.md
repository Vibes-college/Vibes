---
{
  'locale': 'zh',
  'status': 'published',
  'title': 'Anscombe’s Quartet',
  'summary': '四组统计摘要相近的数据，画出来却很不一样。逐组看散点、异常点与真实数值。',
  'description': '四组统计摘要相近的数据，画出来却很不一样。逐组看散点、异常点与真实数值。',
  'previewText':
    { 'eyebrow': 'F. J. Anscombe · R datasets', 'display': 'Anscombe’s Quartet', 'note': '' },
  'mediaText':
    {
      'plot': { 'title': 'Anscombe’s Quartet', 'alt': 'Anscombe’s Quartet 的原作画面' },
      'group-1':
        {
          'title': '数据组 1',
          'context': '经典 Anscombe 数据，每组 11 对观测值。这里显示原始数值，不声称是新实验或实时数据。',
          'columns':
            {
              'x1': 'X1',
              'x2': 'X2',
              'x3': 'X3',
              'x4': 'X4',
              'y1': 'Y1',
              'y2': 'Y2',
              'y3': 'Y3',
              'y4': 'Y4',
            },
        },
      'group-2':
        {
          'title': '数据组 2',
          'context': '经典 Anscombe 数据，每组 11 对观测值。这里显示原始数值，不声称是新实验或实时数据。',
          'columns':
            {
              'x1': 'X1',
              'x2': 'X2',
              'x3': 'X3',
              'x4': 'X4',
              'y1': 'Y1',
              'y2': 'Y2',
              'y3': 'Y3',
              'y4': 'Y4',
            },
        },
      'group-3':
        {
          'title': '数据组 3',
          'context': '经典 Anscombe 数据，每组 11 对观测值。这里显示原始数值，不声称是新实验或实时数据。',
          'columns':
            {
              'x1': 'X1',
              'x2': 'X2',
              'x3': 'X3',
              'x4': 'X4',
              'y1': 'Y1',
              'y2': 'Y2',
              'y3': 'Y3',
              'y4': 'Y4',
            },
        },
      'group-4':
        {
          'title': '数据组 4',
          'context': '经典 Anscombe 数据，每组 11 对观测值。这里显示原始数值，不声称是新实验或实时数据。',
          'columns':
            {
              'x1': 'X1',
              'x2': 'X2',
              'x3': 'X3',
              'x4': 'X4',
              'y1': 'Y1',
              'y2': 'Y2',
              'y3': 'Y3',
              'y4': 'Y4',
            },
        },
    },
}
---

## 相似的数字摘要，不同的图形

Anscombe 的四组数据常被用来说明可视化的重要性。它们具有近似一致的一些统计摘要，却能在散点图里呈现不同的结构。这里直接使用 R datasets 中的数值，分别绘制四组。

## 自己检查

先切换组别，再缩小显示样本数量，看看某个点是否影响你对整体的判断。展开数据表，可以核对图上的点；改变范围只是在选择显示哪些行，没有重新生成或改写数据。

## 原始资料

[R 的数据说明](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/anscombe.html)引用 F. J. Anscombe 的论文 _Graphs in Statistical Analysis_（1973）。[R 源数据](https://svn.r-project.org/R/trunk/src/library/datasets/data/anscombe.R)记录全部数值；本地取数日期为 2026-09-07，不是观测日期。
