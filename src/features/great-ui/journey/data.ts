export interface ProjectData {
  id: string;
  title: string;
  kicker: string;
  intro: string;
  outcome: string;
  facts: string[];
  questions: { title: string; description: string }[];
}

export const projects: ProjectData[] = [
  {
    id: 'field-notes',
    title: '山野手记',
    kicker: '编辑设计 · 作品集示例',
    intro:
      '让一次短途旅行，留下值得重新翻开的记录。把照片、路线和当天的小发现，整理成清楚、安静的阅读体验。',
    outcome: '先看行程，再读故事，最后带走自己的路线。',
    facts: ['清楚的路线与时间', '适合手机阅读的短篇', '可以直接保存的行前清单'],
    questions: [
      {
        title: '这个项目解决了什么问题？',
        description: '信息不再散落在聊天和相册里：路线、文字和注意事项在同一条阅读路径中逐步出现。',
      },
      {
        title: '为什么没有给每个区块加动画？',
        description:
          '转场只在进入项目时使用。介绍可以轻轻揭示，路线与注意事项直接显示，让重要信息随时可读。',
      },
      {
        title: '如何继续了解设计过程？',
        description: '查看页面底部的联系信息。这里是本地组合示例，没有提交到外部服务。',
      },
    ],
  },
  {
    id: 'quiet-work',
    title: '专注时刻',
    kicker: '产品设计 · 作品集示例',
    intro:
      '把注意力留给正在做的一件事。用更少的层级，帮助人们安排工作、看见进展，并在结束时安心停下。',
    outcome: '打开任务、完成一步、看见进展，然后继续。',
    facts: ['一个明确的当前任务', '可随时恢复的进度', '平静而清楚的完成反馈'],
    questions: [
      {
        title: '最重要的设计取舍是什么？',
        description:
          '把高频操作直接放在页面上，取消反复出现的全屏动效；仅在进入完整项目时保留一次过渡。',
      },
      {
        title: '手机上的主要操作是什么？',
        description: '用户能在一个视图中读到当前任务并完成它，不需要通过悬停发现操作入口。',
      },
      {
        title: '怎样判断设计是否有效？',
        description: '让用户实际找到任务、完成操作并解释结果，再根据卡住的地方改进。',
      },
    ],
  },
];

export const journeyNames = {
  portfolio: '作品集：进入、理解、答疑、联系',
  product: '产品介绍：理解、比较、选择',
  tool: '任务工具：填写、检查、修正',
} as const;
export type JourneyKind = keyof typeof journeyNames;

export function isProjectData(value: unknown): value is ProjectData {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.intro === 'string' &&
    typeof item.kicker === 'string' &&
    typeof item.outcome === 'string' &&
    Array.isArray(item.facts) &&
    item.facts.every((fact) => typeof fact === 'string') &&
    Array.isArray(item.questions) &&
    item.questions.every(
      (q) => q && typeof q.title === 'string' && typeof q.description === 'string',
    )
  );
}
