---
locale: 'zh'
status: 'published'
title: 'Prose UI · Markdown 排版全览'
summary: '一篇可以实际操作的排版样本：文字、图片、提示、卡片、步骤、代码、标签页、公式与表格。'
description: '这是 Vibes 为检查文章排版而编写的示例，不是第三方作品推荐。向下阅读，可以逐项检查 Prose UI 的全部内容组件、公开样式变体与交互效果。'
previewText:
  eyebrow: 'VIBES / TYPOGRAPHY LAB'
  display: "Written in Markdown.\nMade for reading."
  note: '文字 · 图片 · 代码 · 公式'
---

## 从这里开始检查

这是一篇真正由 Markdown 渲染的文章。你可以点击代码复制按钮、切换文件与语言、打开标签页、放大图片，也可以用底部目录快速跳到想检查的类型。

| 检查范围       | 本文覆盖                                                     |
| :------------- | :----------------------------------------------------------- |
| Typography     | 六级标题、Subtitle、正文、强调、链接、列表、引用与分隔线     |
| Images & Frame | 本地与外链图片、行内图片、尺寸、放大、四种对齐和 Caption     |
| Callouts       | Note、Info、Tip、Warning、Danger；每种都有有标题和无标题版本 |
| Cards          | 横向、纵向、静态、链接、图标、颜色、CTA、箭头及一至三列      |
| Steps          | 编号、图标与混合步骤；base 和 h1–h6 标题尺寸                 |
| Code blocks    | 高亮、有无标题、有无行号、长行、复制与成功反馈               |
| Code groups    | 多文件、文件与语言、单文件多语言，以及分组同步               |
| Tabs           | 普通面板、富内容、同组同步与键盘操作                         |
| Math & Tables  | 行内与块级公式、分式、根式、积分、对齐与宽表                 |
| Styling        | 明暗主题、局部变量、选中文字、焦点与排除区域                 |

