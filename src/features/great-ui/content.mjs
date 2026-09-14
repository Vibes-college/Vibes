import { learning, composition } from './learning.mjs';
import { makeOtherCases } from './more-cases.mjs';
export const revision = 'eda1b85ed81ab45d0f0cbc27dc0206560d11c801';
const repo = `https://github.com/Saurabh-2607/GreatUI/blob/${revision}`;

export const glossary = {
  stagger: {
    title: '错峰',
    english: 'Stagger',
    kind: '行为',
    definition:
      '同组元素按顺序、带着时间间隔开始运动。差异来自开始时间，元素本身可以使用相同的动画。',
    context: '原作的五块遮挡层每隔 75 毫秒启动一块，让一次页面切换产生连续的节奏。',
    parameter: 'staggerDelay = 0.075 秒；第 i 块的延迟 = i × staggerDelay（i 从 0 开始）。',
    judgment: '间隔太大会让最后一块迟迟不到位。增加块数时，也要检查整体等待时间。',
  },
  overlay: {
    title: '遮挡层',
    english: 'Overlay',
    kind: '原语',
    definition: '放在内容上方的独立视觉层。它可以暂时盖住底下的内容，而不用移动内容本身。',
    context: '原作把全屏遮挡层分成五块；先盖住旧页面，再从同一位置揭开新页面。',
    parameter: 'columns 控制分块数量，panelClassName 控制遮挡层的颜色与外观。',
    judgment: '遮挡只是视觉手段。它本身不会让目标页面的数据更快加载完成。',
  },
  transform: {
    title: '位移',
    english: 'Translate',
    kind: '原语',
    definition: '改变元素在画面里的显示位置，同时保留它在布局中的占位。',
    context: '顶部进入时，每块面板从视口上方移动到中央，再向下离开。底下的文字并没有一起滑动。',
    parameter: '原作使用 y: -100dvh → 0 → 100dvh；左右方向改用 x 与 dvw。',
    judgment: '方向应帮助读者理解变化。普通列表刷新通常不需要全屏位移。',
  },
  easing: {
    title: '缓动',
    english: 'Easing',
    kind: '原语',
    definition:
      '描述动画过程中速度如何变化。即使总时长相同，匀速、先慢后快、先快后慢的感觉也不同。',
    context: '原作使用两端慢、中段快的曲线，让面板有一个明确的起步和收尾。',
    parameter: 'ease = [0.85, 0, 0.15, 1]，对应 cubic-bezier(0.85, 0, 0.15, 1)。',
    judgment: '先保留原曲线，再调整时长；同时改变太多参数，会很难判断节奏为什么变了。',
  },
  swap: {
    title: '内容切换时机',
    english: 'View swap',
    kind: '交互术语',
    definition: '把旧视图替换成新视图的时刻。它需要与动画的遮挡状态协调。',
    context: '等最后一块面板也完全到位，调用 onViewSwap，再停留 50 毫秒后开始退场。',
    parameter: '完全遮住的时刻 = duration + (columns − 1) × staggerDelay。原始参数下为 1.05 秒。',
    judgment:
      'onViewSwap 只是回调，不能保证异步路由已经渲染完。接入真实项目时要单独处理加载与失败。',
  },
  reduced: {
    title: '减少动态效果',
    english: 'Reduced motion',
    kind: '使用规范',
    definition: '尊重用户在系统中减少动画的偏好，为大范围运动提供更安静的替代方式。',
    context: '这个样板在系统开启此偏好时不自动播放录屏。接入项目时，直接完成内容切换。',
    parameter: '通过 prefers-reduced-motion 检查偏好。原作该文件没有内置此处理，实际接入时应补上。',
    judgment: '保留操作结果和内容变化，让用户仍然能完成相同的任务。',
  },
};

