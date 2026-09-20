import { getTemplate } from './templates.ts';
import { contextKey, inspectPlan, inspectWork, ruleVersion } from './rules.ts';
import type { CompositionPlan, Environment, PlanStep, WorkCapability } from './model.ts';

export const demoRecipes = {
  portfolio: [null, 'staggered-page-transition', 'text-reveal', 'accordion', null],
  product: [null, 'omit', null, 'accordion', null],
  tool: ['omit', null, null, 'deployment-checklist', null],
} as const;
export type DemoKind = keyof typeof demoRecipes;
const adaptations: Record<DemoKind, string[]> = {
  portfolio: [
    '本地JSON决定详情，三块面板以完成事件和资料就绪共同交接；取消或失败释放遮挡。',
    '中文按字素处理，退场结束后启用正文；问答补齐语义，答案内操作不意外关闭。',
    '联系入口只显示示例邮箱，没有发送信息。',
  ],
  product: [
    '正文和方案差异直接显示，省略全屏和逐字动效。',
    '问答允许同时展开；选择变化清除旧确认，确认只保留本地状态，不创建订单。',
  ],
  tool: [
    '使用有标签的真实输入；标题、地址格式与本地JSON读取实际决定三行结果。',
    '删除原作固定时间线、预设跳过和失败；失败保留输入与修改入口，没有执行外部部署。',
  ],
};
export function demoPlan(works: WorkCapability[], kind: DemoKind, motion: Environment['motion']) {
  const template = getTemplate(kind)!;
  const environment: Environment = {
    framework: 'react',
    input: 'touch',
    motion,
    navigation: kind === 'tool' ? 'frequent' : 'occasional',
    externalData: 'blocked',
    allowAdaptation: true,
  };
  const steps: PlanStep[] = template.slots.map((slot, index) => {
    const selected = demoRecipes[kind][index];
    const work =
      selected && selected !== 'omit' ? works.find((item) => item.slug === selected) : null;
    if (selected && selected !== 'omit' && !work) throw new Error('固定示例缺少作品材料。');
    return {
      slot,
      work: work || null,
      omitted: selected === 'omit',
      issues: work ? inspectWork(work, slot, environment) : [],
    };
  });
  const issues = [...steps.flatMap((step) => step.issues), ...inspectPlan(steps)];
  if (issues.some((issue) => issue.severity === 'blocked'))
    throw new Error('固定示例与当前规则存在冲突。');
  for (const detail of adaptations[kind])
    issues.push({ code: 'demo-adaptation', detail, severity: 'adaptation', workIds: [] });
  const plan: CompositionPlan & { handoffs: string[] } = {
    id: `${kind}:${steps.map((s) => `${s.slot.id}=${s.work?.id || (s.omitted ? 'omit' : 'base')}`).join('|')}`,
    templateId: kind,
    title: template.title,
    steps,
    issues,
    status: 'needs-adaptation',
    contextKey: contextKey(environment),
    ruleVersion,
    handoffs: template.handoffs,
  };
  return plan;
}
