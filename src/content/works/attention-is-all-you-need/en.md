---
locale: 'en'
status: 'published'
sourceRevision: '998b040aaf47d919fc132f7e9abbb64dd708a302f9f75b368cada15de4de2982'
title: 'Attention Is All You Need'
summary: 'Attention Is All You Need — understand where the Transformer began through one paper.'
description: 'This 2017 paper introduced the Transformer architecture. It uses attention to process sequences and offers an important starting point for understanding today’s language models. Start with the abstract and architecture diagram, then explore at your own pace.'
previewText:
  {
    eyebrow: 'RESEARCH PAPER · 2017',
    display: "Attention Is\nAll You Need",
    note: 'The Transformer architecture',
  }
---

## From reading one word at a time to finding relationships in parallel

The Transformer uses attention to process sequences: the representation of a word can incorporate information from other positions in the sentence. The original paper proposed an encoder–decoder architecture for machine translation. Multi-head attention lets different representation subspaces operate in parallel, while positional encoding supplies information about sequence order. This is an important starting point for understanding many later language models, but it does not account for every design choice in today’s models. [View the source](https://arxiv.org/abs/1706.03762)

## Understand attention before memorizing the formulas

Imagine the words in a sentence seated around a table. Each position forms a query and gathers useful information according to how well other positions match it. This is only an analogy: the model operates on vectors and matrices, with no human intention to ask questions. When reading about multi-head attention, consider why the model uses more than one weighted combination. When reading about positional encoding, ask how parallel computation retains word order.

### Three things to look for

These Vibes reading prompts help organize questions and compare materials.

| Perspective         | First question                                      | Keep in mind                                                                      |
| ------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| Attention           | Which positions provide information to one another? | It is not the same as human attention or explanation.                             |
| Positional encoding | How does sequence order enter the model?            | Different models can use different methods.                                       |
| Encoder and decoder | How does the input become an output?                | The original paper’s architecture is not a universal design for all large models. |

---

## Continue with a small exercise

Choose a Chinese sentence containing a pronoun and circle the things it might refer to. Then swap the order of two words and observe whether the meaning changes. This exercise does not simulate training, but it can help explain why both relationships and position matter in language processing. Return to the paper’s architecture diagram and look for the components that address these two problems.

### Turn reading into your own judgment

1. **Understand the material first.** Explain the problem the work addresses in your own words, and note the concepts you do not yet understand.
2. **Record your observations.** Separate what you directly observed from your inferences, and write down the conditions under which you reached a conclusion.
3. **Return to the original source.** For details that affect your conclusion, read the original paper, documentation or full episode rather than relying only on this guide.

> Reading note: worthwhile exploration includes discovering new possibilities and understanding the conditions under which a conclusion applies.

## Sources and further reading

- [Attention Is All You Need · Original source](https://arxiv.org/abs/1706.03762)
- [Dive into Deep Learning: Transformer (Chinese)](https://zh.d2l.ai/chapter_attention-mechanisms/transformer.html)

This is an English translation of a Chinese guide written by Vibes using publicly available material. The reading prompts, comparison perspectives and exercises are editorial additions, not quotations from the original authors. Technical capabilities and page content may change with new versions; consult the original source for specifics.