export const entry = {
  id: 'great-ui-staggered-page-transition',
  slug: 'staggered-page-transition',
  kind: 'stagger',
  placementHint: '例如：作品集的首页与项目详情之间',
  changesHint: '例如：保留我的黑白配色，改成三块，从左侧进入',
  title: '错峰页面转场',
  english: 'Staggered Page Transition',
  author: 'Saurabh Sharma · Great UI',
  classification: { type: '组件', purpose: ['页面导航'], behavior: ['错峰', '遮挡揭示'] },
  summary: '把一次页面切换拆成一组有先后顺序的动作，让旧内容退场、新内容出现得更从容。',
  reference: 'https://www.great-ui.com/components/staggered-page-transition',
  recording: 'https://ik.imagekit.io/zoffdbb7mk/staggering-page-transition.mp4',
  previewRecording: '/media/staggered-source-capture.mp4',
  poster: '/media/staggered-source-poster.png',
  recordingCredit: '原作演示 · 本次补录',
  recordingNote:
    '2026-09-14，作者视频地址返回 HTTP 429。样板使用在 Great UI 原作页面实际点击 Top Curtain 时补录的画面，未下载该受限视频。',
  localRecordingPath: 'src/features/great-ui/media/staggered-source-capture.mp4',
  source: `${repo}/components/ui/StaggeredPageTransition.tsx`,
  sourceRaw: `https://raw.githubusercontent.com/Saurabh-2607/GreatUI/${revision}/components/ui/StaggeredPageTransition.tsx`,
  previewSource: `${repo}/components/site/previews/StaggeredPageTransitionPreview.tsx`,
  license: `${repo}/LICENSE`,
  revision,
  licenseNote:
    '当前 LICENSE 为 Great UI Custom License；README 与源码注释仍写 MIT，存在不一致。限制将组件重新发布为 UI 套件、模板或组件库。此处为本地研究样板，使用原作页面的本次补录视频，未打包组件源码；对外发布前仍需核对素材授权。',
  sections: [
    {
      title: '它在做什么',
      text: '原作把 [[overlay|遮挡层]] 分成五块，通过 [[stagger|错峰]] 依次盖住旧页面。等整个画面被遮住，才替换内容，再让面板依次离开。',
    },
    {
      title: '为什么会有这种节奏',
      text: '每块面板使用同一套 [[transform|位移]] 和 [[easing|缓动]]，只把开始时间错开。秩序来自一致的运动规则，变化来自时间差。',
    },
    {
      title: '最需要保留的关系',
      text: '保留“完全遮住 → 切换内容 → 揭开”的顺序。[[swap|内容切换时机]] 比粉色、块数和方向更关键；提前切换会让用户看见底下突然跳变。',
    },
  ],
  suitable: '作品集、品牌展示、低频的页面导航。适合给一次明确的场景变化留出过渡。',
  avoid: '高频筛选、表格操作、搜索结果更新。反复遮住整个画面会拖慢操作；移动端也应缩短等待。',
  preserve: ['完全遮住之后再切换内容', '同组面板使用一致的运动规则', '一次操作只完成一次切换'],
  defaults: {
    columns: 5,
    duration: 0.75,
    staggerDelay: 0.075,
    direction: 'top',
    exitOpposite: true,
    ease: [0.85, 0, 0.15, 1],
  },
  terms: ['stagger', 'overlay', 'transform', 'easing', 'swap', 'reduced'],
  checks: [
    '内容只在完全遮住后切换，且一次操作只切换一次。',
    '动画结束后遮挡层不再拦截点击和键盘操作。',
    '连续点击、前进后退、修饰键新开链接不会产生错乱。',
    '加载慢或失败时有可理解的反馈，不能假设计时结束就已加载完成。',
    '减少动态效果偏好下直接切换或采用轻量过渡。',
    '在手机宽度和目标项目的真实路由中检查，说明未覆盖的环境。',
  ],
  verification: {
    sourceChecked: '2026-09-14',
    scope: '固定版本源码与原始演示已核对；样板仅播放原作页面补录的 MP4。',
    limitation:
      '尚未将复制出的 Prompt 交给独立 Agent 接入真实项目；录屏和修改建议不代表完整路由接入验收。',
  },
};

export const entries = [entry, ...makeOtherCases(entry, glossary)];
for (const item of entries) {
  item.learning = learning[item.kind];
  item.composition = composition;
  item.licenseLabel = '可商用 · 自定义许可';
}
export const glossaryFor = (selected) => selected.glossary || glossary;
export const getEntry = (slug) => entries.find((item) => item.slug === slug) || entry;

