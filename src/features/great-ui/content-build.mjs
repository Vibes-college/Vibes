import { connectWorks } from './relations.mjs';
import { createHash } from 'node:crypto';
import { entries as samples, structuredEntry, revision } from './content.mjs';
import catalog from './data/upstream-catalog.json' with { type: 'json' };
import curation from './data/curation.json' with { type: 'json' };
import observations from './data/observations.json' with { type: 'json' };

const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const repo = `https://github.com/Saurabh-2607/GreatUI/blob/${revision}`;
const categories = {
  'Social Cards': '社交卡片',
  Visuals: '视觉交互',
  Typography: '文字效果',
  'Page Transitions': '页面转场',
  'Theme Transitions': '主题切换',
  Buttons: '按钮',
  'Layout & Cards': '布局与卡片',
};
const purpose = {
  navigate: '页面导航',
  introduce: '内容介绍',
  showcase: '作品展示',
  compare: '方案比较',
  answer: '内容答疑',
  act: '触发操作',
  feedback: '状态反馈',
  theme: '主题切换',
};
const commonLicense =
  'Great UI Custom License 允许在个人及商业项目使用和修改，限制重新打包为 UI 套件、模板或组件库；README 的 MIT 描述与 LICENSE 不一致。本地学习材料保留原作和源码链接，对外发布仍需核对素材及分发范围。';
const sourceIndex = new Map(catalog.entries.map((item) => [item.slug, item]));

function curatedEntry(item) {
  const original = sourceIndex.get(item.slug);
  if (!original) throw new Error(`Unknown curated work: ${item.slug}`);
  const observation = observations[item.slug];
  const sourcePath = `components/ui/${item.sourceFile}.tsx`;
  const mediaUrl = new URL(original.previewUrlCandidate, original.canonicalUrl).href;
  const isImage = /\.(png|jpg|jpeg|webp)$/i.test(mediaUrl);
  const termId = item.slug + '-mechanism';
  return {
    id: 'great-ui-' + item.slug,
    slug: item.slug,
    kind: item.slug,
    title: item.title,
    english: original.name,
    author: 'Saurabh Sharma · Great UI',
    category: categories[original.category],
    summary: item.summary,
    classification: {
      type: '组件',
      purpose: item.roles.map((role) => purpose[role]),
      behavior: item.behavior,
    },
    reference: original.canonicalUrl,
    source: `${repo}/${sourcePath}`,
    sourceRaw: `https://raw.githubusercontent.com/Saurabh-2607/GreatUI/${revision}/${sourcePath}`,
    previewSource: `${repo}/${original.previewSource}`,
    revision,
    license: `${repo}/LICENSE`,
    licenseNote: commonLicense,
    licenseLabel: '可商用 · 自定义许可',
    recording: mediaUrl,
    previewRecording: isImage ? null : mediaUrl,
    previewImage: isImage ? mediaUrl : null,
    poster: observation?.poster || null,
    recordingCredit: 'Great UI 原作演示',
    recordingNote:
      '演示媒体来自作者目录，按需从原地址播放；无法加载时可打开原作实际操作。当前页面观察与媒体可用性分别记录。',
    localRecordingPath: null,
    sections: [
      { title: '它在做什么', text: item.sequence },
      { title: '效果是怎么形成的', text: `[[${termId}|${item.term[0]}]]：${item.mechanism}` },
      { title: '接进项目时要注意什么', text: item.pitfall },
    ],
    suitable: item.suitable,
    avoid: item.avoid,
    preserve: [item.trigger, item.preserve],
    terms: [termId],
    glossary: {
      [termId]: {
        title: item.term[0],
        english: item.term[1],
        kind: '行为与原理',
        definition: item.term[2],
        context: item.mechanism,
        parameter: item.parameters.map((row) => `${row[1]}：${row[2]}`).join('；'),
        judgment: item.pitfall,
      },
    },
    placementHint: item.suitable,
    changesHint: item.improve[1],
    defaults: {},
    adjustNote: item.parameters.map((row) => row.join(' / ')).join('；'),
    checks: [
      item.trigger,
      item.improve[2],
      '键盘和触摸可以完成核心操作，内容不被装饰层永久遮挡。',
      '减少动态效果时保留内容与结果，页面离开后释放监听、计时器及动画。',
    ],
    learning: {
      practice: item.practice,
      goals: [
        {
          id: 'faithful',
          title: '保留原作核心行为',
          action: `${item.sequence} 保留项目自己的内容与样式，先核对固定源码中的${item.parameters.map((row) => row[1]).join('、')}。`,
          judge: item.trigger,
        },
        { id: 'improve', title: item.improve[0], action: item.improve[1], judge: item.improve[2] },
        {
          id: 'quiet',
          title: '减少动效也能完成',
          action: `保留${item.title}的内容与操作结果，系统要求减少动态效果时使用静态或立即反馈；${item.pitfall}`,
          judge: '打开减少动态效果，再完成同一操作；内容、状态与下一步均可读可用。',
        },
      ],
      adjustments: item.parameters,
      combinationIntro: item.combination,
    },
    verification: {
      source: {
        revision,
        implementation: sourcePath,
        preview: original.previewSource,
        reviewed: true,
      },
      browser: observation || { status: 'pending', limitation: '尚未完成原作页面的本轮实际操作。' },
      scope: `已阅读固定版本实现和示例。${observation?.summary || '原作页面观察待完成。'}`,
      limitation:
        '原作页面是访问时的线上版本，无法仅凭页面确认部署 SHA。源码结论固定于上述版本；未代表所有变体、真实手机或用户项目组合均已验证。',
    },
  };
}

