import assert from 'node:assert/strict';
import { demoPlan } from '../../src/features/great-ui/composition/demos.ts';
import { capabilities } from '../../src/features/great-ui/content-build.mjs';
import { validateCapabilities } from '../../src/features/great-ui/composition/validate.ts';
import { test } from 'node:test';
import {
  candidatesFor,
  compose,
  verificationCurrent,
} from '../../src/features/great-ui/composition/planner.ts';
import {
  contextKey,
  inspectPlan,
  inspectWork,
} from '../../src/features/great-ui/composition/rules.ts';
import {
  defaultEnvironment,
  templates,
} from '../../src/features/great-ui/composition/templates.ts';
import type {
  Environment,
  PathSlot,
  PathTemplate,
  PlanStep,
  WorkCapability,
} from '../../src/features/great-ui/composition/model.ts';
const environment: Environment = {
  ...defaultEnvironment,
  framework: 'react',
  input: 'pointer',
  externalData: 'allowed',
};
function work(id: string, patch: Partial<WorkCapability> = {}): WorkCapability {
  return {
    id,
    slug: id,
    title: id,
    family: id,
    roles: ['introduce'],
    provides: ['content-visible'],
    requires: [],
    resources: [],
    adaptations: [],
    reducedMotion: 'native',
    decorativeTransition: false,
    sourceReviewed: true,
    browserObserved: true,
    sourceRevision: 's1',
    contentRevision: 'c1',
    capabilityRevision: 'p1',
    ...patch,
  };
}
const slot: PathSlot = {
  id: 'intro',
  role: 'introduce',
  title: '介绍',
  purpose: '介绍真实内容',
  required: true,
  signals: ['content-visible'],
};
function path(slots: PathSlot[] = [slot]): PathTemplate {
  return { id: 'test', title: '测试路径', slots, handoffs: [] };
}
function step(item: WorkCapability, id: string): PlanStep {
  return { slot: { ...slot, id }, work: item, issues: [], omitted: false };
}

test('constraints reject unsupported roles, outcomes, and known mismatches before ranking', () => {
  for (const item of [
    work('wrong-role', { roles: ['theme'] }),
    work('missing-output', { provides: [] }),
    work('react', { requires: [{ key: 'framework', value: 'react', reason: '需要 React' }] }),
  ]) {
    const issues = inspectWork(item, slot, {
      ...environment,
      framework: 'other',
      allowAdaptation: false,
    });
    assert.ok(issues.some((issue) => issue.severity === 'blocked'));
  }
  const output = compose(
    [work('z-valid'), work('a-invalid', { provides: [] })],
    path(),
    environment,
  );
  assert.equal(output.plans[0].steps[0].work?.id, 'z-valid');
});

test('unknown evidence remains explicit and never becomes a verified recommendation', () => {
  const item = work('unknown', {
    sourceReviewed: false,
    browserObserved: false,
    requires: [{ key: 'externalData', value: 'allowed', reason: '依赖外部数据' }],
  });
  const output = compose([item], path(), { ...environment, externalData: 'unknown' });
  assert.equal(output.plans[0].status, 'needs-adaptation');
  assert.equal(output.plans[0].issues.filter((issue) => issue.severity === 'unknown').length, 3);
  assert.equal(
    compose([item], path(), { ...environment, externalData: 'unknown', allowAdaptation: false })
      .plans.length,
    0,
  );
});

test('adaptation must be allowed for an incompatible framework, reduced motion, or integration task', () => {
  const item = work('adapt', {
    requires: [{ key: 'framework', value: 'react', reason: 'React', adaptation: '移植行为' }],
    reducedMotion: 'adaptation',
    adaptations: ['等待实际数据就绪'],
  });
  const env: Environment = { ...environment, framework: 'other', motion: 'reduced' };
  assert.equal(compose([item], path(), env).plans[0].issues.length, 3);
  assert.equal(compose([item], path(), { ...env, allowAdaptation: false }).plans.length, 0);
});

test('same global resource and phase conflict, serial ownership requires a handoff, instances coexist', () => {
  const a = work('a', {
    resources: [{ name: 'theme', scope: 'global', mode: 'exclusive', phase: 'view' }],
  });
  const b = structuredClone(a);
  b.id = 'b';
  assert.equal(inspectPlan([step(a, 'a'), step(b, 'b')])[0].severity, 'blocked');
  b.resources[0].phase = 'exit';
  assert.equal(inspectPlan([step(a, 'a'), step(b, 'b')])[0].severity, 'adaptation');
  b.resources[0].scope = 'instance';
  assert.deepEqual(inspectPlan([step(a, 'a'), step(b, 'b')]), []);
  b.resources[0].scope = 'global';
  b.resources[0].mode = 'read';
  assert.deepEqual(inspectPlan([step(a, 'a'), step(b, 'b')]), []);
});

test('whole-plan conflicts cannot be rescued by rank or pinned selection', () => {
  const resource = {
    name: 'route',
    scope: 'global' as const,
    mode: 'exclusive' as const,
    phase: '*',
  };
  const a = work('a', { resources: [resource] });
  const b = work('b', { roles: ['answer'], provides: ['answer-toggle'], resources: [resource] });
  const answer: PathSlot = { ...slot, id: 'faq', role: 'answer', signals: ['answer-toggle'] };
  assert.equal(compose([a, b], path([slot, answer]), environment, 'a').plans.length, 0);
});

