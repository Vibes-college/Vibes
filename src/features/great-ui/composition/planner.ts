import type {
  CompositionPlan,
  Environment,
  PathSlot,
  PathTemplate,
  PlanIssue,
  PlanStep,
  VerificationRecord,
  WorkCapability,
} from './model.ts';
import { contextKey, inspectPlan, inspectWork, ruleVersion } from './rules.ts';

const limits = { candidates: 8, family: 2, beam: 6, results: 3 };
type PartialPlan = { steps: PlanStep[]; score: number; issues: PlanIssue[] };

function rank(work: WorkCapability, issues: PlanIssue[], pinnedId?: string): number {
  return (
    (work.id === pinnedId ? 100 : 0) +
    (work.sourceReviewed ? 10 : 0) +
    (work.browserObserved ? 5 : 0) -
    issues.filter((issue) => issue.severity === 'adaptation').length * 2 -
    issues.filter((issue) => issue.severity === 'unknown').length * 4
  );
}

export function candidatesFor(
  works: WorkCapability[],
  slot: PathSlot,
  environment: Environment,
  pinnedId?: string,
) {
  const rejected: PlanIssue[] = [];
  const ranked = works
    .filter((work) => work.roles.includes(slot.role))
    .map((work) => {
      const issues = inspectWork(work, slot, environment);
      if (issues.some((issue) => issue.severity === 'blocked')) {
        rejected.push(...issues.filter((issue) => issue.severity === 'blocked'));
        return null;
      }
      return { work, issues, score: rank(work, issues, pinnedId) };
    })
    .filter((item) => item !== null)
    .sort((a, b) => b.score - a.score || a.work.id.localeCompare(b.work.id));
  const families = new Map<string, number>();
  const candidates = ranked
    .filter(({ work }) => {
      const used = families.get(work.family) || 0;
      if (used >= limits.family && work.id !== pinnedId) return false;
      families.set(work.family, used + 1);
      return true;
    })
    .slice(0, limits.candidates);
  return { candidates, rejected, matched: ranked.length };
}

function stepOptions(
  works: WorkCapability[],
  slot: PathSlot,
  environment: Environment,
  pinnedId?: string,
) {
  const found = candidatesFor(works, slot, environment, pinnedId);
  const options: { step: PlanStep; score: number }[] = found.candidates.map((candidate) => ({
    step: {
      slot,
      work: candidate.work,
      omitted: false,
      issues: candidate.issues,
    } satisfies PlanStep,
    score: candidate.score,
  }));
  if (
    environment.allowAdaptation &&
    slot.base &&
    slot.signals.every((signal) => slot.base?.provides.includes(signal))
  ) {
    // Reserve one candidate for the simpler implementation without widening the search.
    if (options.length === limits.candidates) options.pop();
    options.push({
      step: {
        slot,
        work: null,
        omitted: false,
        issues: [
          {
            code: 'base-implementation',
            detail: slot.base.task,
            severity: 'adaptation',
            workIds: [],
            slotId: slot.id,
          },
        ],
      },
      score: 0,
    });
  } else if (!slot.required) {
    if (options.length === limits.candidates) options.pop();
    options.push({ step: { slot, work: null, omitted: true, issues: [] }, score: 0 });
  }
  return { options, rejected: found.rejected, matched: found.matched };
}

