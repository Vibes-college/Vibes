import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createWorkloads } from '../fixtures/paseo-webui/workloads.ts';
import {
  workloadInputs,
  sampleOrder,
  summarizeSamplingCoverage,
} from '../../scripts/paseo-webui-experiment.ts';

test('frozen workload hashes and sizes cannot silently shrink', () => {
  const frozen = JSON.parse(
    readFileSync(new URL('../fixtures/paseo-webui/frozen.json', import.meta.url), 'utf8'),
  );
  assert.deepEqual(
    workloadInputs().map((input) => ({
      id: input.id,
      bytes: input.bytes.length,
      sha256: input.sha256,
    })),
    frozen.inputs,
  );
  const workloads = createWorkloads();
  assert.equal(workloads.W1.events.length, 1000);
  assert.equal(
    workloads.W1.events.reduce((sum, row) => sum + row.event.item.text.length, 0),
    1024000,
  );
  assert.equal(
    workloads.W2.events.filter(
      (row) => 'item' in row.event && (row.event.item as { type: string }).type === 'tool_call',
    ).length,
    200,
  );
  assert.equal(workloads.W3.files.length, 50);
  assert.equal(
    workloads.W3.files.reduce((sum, file) => sum + file.after.trimEnd().split('\n').length, 0),
    10000,
  );
  for (const item of workloads.W4.cases) assert.equal(item.text.length, item.length);
  assert.equal(workloads.W5.files['data/input.jsonl'].trimEnd().split('\n').length, 6000);
});
test('sampling is deterministic and no empty, partial or failed set becomes a passing claim', () => {
  const order = sampleOrder();
  assert.deepEqual(order, sampleOrder());
  assert.equal(order.length, 720);
  assert.equal(summarizeSamplingCoverage([]).readyForAnalysis, false);
  assert.equal(
    summarizeSamplingCoverage([{ ...order[0], outcome: 'passed' }]).readyForAnalysis,
    false,
  );
  const all = order.map((sample, index) => ({
    ...sample,
    outcome: index === 0 ? ('failed' as const) : ('passed' as const),
  }));
  const report = summarizeSamplingCoverage(all);
  assert.equal(report.readyForAnalysis, true);
  assert.equal(report.failed, 1);
  assert.equal(report.verdict, 'not-evaluated');
  assert.throws(() => summarizeSamplingCoverage([all[0], all[0]]), /duplicate/);
  assert.throws(() => summarizeSamplingCoverage([{ ...all[0], profile: 'unknown' }]), /Unknown/);
});
