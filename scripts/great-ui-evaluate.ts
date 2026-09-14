import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { capabilities } from '../src/features/great-ui/content-build.mjs';
import { validateCapabilities } from '../src/features/great-ui/composition/validate.ts';
import { compose } from '../src/features/great-ui/composition/planner.ts';
import { getTemplate, defaultEnvironment } from '../src/features/great-ui/composition/templates.ts';
import { inspectPlan, inspectWork } from '../src/features/great-ui/composition/rules.ts';
import type { Environment } from '../src/features/great-ui/composition/model.ts';
import fixtures from '../tests/great-ui/evaluation.json' with { type: 'json' };
const works = validateCapabilities(capabilities);
assert.equal(fixtures.length, 20);
assert.equal(fixtures.filter((x) => x.split === 'development').length, 12);
const results = fixtures.map((fixture) => {
  const environment = {
    ...defaultEnvironment,
    framework: 'react',
    input: 'pointer',
    externalData: 'allowed',
    ...fixture.environment,
  } as Environment;
  const template = getTemplate(fixture.template)!;
  const result = compose(
    works,
    template,
    environment,
    fixture.pinned ? 'great-ui-' + fixture.pinned : undefined,
  );
  const issues = [...result.rejected, ...result.plans.flatMap((p) => p.issues)];
  assert.equal(result.plans.length > 0, fixture.expectPlans, fixture.id + ' plan availability');
  if (fixture.expectIssue)
    assert.ok(
      issues.some((i) => i.code === fixture.expectIssue),
      fixture.id + ' missing disclosure',
    );
  let misses = 0;
  for (const plan of result.plans) {
    const requiredIssues = [
      ...inspectPlan(plan.steps),
      ...plan.steps.flatMap((s) => (s.work ? inspectWork(s.work, s.slot, environment) : s.issues)),
    ];
    assert.ok(
      !requiredIssues.some((i) => i.severity === 'blocked'),
      fixture.id + ' accepted hard conflict',
    );
    misses += requiredIssues.filter(
      (i) => !plan.issues.some((p) => p.code === i.code && p.detail === i.detail),
    ).length;
    assert.equal(plan.steps.length, template.slots.length);
    for (const step of plan.steps) {
      assert.ok(!step.slot.required || !step.omitted);
      assert.ok(!step.slot.required || Boolean(step.work || step.slot.base));
    }
  }
  assert.equal(misses, 0, fixture.id + ' disclosure omissions');
  return {
    ...fixture,
    planCount: result.plans.length,
    expansions: result.stats.expansions,
    hardConflictMisses: 0,
    disclosureMisses: misses,
    selected: result.plans.map((p) =>
      p.steps.map((s) => s.work?.slug || (s.omitted ? 'omitted' : 'base')),
    ),
    status: 'passed',
  };
});
const positiveRecall = results.filter((r) => !r.pinned && r.expectPlans);
const timing = [1000, 10000].map((size) => {
  const synthetic = Array.from({ length: size }, (_, i) => ({
    ...works[i % works.length],
    id: 'synthetic-' + i,
    slug: 'synthetic-' + i,
  }));
  const template = getTemplate('portfolio')!;
  const environment: Environment = {
    ...defaultEnvironment,
    framework: 'react',
    input: 'touch',
    externalData: 'blocked',
    motion: 'reduced',
  };
  for (let i = 0; i < 2; i++) compose(synthetic, template, environment);
  const samples = Array.from({ length: 7 }, () => {
    const start = performance.now();
    const output = compose(synthetic, template, environment);
    return { ms: performance.now() - start, expansions: output.stats.expansions };
  });
  samples.sort((a, b) => a.ms - b.ms);
  assert.ok(samples.every((s) => s.expansions <= 240));
  return {
    size,
    medianMs: samples[3].ms,
    p95Ms: samples[6].ms,
    expansions: samples[0].expansions,
    iterations: 7,
  };
});
const report = {
  generatedAt: new Date().toISOString(),
  scope:
    '20 structured goal/context cases, declared before evaluation; 12 development + 8 held-out. No natural-language semantic search or end-user study. Pinned inclusion is excluded from unpinned path coverage. Constraint/disclosure checks are both fixture expectations and full-result audits.',
  metrics: {
    passed: results.length,
    development: 12,
    heldOut: 8,
    unpinnedPositivePathCoverage: {
      hits: positiveRecall.filter((r) => r.planCount > 0).length,
      total: positiveRecall.length,
    },
    hardConflictMisses: 0,
    disclosureMisses: 0,
  },
  results,
  timing,
  performanceLimitation:
    'Synthetic copies measure bounded search cost only, not ranking quality for 1000 or 10000 real works.',
};
await mkdir('resources/evidence/018-great-ui-scale', { recursive: true });
await writeFile(
  'resources/evidence/018-great-ui-scale/evaluation.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify({ metrics: report.metrics, timing }, null, 2));
