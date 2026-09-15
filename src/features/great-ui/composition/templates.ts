import type { Environment, PathTemplate } from './model.ts';

export const defaultEnvironment: Environment = {
  framework: 'unknown',
  input: 'unknown',
  motion: 'normal',
  navigation: 'occasional',
  externalData: 'unknown',
  allowAdaptation: true,
};

export const templates: PathTemplate[] = [
  {
    id: 'portfolio',
    title: '作品集：进入、理解、答疑、联系',
    slots: [
      {
        id: 'browse',
        role: 'showcase',
        title: '浏览作品',
        purpose: '先看清有哪些项目，再决定进入哪一个。',
        required: true,
        signals: ['content-visible'],
        base: {
          title: '项目卡片与链接',
          provides: ['content-visible'],
          task: '使用项目已有列表，或建立含真实标题、摘要和详情链接的静态卡片。',
        },
      },
      {
        id: 'enter',
        role: 'navigate',
        title: '进入项目',
        purpose: '进入选中的真实详情，必要时使用一次过渡。',
        required: false,
        signals: ['navigation-intent'],
        base: {
          title: '直接打开详情',
          provides: ['navigation-intent'],
          task: '保留真实链接与前进后退，不添加全屏动效。',
        },
      },
      {
        id: 'understand',
        role: 'introduce',
        title: '理解价值',
        purpose: '让用户读到完整介绍与成果。',
        required: true,
        signals: ['content-visible'],
        base: {
          title: '直接显示介绍',
          provides: ['content-visible'],
          task: '把项目介绍、重要结果和限制完整显示。',
        },
      },
      {
        id: 'questions',
        role: 'answer',
        title: '解答疑问',
        purpose: '按需阅读补充信息；必读内容直接展示。',
        required: true,
        signals: ['answer-toggle'],
        base: {
          title: '普通问答区',
          provides: ['answer-toggle'],
          task: '使用原生details或直接显示答案，保证重要信息可见。',
        },
      },
      {
        id: 'contact',
        role: 'act',
        title: '联系',
        purpose: '给出真实的下一步联系入口。',
        required: true,
        signals: ['action-intent'],
        base: {
          title: '联系链接或表单',
          provides: ['action-intent'],
          task: '绑定项目自己的联系方式或表单处理，不把按钮动效当成提交能力。',
        },
      },
    ],
    handoffs: [
      '真实链接决定目标页面；遮挡到位、数据就绪和退出完成分别处理。',
      '全文可见后再启用正文效果，重要内容不依赖动画才能读到。',
      '问答不再叠加逐字模糊，联系操作有独立的真实处理。',
    ],
  },
  {
    id: 'product',
    title: '产品介绍：理解、比较、选择',
    slots: [
      {
        id: 'value',
        role: 'introduce',
        title: '理解产品',
        purpose: '先读懂产品解决什么问题。',
        required: true,
        signals: ['content-visible'],
        base: {
          title: '直接说明价值',
          provides: ['content-visible'],
          task: '使用简短介绍与真实示例，重要差异始终可读。',
        },
      },
      {
        id: 'examples',
        role: 'showcase',
        title: '查看示例',
        purpose: '通过作品或产品实例判断是否适合。',
        required: false,
        signals: ['content-visible'],
        base: {
          title: '静态示例',
          provides: ['content-visible'],
          task: '沿用现有图片与说明，不强制加入额外动画。',
        },
      },
      {
        id: 'compare',
        role: 'compare',
        title: '比较方案',
        purpose: '并排查看关键差异。',
        required: true,
        signals: ['comparison-visible'],
        base: {
          title: '并排比较表',
          provides: ['comparison-visible'],
          task: '用真实差异建立卡片或表格，手机上仍能逐项比较。',
        },
      },
      {
        id: 'questions',
        role: 'answer',
        title: '补充答疑',
        purpose: '比较答案时允许保留已展开信息。',
        required: true,
        signals: ['answer-toggle'],
        base: {
          title: '可并排阅读的答案',
          provides: ['answer-toggle'],
          task: '用独立details或直接展示；不要让打开一个答案自动关闭另一个。',
        },
      },
      {
        id: 'choose',
        role: 'act',
        title: '作出选择',
        purpose: '明确当前选择与操作结果。',
        required: true,
        signals: ['action-intent'],
        base: {
          title: '选择与确认',
          provides: ['action-intent'],
          task: '绑定实际选择状态和确认处理；没有订单服务时不得显示已下单。',
        },
      },
    ],
    handoffs: [
      '方案差异直接展示，问答只承载补充信息。',
      '确认状态来自实际选择；改变选择时清除旧确认。',
      '优先保留简化方案，避免动画遮住比较内容。',
    ],
  },
  {
    id: 'tool',
    title: '任务工具：填写、检查、修正',
    slots: [
      {
        id: 'locate',
        role: 'navigate',
        title: '定位功能',
        purpose: '快速找到当前要操作的位置。',
        required: false,
        signals: ['navigation-intent'],
        base: {
          title: '直接进入表单',
          provides: ['navigation-intent'],
          task: '沿用已有导航和焦点顺序，省略高频全屏转场。',
        },
      },
      {
        id: 'input',
        role: 'act',
        title: '填写或选择',
        purpose: '收集这次任务必要的输入。',
        required: true,
        signals: ['input-collect'],
        base: {
          title: '有标签的原生输入',
          provides: ['input-collect'],
          task: '建立真实字段、校验和提交处理；按钮本身不承担业务执行。',
        },
      },
      {
        id: 'execute',
        role: 'act',
        title: '执行检查',
        purpose: '校验输入后触发实际任务。',
        required: true,
        signals: ['action-intent'],
        base: {
          title: '执行按钮',
          provides: ['action-intent'],
          task: '连接实际检查处理，运行期间防止重复执行，失败后可重试。',
        },
      },
      {
        id: 'result',
        role: 'feedback',
        title: '查看结果',
        purpose: '状态对应真实执行结果。',
        required: true,
        signals: ['status-display'],
        base: {
          title: '实际状态与错误提示',
          provides: ['status-display'],
          task: '绑定真正的运行、成功、失败状态；不要用固定延时伪造执行。',
        },
      },
      {
        id: 'help',
        role: 'answer',
        title: '理解与修正',
        purpose: '看懂错误或帮助后继续操作。',
        required: true,
        signals: ['answer-toggle'],
        base: {
          title: '就近帮助与修改入口',
          provides: ['answer-toggle'],
          task: '说明具体问题和修正方法，保留输入以便再次执行。',
        },
      },
    ],
    handoffs: [
      '先验证输入，再执行任务；结果必须来自实际操作。',
      '任务失败时保留内容和修改入口，重试不能叠加旧任务。',
      '高频工具优先直接反馈，动画不能成为读取结果的前提。',
    ],
  },
];

export function getTemplate(id: string): PathTemplate | undefined {
  return templates.find((item) => item.id === id);
}
