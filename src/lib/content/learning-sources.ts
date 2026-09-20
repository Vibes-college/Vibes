export const learningSourceIds = ['great-ui', 'beui', 'rare-ui', 'microkit'] as const;
export type LearningSourceId = (typeof learningSourceIds)[number];

// Sources are editorially registered, never supplied as arbitrary runtime hosts.
export const learningSources = {
  'great-ui': {
    label: 'Great UI',
    author: 'Saurabh Sharma · Great UI',
    repository: 'Saurabh-2607/GreatUI',
    reference: 'https://www.great-ui.com/components/',
    implementation: /^components\/ui\/[A-Za-z0-9_-]+\.tsx$/,
    preview: /^components\/site\/previews\/[A-Za-z0-9_-]+\.tsx$/,
    licenseLabel: '可商用 · 自定义许可',
    licenseNote:
      'Great UI 使用自定义许可，允许在个人及商业应用、网站中使用和修改；限制重新打包为 UI 套件、模板或组件库。这里提供原创学习说明与应用示例，保留原作和固定源码链接。',
  },
  beui: {
    label: 'beUI',
    author: 'Saurabh Chauhan · beUI',
    repository: 'starc007/ui-components',
    reference: 'https://beui.dev/components/motion/',
    implementation: /^components\/motion\/[A-Za-z0-9_/-]+\.(tsx|ts)$/,
    preview: /^components\/previews\/motion\/[A-Za-z0-9_-]+\.preview\.tsx$/,
    licenseLabel: 'MIT · 保留版权与许可',
    licenseNote:
      '固定源码使用 MIT 许可，复用代码时保留版权与许可文本。组件会引用同库工具和样式；本页提供原创学习说明与独立录制的公开演示，源码链接包含完整依赖的查找入口。',
  },
  'rare-ui': {
    label: 'Rare UI',
    author: 'Swami Malode · Rare UI',
    repository: 'swamimalode07/rare-ui',
    reference: 'https://www.rareui.com/components/',
    implementation: /^components\/ui\/[A-Za-z0-9_-]+\.tsx$/,
    preview: /^app\/components\/\(docs\)\/[A-Za-z0-9_-]+\/demo\.tsx$/,
    licenseLabel: 'MIT · 保留版权与许可',
    licenseNote:
      '固定仓库 LICENSE 为 MIT；官网另说明不将组件重新包装成套件出售。本页提供原创教学和独立录制演示，保留作者及来源；接入代码时保留许可，并核对目标用途及原始参考。',
  },
  microkit: {
    label: 'MicroKit',
    author: 'Henrique Barone · MicroKit',
    repository: 'henriquegpb/microkit',
    reference: 'https://microkit.co/components/',
    implementation: /^components\/interactions\/[A-Za-z0-9_-]+\/component\.tsx$/,
    preview: /^components\/interactions\/[A-Za-z0-9_-]+\/(component\.tsx|source\.ts)$/,
    licenseLabel: 'MIT · 保留版权与许可',
    licenseNote:
      '固定源码使用 MIT 许可，复用时保留版权与许可文本。仓库说明部分案例改编自公开示例；本页保留 MicroKit 来源，提供原创中文说明与独立录屏，不将其归为 Great UI 原作。',
  },
} as const;

export function learningSource(value: unknown = 'great-ui') {
  return typeof value === 'string' && learningSourceIds.includes(value as LearningSourceId)
    ? learningSources[value as LearningSourceId]
    : null;
}

export function learningReference(sourceId: unknown, slug: unknown) {
  const source = learningSource(sourceId);
  return source && typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ? `${source.reference}${slug}`
    : null;
}

export function validLearningPath(sourceId: unknown, path: unknown, preview = false) {
  const source = learningSource(sourceId);
  if (!source || typeof path !== 'string' || path.includes('//')) return false;
  return (preview ? source.preview : source.implementation).test(path);
}

export function learningSourceUrl(sourceId: unknown, revision: unknown, path: unknown) {
  const source = learningSource(sourceId);
  if (!source || typeof revision !== 'string' || !/^[a-f0-9]{40}$/.test(revision)) return null;
  return validLearningPath(sourceId, path)
    ? `https://github.com/${source.repository}/blob/${revision}/${path}`
    : null;
}