export const plain = (text) => text.replace(/\[\[([^|]+)\|([^\]]+)\]\]/g, '$2');
export function timing(config) {
  const covered = config.duration + (config.columns - 1) * config.staggerDelay;
  return { covered, hold: 0.05, reveal: covered + 0.05, total: covered * 2 + 0.05 };
}
export const fmt = (value) => Number(value.toFixed(3)).toString();
export function material(
  config,
  placement = '',
  changes = '',
  selected = entry,
  goalId = 'faithful',
  combined = false,
) {
  const guide = selected.learning;
  const goal = guide.goals.find((item) => item.id === goalId) || guide.goals[0];
  config ||= selected.defaults;
  const termMap = glossaryFor(selected);
  const t = selected.kind === 'stagger' ? timing(config) : null;
  return `${combined ? `请帮我在项目中实现这条页面路径：${composition.title}。` : `请帮我把「${selected.title} · ${selected.english}」接入我的项目。`}

任务模式：${combined ? '组合完整页面' : '接入并改进单个效果'}
接入位置：${placement.trim() || '先阅读项目，定位适合这个效果的位置；不明确时先向我确认。'}
我的要求：${changes.trim() || '保留项目现有配色、字体、内容和布局。先复现这个效果的核心行为，再做必要适配。'}

参考材料
原作与交互演示：${selected.reference}
原作素材入口：${selected.recording}
本次补录说明：${selected.recordingNote}
同一台电脑上的补录视频：${selected.localRecordingPath}
如果你无法访问该本机路径，请让我提供视频附件；不要假装已读取。不要持续重试或规避原地址的限流。
固定版本源码：${selected.source}
可读取的源码：${selected.sourceRaw}
原作者示例：${selected.previewSource}
版本：${selected.revision}
许可：${selected.license}
${selected.licenseNote}

分类
类型：${selected.classification.type}；用途：${selected.classification.purpose.join('、')}；行为：${selected.classification.behavior.join('、')}。

设计说明
${selected.sections.map((s) => `${s.title}：${plain(s.text)}`).join('\n')}
适合：${selected.suitable}
不适合：${selected.avoid}
原作的核心关系：${selected.preserve.join('；')}。
若选择多项比较，明确替换单项展开规则；其他关系仍需保留。

原作基线（不是本次修改的强制参数；按下方目标调整）
${JSON.stringify(config, null, 2)}
${
  t
    ? `每块进场和退场各 ${fmt(config.duration)} 秒；相邻块延迟 ${fmt(config.staggerDelay)} 秒。
${fmt(t.covered)} 秒完全遮住，再停留 ${fmt(t.hold)} 秒开始揭开；总长约 ${fmt(t.total)} 秒。
以上时间只描述动画，不保证异步页面已经加载完。请处理数据就绪与失败状态。`
    : selected.adjustNote
}

修改目标：${goal.title}
让 Agent 这样改：${goal.action}
改好后看什么：${goal.judge}
可调整的位置：
${guide.adjustments.map(([name, source, note]) => `${name} / ${source}：${note}`).join('\n')}
数值建议是比较起点，不是已验证的最优参数。每次只改一组相关变量，说明改变的原因。
${
  combined
    ? `\n组合任务：${composition.title}\n${composition.steps
        .map((step, i) => {
          const related = getEntry(step.slug);
          return `${i + 1}. ${step.role}：${related.title}。${step.note}\n参考：${related.reference}\n固定源码：${related.source}\n可读取源码：${related.sourceRaw}\n说明：${related.sections.map((s) => plain(s.text)).join(' \n')}\n核心关系：${related.preserve.join('；')}\n接入检查：${related.checks.join('；')}`;
        })
        .join(
          '\n',
        )}\n组合规则：${composition.rules.join('；')}\n整体验收：${composition.checks.join('；')}\n组合是设计提案，尚未在真实项目验收。`
    : ''
}

术语与本案例关系
${selected.terms
  .map((id) => {
    const term = termMap[id];
    return `${term.title} / ${term.english}：${term.definition}\n本例：${term.context}\n源码原始参数说明：${term.parameter}`;
  })
  .join('\n\n')}

执行要求
1. 先查看真实项目与上述固定版本源码。不要仅按组件名猜实现，也不要盲目运行 latest 安装命令。
2. 说明当前框架、路由和依赖能否复用；确需新增依赖时先说明原因。非 React 项目保留核心行为，按当前技术栈实现。
3. 视频无法读取时明确说明，结合源码与可打开的原作页面核对；不要声称看过未读取的参考。
4. 将效果接入上述指定位置，保留现有视觉语言；不顺带重做其他页面。
5. 运行项目，实际触发这个效果，与原作和原作核心关系和本次选择的修改目标逐项对照；有意改变规则时说明原因。

验收
${selected.checks
  .filter((c) => goalId !== 'compare' || !c.includes('初始第二项'))
  .map((c, i) => `${i + 1}. ${c}`)
  .join('\n')}
交付时说明修改文件、运行入口、测试的 Agent/技术栈/页面范围，以及未完成项。

材料验证范围
${selected.verification.scope}
${selected.verification.limitation}`;
}

export function structuredEntry(selected = entry) {
  const termMap = glossaryFor(selected);
  return {
    ...selected,
    sections: selected.sections.map((s) => ({ ...s, text: plain(s.text) })),
    glossary: Object.fromEntries(selected.terms.map((id) => [id, termMap[id]])),
  };
}
