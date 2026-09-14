export function makeOtherCases(base, common) {
  const sourceRoot = base.source.slice(0, base.source.indexOf('/components/'));
  const rawRoot = base.sourceRaw.slice(0, base.sourceRaw.indexOf('/components/'));
  const make = (slug, component, detail) => ({
    author: base.author,
    revision: base.revision,
    license: base.license,
    licenseNote: base.licenseNote,
    recordingCredit: '原作演示 · 本次补录',
    id: `great-ui-${slug}`,
    slug,
    kind: slug,
    reference: `https://www.great-ui.com/components/${slug}`,
    recording: `https://www.great-ui.com/components/${slug}`,
    previewRecording: `/media/${slug}-source-capture.mp4`,
    poster: `/media/${slug}-source-poster.png`,
    localRecordingPath: `src/features/great-ui/media/${slug}-source-capture.mp4`,
    source: `${sourceRoot}/components/ui/${component}.tsx`,
    sourceRaw: `${rawRoot}/components/ui/${component}.tsx`,
    previewSource: `${sourceRoot}/components/site/previews/${component}Preview.tsx`,
    recordingNote:
      '2026-09-14，在 Great UI 原作页面实际操作后补录。样板只播放这段 MP4，不嵌入上游组件。',
    verification: {
      sourceChecked: '2026-09-14',
      scope: '固定版本源码与原作交互已核对；使用原作页面补录，未打包上游组件。',
      limitation:
        '尚未将复制出的 Prompt 交给独立 Agent 接入真实项目；录屏和修改建议不代表目标项目验收。',
    },
    ...detail,
  });
  const accordion = make('accordion', 'Accordion', {
    title: '折叠问答',
    english: 'Accordion',
    classification: { type: '组件', purpose: ['信息阅读'], behavior: ['展开收起', '单项展开'] },
    summary: '先露出问题，再按需展开答案。一次只打开一项，让密集信息保持清楚的阅读顺序。',
    sections: [
      {
        title: '先给线索，再给细节',
        text: '问题标题始终可见，点击后才显示答案。这种 [[disclosure|渐进披露]] 让用户先判断哪些信息与自己有关。',
      },
      {
        title: '一次只读一段',
        text: '原作使用 [[single|单项展开]]：打开另一题会关闭上一题，再次点击当前题会收起。初始默认展开第二题。',
      },
      {
        title: '让页面连续地腾出空间',
        text: '答案通过 [[height|高度动画]] 从零展开，同时渐显；后面的题目随布局向下移动。[[easing|缓动]] 让变化有起点和收尾。',
      },
    ],
    suitable: '常见问题、设置帮助、非必读的补充说明。标题本身能说明内容时尤其合适。',
    avoid: '需要并排比较的方案、必须完整阅读的重要说明。频繁开关会增加查找成本。',
    preserve: ['问题标题始终可见', '同一时刻最多展开一项', '展开状态与按钮说明一致'],
    defaults: { duration: 0.3, gap: 6 },
    adjustNote:
      '原作没有对外提供时长与间距属性；调整时需修改源码常量或提为配置。初始展开第二题，点击答案或组件外部也会收起。',
    placementHint: '例如：定价页下方的常见问题',
    changesHint: '例如：保留我的字体，把展开时长缩短到 0.2 秒',
    terms: ['disclosure', 'single', 'height', 'easing', 'reduced'],
    glossary: {
      disclosure: {
        title: '渐进披露',
        english: 'Progressive disclosure',
        kind: '交互方法',
        definition: '先展示判断所需的线索，再让用户按需打开细节。',
        context: '五个问题标题一直可见，答案只在展开时出现。',
        parameter: 'items 中的 title 是入口，description 是补充内容；间距由源码样式控制。',
        judgment: '重要限制和必读内容不应藏在默认关闭的答案里。',
      },
      single: {
        title: '单项展开',
        english: 'Single-open accordion',
        kind: '行为',
        definition: '一组折叠项中最多保留一个打开项。',
        context: 'activeIndex 记录当前题目，点击同一题设为 null，点击另一题替换编号。',
        parameter: '原作 activeIndex 初值为 1；点击答案或组件外部也会收起。',
        judgment: '阅读对比任务可能更适合允许多项同时展开，需要按任务重新决定。',
      },
      height: {
        title: '高度动画',
        english: 'Height transition',
        kind: '原语',
        definition: '逐步改变内容区域占用的高度，让周围布局随之重新排列。',
        context: '答案由 height: 0 变为 auto，opacity 同时从 0 到 1。',
        parameter: '原作 duration = 0.3 秒，ease = easeInOut。',
        judgment: '真实文本高度会随语言和屏幕宽度变化，不要写死答案高度。',
      },
      easing: {
        ...common.easing,
        context: '答案展开与收起使用 easeInOut，在开始和结束时减速。',
        parameter: 'transition = { duration: 0.3, ease: "easeInOut" }。',
        judgment: '阅读组件应迅速响应；时长太长会阻碍连续查阅。',
      },
      reduced: {
        ...common.reduced,
        context: '样板尊重减少动态效果偏好，不自动播放录屏；接入时应直接展开答案。',
        parameter: '原作未内置此处理；接入时给高度、透明度和图标动画提供替代。',
      },
    },
    checks: [
      '标题支持键盘操作，aria-expanded 与答案状态一致。',
      '初始第二项展开；点击同项收起，点击其他项只保留新项。',
      '长答案、中文换行和 320px 屏幕不截断内容。',
      '原作点击外部与答案收起的行为需要按目标任务确认；不应误吞答案内链接。',
      '减少动态效果下直接显示结果，关闭区域不能留下可聚焦控件。',
    ],
  });
  const reveal = make('text-reveal', 'TextReveal', {
    title: '滚动文字揭示',
    english: 'Text Reveal',
    classification: { type: '区块', purpose: ['叙事阅读'], behavior: ['滚动驱动', '逐字揭示'] },
    summary: '用滚动进度点亮文字：从模糊的底稿经过一瞬强调色，再落到清晰正文，阅读节奏由手指决定。',
    sections: [
      {
        title: '滚多少，就读到哪里',
        text: '动画绑定 [[scroll|滚动进度]]，没有固定的播放秒数。向下滚动逐步揭示，往回滚也会倒退。',
      },
      {
        title: '把一段进度分给每个字',
        text: '先按段落和单词分配区间，再细分到字符，形成 [[characters|逐字揭示]]。每个字在自己的区间里从暗变亮。',
      },
      {
        title: '强调色是一瞬间的经过',
        text: '每个字先保留底稿色，经过强调色，最后落到正文色；[[blur|模糊]] 与透明度也一起变化。效果的重点是阅读方向，不是一直发光。',
      },
    ],
    suitable: '品牌宣言、作品介绍、较短的叙事段落。用于强调一句话的阅读节奏。',
    avoid: '工具说明、搜索结果和长篇密集正文。用户急于找答案时，模糊与低对比会降低可读性。',
    preserve: ['动画进度由滚动决定', '最终所有文字清晰可读', '强调色只是过渡，不替代正文颜色'],
    defaults: { blur: 2, opacity: 0.3 },
    adjustNote: '原作的 blur、opacity 是源码常量；调整时需修改或提为配置，不能当成上游现有属性。',
    placementHint: '例如：作品详情开头的一段介绍',
    changesHint: '例如：保留正文白色，降低起始模糊程度',
    terms: ['scroll', 'characters', 'blur', 'reduced'],
    glossary: {
      scroll: {
        title: '滚动进度',
        english: 'Scroll progress',
        kind: '原语',
        definition: '把一段滚动距离转换为从 0 到 1 的连续数值。',
        context: '原作以目标区块的起点和终点经过容器高度 60% 处来界定动画区间。',
        parameter:
          'useScroll offset: ["start 0.6", "end 0.6"]；录屏的时间轴只用于观察原作，不是项目的滚动变量。',
        judgment: '真实接入必须绑定实际滚动容器；不能把进度条演示当成页面滚动验收。',
      },
      characters: {
        title: '逐字揭示',
        english: 'Character reveal',
        kind: '行为',
        definition: '给每个字符分配自己的进度区间，按阅读顺序改变显示状态。',
        context: '原作先按段落、再按空格分词、再拆字符；各段落平分总进度。',
        parameter: '每字颜色经过底稿色、强调色、正文色，透明度由 0.3 到 1。',
        judgment: '英文空格切词不能直接保证中文和组合 emoji 的正确分组，接入时需检查文字分段。',
      },
      blur: {
        title: '模糊',
        english: 'Blur',
        kind: '原语',
        definition: '把文字或图像的边缘变软，削弱细节的清晰程度。',
        context: '原作每个字符在自己的区间内由 2px 模糊过渡到 1px，最终为 0。',
        parameter: 'filter: blur(2px) → blur(1px) → blur(0px)。',
        judgment: '长文本逐字符模糊可能增加渲染负担，应在真实手机上检查滚动流畅度。',
      },
      reduced: {
        ...common.reduced,
        context: '样板尊重减少动态效果偏好，不自动播放录屏；接入时应直接显示完整、清晰的文字。',
        parameter: '原作未内置此分支，接入时应跳过模糊和低透明度阶段。',
      },
    },
    checks: [
      '滚动前进与回退都更新同一进度，不用固定计时器代替。',
      '区块结束时文字全部清晰，减少动态效果时直接完整可读。',
      '保持可访问的完整句子，不让屏幕阅读器逐字重复朗读。',
      '中文、英文、emoji 和窄屏换行均按目标内容检查。',
      '确认滚动容器与 offset，检查长文本和真实手机的渲染表现。',
    ],
  });
  return [accordion, reveal];
}
