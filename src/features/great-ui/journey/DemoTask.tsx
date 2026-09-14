import { useEffect, useRef, useState } from 'react';
import { PromptDialog } from '../PromptDialog.jsx';
import { validateCapabilities } from '../composition/validate';
import { validateCatalog, validateDetail } from '../catalog';
import { demoPlan, type DemoKind } from '../composition/demos';
import { verificationCurrent } from '../composition/planner';
import type { VerificationRecord } from '../composition/model';

function proofRecords(value: unknown): { adapterRevision: string; records: VerificationRecord[] } {
  if (!value || typeof value !== 'object') throw new Error('示例验证材料不完整。');
  const proof = value as { adapterRevision?: unknown; records?: unknown };
  if (
    typeof proof.adapterRevision !== 'string' ||
    !/^[a-f0-9]{64}$/.test(proof.adapterRevision) ||
    !Array.isArray(proof.records) ||
    proof.records.length > 6
  )
    throw new Error('示例验证材料不完整。');
  for (const record of proof.records) {
    if (
      !record ||
      typeof record !== 'object' ||
      !['planId', 'contextKey', 'ruleVersion', 'adapterRevision'].every(
        (key) => typeof record[key] === 'string',
      ) ||
      !['passed', 'failed'].includes(record.result) ||
      !Array.isArray(record.references) ||
      !record.references.every((ref: unknown) => typeof ref === 'string') ||
      !Array.isArray(record.works) ||
      !record.works.every(
        (work: Record<string, unknown>) =>
          work &&
          ['id', 'sourceRevision', 'contentRevision', 'capabilityRevision'].every(
            (key) => typeof work[key] === 'string',
          ),
      )
    )
      throw new Error('示例验证材料不完整。');
  }
  return proof as { adapterRevision: string; records: VerificationRecord[] };
}
export function DemoTask({ kind, reduced }: { kind: DemoKind; reduced: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [material, setMaterial] = useState<{
    entry: Record<string, unknown>;
    plan: ReturnType<typeof demoPlan> & { verification: VerificationRecord | null };
  } | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [form, setForm] = useState({ placement: '', changes: '', goalId: 'faithful' });
  useEffect(() => {
    const controller = new AbortController();
    const json = async (url: string) => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('示例任务暂时无法加载。');
      return response.json();
    };
    setMaterial(null);
    setError('');
    void Promise.all([
      json('/content/capabilities.json'),
      json('/content/demo-proof.json'),
      json('/content/catalog.json'),
    ])
      .then(async ([rawWorks, rawProof, rawCatalog]) => {
        const works = validateCapabilities(rawWorks);
        const plan = demoPlan(works, kind, reduced ? 'reduced' : 'normal');
        const proof = proofRecords(rawProof);
        const record =
          proof.records.find((record) =>
            verificationCurrent(plan, record, proof.adapterRevision),
          ) || null;
        const first = plan.steps.find((step) => step.work)?.work;
        const item = validateCatalog(rawCatalog).find((item) => item.id === first?.id);
        if (!item) throw new Error('示例缺少来源材料。');
        const entry = validateDetail(await json(`/content/${item.slug}.json`), item);
        if (!controller.signal.aborted)
          setMaterial({
            entry,
            plan: {
              ...plan,
              status: record ? 'verified' : 'needs-adaptation',
              verification: record,
            },
          });
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => controller.abort();
  }, [kind, reduced, retry]);
  return (
    <div className="demo-task" data-plan-id={material?.plan.id}>
      {error ? (
        <p>
          {error} <button onClick={() => setRetry((value) => value + 1)}>重试示例任务</button>
        </p>
      ) : (
        <>
          <button
            className="journey-back"
            disabled={!material}
            onClick={() => dialog.current?.showModal()}
          >
            复制这条示例的任务
          </button>
          <p className="quiet-note">
            {material?.plan.verification
              ? '此固定示例的当前版本已通过本地完整回归；你的项目仍需接入验证。'
              : '这是当前示例使用的固定路径；本次构建尚无相符的完整回归记录。'}
          </p>
        </>
      )}
      {material && (
        <PromptDialog
          dialogRef={dialog}
          entry={material.entry}
          form={form}
          compose={material.plan}
          onFormChange={setForm}
        />
      )}
    </div>
  );
}