const details = [
  ...samples.map((item) => ({
    ...structuredEntry(item),
    category: categories[sourceIndex.get(item.slug).category],
  })),
  ...curation.map(curatedEntry),
];
export const entries = connectWorks(
  details,
  (entry) =>
    curation.find((item) => item.slug === entry.slug) || {
      family:
        entry.slug === 'accordion'
          ? 'disclosure'
          : entry.slug === 'text-reveal'
            ? 'scroll-text'
            : 'page-transition',
    },
);
export const index = entries.map(
  ({ id, slug, title, english, category, summary, poster, classification }) => ({
    id,
    slug,
    title,
    english,
    category,
    summary,
    poster,
    classification,
  }),
);

const sampleCapabilities = {
  'staggered-page-transition': {
    roles: ['navigate'],
    provides: ['navigation-intent'],
    family: 'page-transition',
    adaptations: ['补足内容就绪、失败恢复与退场完成的真实交接。'],
    resources: [{ name: 'route-overlay', scope: 'global', mode: 'exclusive', phase: 'navigation' }],
  },
  'text-reveal': {
    roles: ['introduce'],
    provides: ['content-visible'],
    family: 'scroll-text',
    adaptations: ['按实际语言分字词，重要正文保持可读；需要启停时添加适配。'],
  },
  accordion: {
    roles: ['answer'],
    provides: ['answer-toggle'],
    family: 'disclosure',
    adaptations: ['补齐展开状态与语义；需要比较答案时改为多项状态。'],
  },
};
export const capabilities = entries.map((entry) => {
  const item = curation.find((item) => item.slug === entry.slug) || sampleCapabilities[entry.slug];
  const observation = observations[entry.slug];
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    source: entry.source,
    reference: entry.reference,
    family: item.family,
    roles: item.roles,
    provides: item.provides,
    requires: [
      {
        key: 'framework',
        value: 'react',
        reason: '固定实现基于 React。',
        adaptation: '按项目现有框架移植行为，不能直接粘贴 React 组件。',
      },
      ...(item.input
        ? [
            {
              key: 'input',
              value: 'pointer',
              reason: '原作依赖鼠标悬停或位置。',
              adaptation: '为触摸与键盘增加可发现的等价入口，并保留静态信息。',
            },
          ]
        : []),
      ...(item.external
        ? [
            {
              key: 'externalData',
              value: 'allowed',
              reason: item.external,
              ...(item.externalAdaptation ? { adaptation: item.externalAdaptation } : {}),
            },
          ]
        : []),
    ],
    resources: item.resources || [],
    adaptations: item.adaptations || [item.pitfall],
    reducedMotion: item.reducedMotion || 'adaptation',
    decorativeTransition: item.family === 'page-transition',
    sourceReviewed: true,
    browserObserved:
      ['observed', 'observed-with-limit'].includes(observation?.status) ||
      Boolean(sampleCapabilities[entry.slug]),
    sourceRevision: revision,
    contentRevision: digest({
      sections: entry.sections,
      learning: entry.learning,
      verification: entry.verification,
    }),
    capabilityRevision: digest(item),
  };
});
