// Principles describe mechanisms verified in source, not visual similarity alone.
const families = {
  'page-transition': ['遮罩交接', '错峰时序'],
  'theme-transition': ['根视图过渡', '裁切揭示'],
  'scroll-text': ['滚动映射', '文字分组'],
  'path-text': ['滚动映射', 'SVG路径'],
  'path-drawing': ['SVG路径', '错峰时序'],
  'scroll-card': ['滚动映射', '变换映射'],
  'social-hover': ['悬浮层', '弹簧跟随'],
  'people-list': ['悬浮层', '输入方式适配'],
  'image-reveal': ['裁切揭示', '输入方式适配'],
  'ascii-image': ['像素采样', '输入方式适配'],
  'device-demo': ['定时序列', '演示状态'],
  'step-feedback': ['状态反馈', '演示状态'],
  'waiting-indicator': ['定时序列', '状态反馈'],
  'compact-menu': ['弹簧跟随', '状态反馈'],
  'settings-dock': ['布局变化', '状态反馈'],
  'navigation-menu': ['布局变化', '错峰时序'],
  'action-button': ['操作层级', '状态反馈'],
  'link-feedback': ['裁切揭示', '操作层级'],
  'command-display': ['文字分组', '状态反馈'],
  'localized-text': ['文字分组', '状态反馈'],
  'album-display': ['弹簧跟随', '输入方式适配'],
  'image-marquee': ['循环位移', '内容副本'],
  'timeline-display': ['状态反馈', '变换映射'],
  'image-card': ['操作层级', '布局保持'],
  disclosure: ['状态反馈', '布局变化'],
};
const special = {
  'cross-blur-page-transition': ['背景滤镜', '状态反馈'],
  'pixel-page-transition': ['网格分组', '错峰时序'],
  'curtain-page-transition': ['遮罩交接', '成对位移'],
  'blur-fade-theme-transition': ['根视图过渡', '交叉淡化'],
  'animated-link': ['裁切揭示', '操作层级'],
};
export function connectWorks(entries, metadata) {
  const enriched = entries.map((entry) => ({
    ...entry,
    family: metadata(entry).family,
    principles: special[entry.slug] || families[metadata(entry).family] || [],
  }));
  return enriched.map((entry) => ({
    ...entry,
    related: {
      alternatives: enriched
        .filter((other) => other.id !== entry.id && other.family === entry.family)
        .slice(0, 5)
        .map(({ slug, title }) => ({ slug, title })),
      principles: enriched
        .filter(
          (other) =>
            other.family !== entry.family &&
            other.principles.some((key) => entry.principles.includes(key)),
        )
        .map((other) => ({
          slug: other.slug,
          title: other.title,
          shared: other.principles.filter((key) => entry.principles.includes(key)),
        }))
        .slice(0, 5),
    },
  }));
}
