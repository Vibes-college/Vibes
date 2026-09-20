import type { Environment, PathSlot, PlanIssue, PlanStep, WorkCapability } from './model.ts';

export const ruleVersion = 'great-ui-composition-1';
export function contextKey(context: Environment): string {
  return Object.entries(context)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

export function inspectWork(
  work: WorkCapability,
  slot: PathSlot,
  context: Environment,
): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const add = (code: string, detail: string, severity: PlanIssue['severity']) =>
    issues.push({ code, detail, severity, workIds: [work.id], slotId: slot.id });
  if (!work.roles.includes(slot.role))
    add('role-mismatch', `「${work.title}」不能承担${slot.title}。`, 'blocked');
  for (const signal of slot.signals)
    if (!work.provides.includes(signal))
      add(
        'missing-capability',
        `尚无证据表明「${work.title}」提供此环节所需的${signal}。`,
        'blocked',
      );
  for (const requirement of work.requires) {
    const actual = context[requirement.key];
    if (actual === requirement.value) continue;
    if (actual === 'unknown')
      add('unknown-condition', `${requirement.reason}；当前项目尚未确认。`, 'unknown');
    else if (requirement.adaptation && context.allowAdaptation)
      add('required-adaptation', requirement.adaptation, 'adaptation');
    else add('condition-mismatch', requirement.reason, 'blocked');
  }
  if (!work.sourceReviewed)
    add('source-unreviewed', '固定源码尚未核对，不能据名称认定接入条件。', 'unknown');
  if (!work.browserObserved)
    add('behavior-unobserved', '尚未取得原作页面的实际操作证据。', 'unknown');
  if (context.motion === 'reduced' && work.reducedMotion !== 'native') {
    add(
      'reduced-motion',
      work.reducedMotion === 'adaptation'
        ? '补齐减少动态效果时的静态或直接反馈路径。'
        : '先确认减少动态效果时能否保留全部内容和操作。',
      context.allowAdaptation ? 'adaptation' : 'blocked',
    );
  }
  if (context.navigation === 'frequent' && work.decorativeTransition)
    add('frequent-navigation', '此路径需要频繁操作，省略全屏装饰性转场。', 'blocked');
  for (const adaptation of work.adaptations)
    add('integration-task', adaptation, context.allowAdaptation ? 'adaptation' : 'blocked');
  if (!context.allowAdaptation && issues.some((issue) => issue.severity === 'unknown'))
    add('unknown-not-allowed', '当前选择要求直接接入，未知条件需要先补证。', 'blocked');
  return issues;
}

export function inspectPlan(steps: PlanStep[]): PlanIssue[] {
  const issues: PlanIssue[] = [];
  for (let i = 0; i < steps.length; i++) {
    const current = steps[i];
    if (current.slot.required && current.omitted)
      issues.push({
        code: 'required-step-missing',
        detail: `缺少必需的${current.slot.title}。`,
        severity: 'blocked',
        workIds: [],
        slotId: current.slot.id,
      });
    if (!current.work) continue;
    for (let j = 0; j < i; j++) {
      const other = steps[j];
      if (!other.work) continue;
      for (const claim of current.work.resources)
        for (const previous of other.work.resources) {
          if (claim.name !== previous.name || claim.mode === 'read' || previous.mode === 'read')
            continue;
          const sameScope = claim.scope === 'global' && previous.scope === 'global';
          if (!sameScope) continue;
          const samePhase =
            claim.phase === previous.phase || claim.phase === '*' || previous.phase === '*';
          issues.push({
            code: samePhase ? 'exclusive-resource' : 'shared-resource-handoff',
            detail: samePhase
              ? `「${other.work.title}」和「${current.work.title}」同时负责全局${claim.name}，需要换掉其中一个或统一负责人。`
              : `「${other.work.title}」和「${current.work.title}」会使用同一全局${claim.name}，需要实际的串行交接。`,
            severity: samePhase ? 'blocked' : 'adaptation',
            workIds: [other.work.id, current.work.id],
          });
        }
    }
  }
  return issues;
}