test('required gaps stop a path; optional steps may be omitted and base tasks stay explicit', () => {
  assert.equal(compose([], path(), environment).plans.length, 0);
  const optional = { ...slot, required: false };
  assert.equal(compose([], path([optional]), environment).plans[0].steps[0].omitted, true);
  const withBase = {
    ...slot,
    base: { title: '普通介绍', provides: ['content-visible'], task: '添加项目自己的介绍' },
  };
  const result = compose([], path([withBase]), environment);
  assert.equal(result.plans[0].issues[0].code, 'base-implementation');
  assert.equal(result.plans[0].status, 'needs-adaptation');
  assert.equal(
    compose([], path([withBase]), { ...environment, allowAdaptation: false }).plans.length,
    0,
  );
});

test('candidate families, expansion count, and result count remain bounded while retaining a pin', () => {
  const works = Array.from({ length: 100 }, (_, i) =>
    work(String(i).padStart(3, '0'), { family: 'family-' + Math.floor(i / 10) }),
  );
  const candidates = candidatesFor(works, slot, environment, '099').candidates;
  assert.equal(candidates.length, 8);
  assert.ok(candidates.some((item) => item.work.id === '099'));
  for (const item of candidates)
    assert.ok(candidates.filter((other) => other.work.family === item.work.family).length <= 2);
  const slots = Array.from({ length: 6 }, (_, i) => ({
    ...slot,
    id: 'step-' + i,
    base: { title: '普通介绍', task: '保留现有内容', provides: ['content-visible'] },
  }));
  const result = compose(works, path(slots), environment, '099');
  assert.equal(result.plans.length, 3);
  assert.ok(result.stats.expansions <= 288);
  assert.ok(result.plans.every((plan) => plan.steps.some((step) => step.work?.id === '099')));
  assert.equal(compose(works, path(slots), environment, 'missing').plans.length, 0);
});

test('frequent task operation excludes decorative fullscreen navigation', () => {
  const item = work('transition', {
    roles: ['navigate'],
    provides: ['navigation-intent'],
    decorativeTransition: true,
  });
  const result = compose([item], templates[2], { ...environment, navigation: 'frequent' }, item.id);
  assert.equal(result.plans.length, 0);
  assert.ok(result.rejected.some((issue) => issue.code === 'frequent-navigation'));
});

test('verification expires on any relevant version, project context, plan, or failed evidence', () => {
  const item = work('a');
  const plan = compose([item], path(), environment).plans[0];
  const record = {
    planId: plan.id,
    contextKey: plan.contextKey,
    ruleVersion: plan.ruleVersion,
    works: [{ id: item.id, sourceRevision: 's1', contentRevision: 'c1', capabilityRevision: 'p1' }],
    adapterRevision: 'a1',
    references: ['tests:passed'],
    result: 'passed' as const,
  };
  assert.equal(verificationCurrent(plan, record, 'a1'), true);
  assert.equal(verificationCurrent(plan, record, 'a2'), false);
  for (const key of ['sourceRevision', 'contentRevision', 'capabilityRevision'] as const) {
    const changed = structuredClone(record);
    changed.works[0][key] = 'changed';
    assert.equal(verificationCurrent(plan, changed, 'a1'), false);
  }
  assert.equal(verificationCurrent(plan, { ...record, references: [] }, 'a1'), false);
  assert.equal(verificationCurrent(plan, { ...record, result: 'failed' }, 'a1'), false);
  assert.equal(verificationCurrent(plan, { ...record, contextKey: 'different' }, 'a1'), false);
  assert.equal(verificationCurrent(plan, { ...record, ruleVersion: 'different' }, 'a1'), false);
  assert.equal(verificationCurrent(plan, { ...record, planId: 'different' }, 'a1'), false);
  assert.equal(
    contextKey(environment),
    contextKey(Object.fromEntries(Object.entries(environment).reverse()) as Environment),
  );
});

test('malformed duplicated catalogs or paths do not produce plausible-looking plans', () => {
  assert.throws(() => compose([work('a'), work('a')], path(), environment), /unique/);
  assert.throws(() => compose([], path([]), environment), /1–8/);
  assert.throws(() => compose([], path([slot, slot]), environment), /unique/);
});

test('fixed demo records describe actual component choices and keep simplified steps explicit', () => {
  const works = validateCapabilities(capabilities);
  const selected = {
    portfolio: ['staggered-page-transition', 'text-reveal', 'accordion'],
    product: ['accordion'],
    tool: ['deployment-checklist'],
  };
  for (const kind of ['portfolio', 'product', 'tool'] as const) {
    const normal = demoPlan(works, kind, 'normal');
    const reduced = demoPlan(works, kind, 'reduced');
    assert.deepEqual(
      normal.steps.flatMap((step) => (step.work ? [step.work.slug] : [])),
      selected[kind],
    );
    assert.equal(normal.id, reduced.id);
    assert.notEqual(normal.contextKey, reduced.contextKey);
    assert.ok(normal.issues.some((issue) => issue.code === 'demo-adaptation'));
    assert.ok(!normal.issues.some((issue) => issue.severity === 'blocked'));
    assert.equal(normal.steps.length, 5);
  }
});