export function compose(
  works: WorkCapability[],
  template: PathTemplate,
  environment: Environment,
  pinnedId?: string,
) {
  if (new Set(works.map((work) => work.id)).size !== works.length)
    throw new Error('Composition work IDs must be unique');
  if (template.slots.length > 8 || !template.slots.length)
    throw new Error('A path must contain 1–8 slots');
  if (new Set(template.slots.map((slot) => slot.id)).size !== template.slots.length)
    throw new Error('Path slot IDs must be unique');
  if (pinnedId && !works.some((work) => work.id === pinnedId))
    return {
      plans: [],
      rejected: [
        {
          code: 'pinned-missing',
          detail: '指定作品不在当前目录中。',
          severity: 'blocked' as const,
          workIds: [pinnedId],
        },
      ],
      stats: { expansions: 0, scanned: works.length },
    };
  let beam: PartialPlan[] = [{ steps: [], score: 0, issues: [] }];
  const rejected: PlanIssue[] = [];
  let expansions = 0;
  for (const slot of template.slots) {
    const { options, rejected: failed } = stepOptions(works, slot, environment, pinnedId);
    rejected.push(...failed);
    if (!options.length)
      rejected.push({
        code: 'required-step-missing',
        detail: `没有满足条件的${slot.title}实现。`,
        severity: 'blocked',
        workIds: [],
        slotId: slot.id,
      });
    const next: PartialPlan[] = [];
    for (const partial of beam)
      for (const option of options) {
        expansions++;
        const steps = [...partial.steps, option.step];
        const conflicts = inspectPlan(steps);
        if (conflicts.some((issue) => issue.severity === 'blocked')) {
          rejected.push(...conflicts.filter((issue) => issue.severity === 'blocked'));
          continue;
        }
        const issues = [...steps.flatMap((step) => step.issues), ...conflicts];
        if (
          !environment.allowAdaptation &&
          conflicts.some((issue) => issue.severity === 'adaptation')
        ) {
          rejected.push(...conflicts.map((issue) => ({ ...issue, severity: 'blocked' as const })));
          continue;
        }
        next.push({ steps, issues, score: partial.score + option.score - conflicts.length });
      }
    next.sort((a, b) => b.score - a.score || signature(a.steps).localeCompare(signature(b.steps)));
    beam = next.slice(0, limits.beam);
    if (!beam.length) break;
  }
  const ctx = contextKey(environment);
  const plans: CompositionPlan[] = beam
    .filter(
      (partial) =>
        partial.steps.length === template.slots.length &&
        (!pinnedId || partial.steps.some((step) => step.work?.id === pinnedId)),
    )
    .slice(0, limits.results)
    .map((partial) => ({
      id: `${template.id}:${signature(partial.steps)}`,
      templateId: template.id,
      title: template.title,
      steps: partial.steps,
      issues: uniqueIssues(partial.issues),
      status: partial.issues.length ? 'needs-adaptation' : 'suggested',
      contextKey: ctx,
      ruleVersion,
    }));
  if (pinnedId && !plans.length)
    rejected.push({
      code: 'pinned-incompatible',
      detail: '当前路径和条件无法保留指定作品。请更换路径、允许必要适配或选择替代作品。',
      severity: 'blocked',
      workIds: [pinnedId],
    });
  return {
    plans,
    rejected: uniqueIssues(rejected),
    stats: { expansions, scanned: works.length * template.slots.length },
  };
}

function signature(steps: PlanStep[]) {
  return steps
    .map((step) => `${step.slot.id}=${step.work?.id || (step.omitted ? 'omit' : 'base')}`)
    .join('|');
}
function uniqueIssues(issues: PlanIssue[]): PlanIssue[] {
  return [
    ...new Map(
      issues.map((issue) => [
        `${issue.code}:${issue.slotId}:${issue.workIds.join(',')}:${issue.detail}`,
        issue,
      ]),
    ).values(),
  ];
}

export function verificationCurrent(
  plan: CompositionPlan,
  record: VerificationRecord,
  adapterRevision: string,
): boolean {
  if (
    record.result !== 'passed' ||
    !record.references.length ||
    record.planId !== plan.id ||
    record.contextKey !== plan.contextKey ||
    record.ruleVersion !== plan.ruleVersion ||
    record.adapterRevision !== adapterRevision
  )
    return false;
  const works = [
    ...new Map(
      plan.steps.flatMap((step) => (step.work ? [[step.work.id, step.work] as const] : [])),
    ).values(),
  ];
  if (record.works.length !== works.length) return false;
  return works.every((work) =>
    record.works.some(
      (item) =>
        item.id === work.id &&
        item.sourceRevision === work.sourceRevision &&
        item.contentRevision === work.contentRevision &&
        item.capabilityRevision === work.capabilityRevision,
    ),
  );
}