说明文字为 Vibes 原创。样式来自 [Prose UI](https://prose-ui.com/)，图片来源与署名见对应图注。

## 文字与排版 Typography

# 一级标题：让文字有呼吸的空间

::subtitle[这是 Subtitle：位于标题下方的简短说明，用更轻的颜色交代阅读方向。]

这一节的章节标题本身就是二级标题。正文从内容开始：好的文章排版，会让读者先看到结构，再顺畅地读完每一句话。这里同时放入中文、English words、数字 0123456789 和标点，检查不同字符在同一行里的节奏。

**这是粗体，用来强调关键判断。** _这是斜体，用来区分语气。_ ~~这是删除线。~~ 行内代码如 `npm run build` 应该与普通文字有明显区分，同时保持这一行的自然高度。

[这是外部文字链接](https://prose-ui.com/docs/components/typography)，[这是回到本文开头的内部链接](#从这里开始检查)。可以悬停、点击，也可以使用 Tab 键检查焦点。

### 三级标题：把一个章节拆成几个问题

每一层标题都应该能辨认出来，同时与上下文保持适当距离。这一段用来检查标题后第一段的间距。

#### 四级标题：更细的一层

字体、字重和行高共同形成层次，不需要在每个标题前加入装饰。

##### 五级标题：细节说明

短段落仍应保留舒服的阅读节奏。

###### 六级标题：补充信息

最后一级也保持可读，而不是缩成难以辨认的注脚。

### 有序、无序与嵌套列表

- 第一项：先看内容，再看形式。
- 第二项：观察缩进与段落之间的关系。
  - 二级项目保留独立层次。
    - 三级项目仍然对齐。
- 第三项：回到主要列表。

1. 找到想表达的问题。
2. 写出清楚的观察。
   1. 将事实与判断分开。
      1. 为关键事实保留出处。
      2. 为判断保留适用条件。
   2. 检查内容是否有重复。
3. 在手机与桌面各读一遍。

- [x] 已完成的任务项。
- [ ] 待完成的任务项。

### 多段引用与分隔线

> 阅读是一段连续的注意力。排版的作用，是让内容更容易被理解。
>
> 一段引用可以包含多个段落，也可以包含 **强调** 和 [来源链接](https://prose-ui.com/)。

下面的分隔线为两段不同语境的内容留出停顿。

---

分隔线之后，正文继续使用同样的基准字号和行高。

## 图片、尺寸与放大 Images

先看一张独立图片。点击它可以放大；点击放大后的画面、关闭按钮，或按 Escape 返回。键盘用户也可以聚焦图片后按 Enter。

::::frame{align="stretch"}
![木星表面的云带，来自 Juno 任务的影像](/images/prose/jupiter.jpg)

::caption[Juno Captures Jupiter。Credits: NASA/JPL-Caltech/SwRI/MSSS, Thomas Thomopoulos © CC BY。图片复用自 Prose UI 官网示例。]
::::

[查看 Prose UI 原示例与署名](https://prose-ui.com/#images) · [NASA Juno 任务](https://science.nasa.gov/mission/juno/)

### 指定宽度，保持原比例

::image{src="/images/prose/jupiter.jpg" alt="宽度为400像素的木星图片" width="400"}

### 只指定高度，保持原比例

::image{src="/images/prose/jupiter.jpg" alt="高度为100像素的木星图片" height="100"}

### 外链图片

下图直接使用 Prose UI 的公开图片地址，并声明尺寸。它与本地图片一样具有放大操作；外部服务不可用时，替代文字仍会保留。

::image{src="https://prose-ui.com/img/jupiter-cropped.jpg" alt="来自Prose UI服务器的木星图片" width="600" height="282"}

### 行内图片与放大开关

普通 Markdown 行内图片 ![抽象图形](/images/prose/inline.svg) 嵌在句子中，默认不会放大。

指定宽度的行内图片 :image{src="/images/prose/inline.svg" alt="宽度为60像素的行内图形" width="60"} 也保持在文字流里。

这一枚可以放大：:image{src="/images/prose/inline.svg" alt="可以放大的行内图形" width="60" zoom="true"}，用来检查显式打开缩放的效果。

下面的独立图片则显式关闭放大：

::image{src="/images/prose/jupiter.jpg" alt="不启用放大的图片" width="280" zoom="false"}

下面的图片是链接，点击会打开来源页面：

::image{src="/images/prose/jupiter.jpg" alt="点击前往Prose UI的图片链接" width="280" href="https://prose-ui.com/"}

## 对齐与图注 Frame / Caption

### Left：左对齐

::::frame{align="left" caption="左对齐图片，图注跟随图片。"}
::image{src="/images/prose/jupiter.jpg" alt="左对齐的木星" width="220"}
::::

### Center：居中

::::frame{align="center" caption="居中图片，适合独立示意。"}
::image{src="/images/prose/jupiter.jpg" alt="居中的木星" width="220"}
::::

### Right：右对齐

::::frame{align="right" caption="右对齐图片，检查容器边界。"}
::image{src="/images/prose/jupiter.jpg" alt="右对齐的木星" width="220"}
::::

### Stretch：铺满可用宽度

::::frame{align="stretch"}
::image{src="/images/prose/jupiter.jpg" alt="铺满宽度的木星"}

::caption[这是独立 Caption 写法，可以与图片和表格一起使用。]
::::

### 没有图注的 Frame

:::frame{align="center"}
::image{src="/images/prose/jupiter.jpg" alt="没有图注的居中图片" width="220"}
:::

## 五种提示 Callouts

### 有标题

:::callout{variant="info" title="Info · 信息"}
一般信息或有帮助的背景说明。这里可以放 **强调文字** 与 [相关链接](https://prose-ui.com/docs/components/callout)。
:::

:::callout{variant="note" title="Note · 补充"}
为当前段落添加额外上下文，不中断文章主线。
:::

:::callout{variant="tip" title="Tip · 提示"}
适合简短技巧、经验或下一步建议。
:::

:::callout{variant="warning" title="Warning · 注意"}
提醒读者留意一个可能影响结果的条件。
:::

:::callout{variant="danger" title="Danger · 警告"}
突出需要特别注意的重要问题。
:::

### 没有标题

:::callout{variant="info"}
无标题 Info：图标与正文并排。
:::

:::callout{variant="note"}
无标题 Note：同样保留背景与图标。
:::

:::callout{variant="tip"}
无标题 Tip：用一行给出简短提示。
:::

:::callout{variant="warning"}
无标题 Warning：内容可以自然换行，在手机上也保持图标与第一行对齐。
:::

:::callout{variant="danger"}
无标题 Danger：检查红色文字和浅色背景的对比。
:::

### 提示中可以继续写 Markdown

:::callout{variant="note" title="一段完整的补充材料"}
这不是只有一句话的装饰框。

- 可以包含列表。
- 可以包含 `行内代码`。

也可以保留第二个段落。
:::

> [!TIP]
> 这一个使用简短的 Markdown 提示语法，外观与 Tip 一致。

## 卡片与卡片组 Cards

### 横向链接卡片

:::card{title="阅读原版文档" icon="book-open" href="https://prose-ui.com/docs" cta="打开文档" horizontal="true" arrow="true"}
检查图标、标题、正文、行动文字和右侧箭头在横向布局中的关系。
:::

### 三列纵向卡片

::::cards{columns="3"}
:::card{title="全部组件" icon="shapes" href="https://prose-ui.com/docs/components/overview" cta="浏览组件" arrow="true"}
了解各类内容组件的用途。
:::
:::card{title="排版变量" icon="sparkles" color="#16a34a" href="https://prose-ui.com/docs/styling" cta="查看样式" arrow="true"}
这一张使用彩色图标。
:::
:::card{title="代码与公式" icon="code" href="https://prose-ui.com/docs/components/math" cta="查看示例" arrow="true"}
检查不同长度正文的卡片高度。
:::
::::

### 两列：静态与内部链接

::::cards{columns="2"}
:::card{title="静态说明卡片"}
没有链接、图标、CTA 或箭头的基本版本。
:::
:::card{title="跳到文章开头" href="#从这里开始检查" cta="返回检查清单" arrow="true"}
这是同页内部链接，显式显示箭头。
:::
::::

### 一列与箭头覆盖

::::cards{columns="1"}
:::card{title="外部链接默认箭头" href="https://prose-ui.com/"}
不写 arrow 属性时，外部链接自动带箭头。
:::
:::card{title="外链但关闭箭头" href="https://prose-ui.com/docs" cta="打开文档" arrow="false"}
保留行动文字，显式隐藏箭头。
:::
::::

### 只有标题与带图标的静态卡片

::card{title="只有标题"}

:::card{title="静态图标卡片" icon="sparkles" horizontal="true"}
横向布局也可以只作说明，不包含导航操作。
:::

## 连续步骤 Steps

### 默认 base：编号与图标混用

::::steps{titleSize="base"}
:::step{title="找到问题"}
先确定读者要完成什么。
:::
:::step{title="记录观察"}
用可验证的事实支撑判断。
:::
:::step{title="继续探索" icon="rocket"}
最后一步用图标代替数字，保持相同的垂直节奏。
:::
::::

### h1 标题尺寸

::::steps{titleSize="h1"}
:::step{title="第一个步骤 · h1"}
检查这一档标题的字号、字重与行高。
:::
:::step{title="第二个步骤 · h1" icon="check"}
图标与标题对齐，正文继续使用基准字号。
:::
::::

### h2 标题尺寸

::::steps{titleSize="h2"}
:::step{title="第一个步骤 · h2"}
检查这一档标题的字号、字重与行高。
:::
:::step{title="第二个步骤 · h2" icon="check"}
图标与标题对齐，正文继续使用基准字号。
:::
::::

### h3 标题尺寸

::::steps{titleSize="h3"}
:::step{title="第一个步骤 · h3"}
检查这一档标题的字号、字重与行高。
:::
:::step{title="第二个步骤 · h3" icon="check"}
图标与标题对齐，正文继续使用基准字号。
:::
::::

### h4 标题尺寸

::::steps{titleSize="h4"}
:::step{title="第一个步骤 · h4"}
检查这一档标题的字号、字重与行高。
:::
:::step{title="第二个步骤 · h4" icon="check"}
图标与标题对齐，正文继续使用基准字号。
:::
::::

### h5 标题尺寸

::::steps{titleSize="h5"}
:::step{title="第一个步骤 · h5"}
检查这一档标题的字号、字重与行高。
:::
:::step{title="第二个步骤 · h5" icon="check"}
图标与标题对齐，正文继续使用基准字号。
:::
::::

### h6 标题尺寸

::::steps{titleSize="h6"}
:::step{title="第一个步骤 · h6"}
检查这一档标题的字号、字重与行高。
:::
:::step{title="第二个步骤 · h6" icon="check"}
图标与标题对齐，正文继续使用基准字号。
:::
::::

## 代码块 Code blocks

### 有标题、有行号

```typescript title="greeting.ts" showLineNumbers
interface Reader {
  name: string;
}

const greet = (reader: Reader): string => {
  return `你好，${reader.name}。欢迎来到 Vibes。`;
};

console.log(greet({ name: '读者' }));
```

### 有标题、没有行号

```json title="article.json"
{
  "title": "把想法写下来",
  "published": true,
  "tags": ["reading", "design"]
}
```

### 没有标题、有行号

```python showLineNumbers
def reading_time(words):
    # 示例代码：按每分钟 250 字估算。
    return max(1, round(words / 250))

print(reading_time(1800))
```

### 没有标题、没有行号

```bash
npm run build
npm run preview
```

### 普通文本与长行

```text title="notes.txt"
这是一段不做语法着色的纯文本。
A deliberately long line stays inside the code block and scrolls horizontally: reading / writing / revising / sharing / exploring / learning / building / improving / returning / discovering / continuing.
```

每个代码块都可以复制。复制成功后按钮会短暂显示勾号；复制内容不包含标题、行号或按钮文字。

## 多文件与多语言 Code groups

### 多个文件、同一种语言

:::codegroup

```javascript title="reader.js"
export const reader = { name: 'Vibes' };
```

```javascript title="welcome.js"
import { reader } from './reader.js';
console.log(`Welcome, ${reader.name}`);
```

:::

### 多个文件、多种语言

选择 Server / Client 切换文件，再选择 Typescript / Javascript 切换语言。复制按钮始终复制当前可见的版本。

:::codegroup{groupId="reader-example"}

```typescript title="Server" showLineNumbers
const message: string = 'Hello from Vibes';
export const response = { message };
```

```javascript title="Server" showLineNumbers
const message = 'Hello from Vibes';
export const response = { message };
```

```typescript title="Client" showLineNumbers
const response: { message: string } = { message: 'Hello' };
console.log(response.message);
```

```javascript title="Client" showLineNumbers
const response = { message: 'Hello' };
console.log(response.message);
```

:::

### 同组同步：另一处代码

下面这一组与上一组使用相同组名。切换文件或语言后，可以观察两处同步变化。

:::codegroup{groupId="reader-example"}

```typescript title="Server"
const status: number = 200;
```

```javascript title="Server"
const status = 200;
```

```typescript title="Client"
const ready: boolean = true;
```

```javascript title="Client"
const ready = true;
```

:::

### 只有一个文件、多种语言

这里只显示标题和语言选择，不出现多余的文件标签。语言选择会与其他支持同种语言的代码组同步。

:::codegroup

```typescript title="Welcome"
const welcome: string = 'Welcome to Vibes';
```

```javascript title="Welcome"
const welcome = 'Welcome to Vibes';
```

:::

## 内容标签页 Tabs

### 普通标签页与富内容

点击标签切换，或聚焦标签后使用左右方向键、Home / End。

:::::tabs{groupId="workflow"}
::::tab{value="写作"}
从一句清楚的话开始，说明这篇文章想回答什么。

- 找到问题。
- 整理观察。
- 保留出处。
  ::::
  ::::tab{value="构建"}
  Markdown 在构建时变成网页。

```bash title="build.sh"
npm run build
```

::::
::::tab{value="检查"}
:::callout{variant="tip" title="检查阅读路径"}
在手机和桌面上各读一遍，确认内容与交互都可以理解。
:::
::::
:::::

### 相同组名：第二组标签页

::::tabs{groupId="workflow"}
:::tab{value="写作"}
这组现在也显示“写作”。两组共享选择结果。
:::
:::tab{value="构建"}
这组现在也显示“构建”。切换是双向同步的。
:::
:::tab{value="检查"}
这组现在也显示“检查”。内容各自独立。
:::
::::

### 标签页与代码组也能同步

这一组使用上面代码示例的组名。切换 Server / Client，会同步对应代码块的文件选项。

::::tabs{groupId="reader-example"}
:::tab{value="Server"}
Server：描述服务端准备的数据。
:::
:::tab{value="Client"}
Client：描述读者看到的结果。
:::
::::

## 数学公式 Math

### 行内公式

行内公式与段落融为一体，例如 $E = mc^2$、$F = ma$，以及一元二次方程的求根公式 $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$。观察上下标、分式与文字基线的关系。

### 块级公式

独立公式居中显示：

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

积分符号与上下限：

$$
\int_a^b f(x)\,dx = F(b) - F(a)
$$

求和与矩阵：

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
\qquad
A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}
$$

这条较长的公式用于检查手机上的横向滚动。它应该留在自己的区域里，不把整篇文章撑宽。

$$
f(x_1,x_2,x_3,x_4,x_5,x_6) = \alpha_1 x_1^2 + \alpha_2 x_2^2 + \alpha_3 x_3^2 + \alpha_4 x_4^2 + \alpha_5 x_5^2 + \alpha_6 x_6^2
$$

## 表格 Tables

### 普通表格与列对齐

| 内容（左对齐） | 状态（居中） | 数量（右对齐） |
| :------------- | :----------: | -------------: |
| 文章草稿       |    已完成    |             12 |
| 图片说明       |    检查中    |              8 |
| 延伸阅读       |    待整理    |             24 |

### 带图注的宽表

::::frame{align="stretch"}

| 类型     | 阅读目的       | 常见内容             | 适合的呈现                | 检查重点             |
| :------- | :------------- | :------------------- | :------------------------ | :------------------- |
| 作品导览 | 理解作品的价值 | 背景、路径、原始来源 | 正文、图片、链接          | 事实与推测是否分开   |
| 实践记录 | 重现一个过程   | 步骤、示例代码、结果 | Steps、CodeGroup、Callout | 每一步是否能实际完成 |
| 对照研究 | 比较多个方案   | 条件、差异、取舍     | 表格、Tabs、Card          | 比较口径是否一致     |

::caption[这是表格的 Caption。窄屏可以在表格区域内横向滚动。]
::::

### 表格 Frame 的四种对齐

::::frame{align="left" caption="表格对齐：left"}

| 项目 | 数量 |
| :--- | ---: |
| A    |   12 |
| B    |   24 |

::::

::::frame{align="center" caption="表格对齐：center"}

| 项目 | 数量 |
| :--- | ---: |
| A    |   12 |
| B    |   24 |

::::

::::frame{align="right" caption="表格对齐：right"}

| 项目 | 数量 |
| :--- | ---: |
| A    |   12 |
| B    |   24 |

::::

::::frame{align="stretch" caption="表格对齐：stretch"}

| 项目 | 数量 |
| :--- | ---: |
| A    |   12 |
| B    |   24 |

::::

## 明暗主题与局部样式 Styling

网站外壳保持当前浅色界面。下面两个局部样本分别使用 Prose UI 的明暗主题，方便直接对照文字、链接和行内代码。

<div class="prose-ui light theme-example">
<p><strong>Light · 浅色样本</strong></p>
<p>文字保持清楚的对比，<a href="https://prose-ui.com/docs/styling">链接</a> 和 <code>inline code</code> 延续同一套样式。</p>
</div>

<div class="prose-ui dark theme-example">
<p><strong>Dark · 深色样本</strong></p>
<p>深色样式使用对应的背景与文字颜色，<a href="https://prose-ui.com/docs/styling">链接</a> 和 <code>inline code</code> 也会同步变化。</p>
</div>

### 变量覆盖

下面只覆盖正文间距变量，展示同一套样式可以按需要做局部调整。

<div class="prose-ui light theme-example" style="--p-content-gap: 2rem; --p-content-gap-cluster: 1rem">
<p><strong>更宽松的局部段落间距</strong></p>
<p>第一段说明。</p>
<p>第二段说明。正文其他区域继续使用默认间距。</p>
</div>

### 排除一小块自有内容

下面使用官方 `not-prose` 排除机制，保留自己的简洁排版。它用于嵌入已有内容，而不让文章样式重复接管。

<div class="not-prose">
<p>这是一块不使用 Prose UI 排版的内容。</p>
<p>普通段落样式由这块内容自己决定。</p>
</div>

### 最后检查一次

可以选中一段文字观察选区颜色，用 Tab 键观察链接和按钮焦点，再用手机检查卡片堆叠、表格、长代码与长公式。关闭 JavaScript 后，正文、提示、卡片、步骤、公式仍然可读；标签页和代码组会把各个面板连续显示。

本文用于样式与交互验收。公开组件与枚举变体均在上文展示，任意颜色、字体或 CSS 变量组合不作无限穷举。
