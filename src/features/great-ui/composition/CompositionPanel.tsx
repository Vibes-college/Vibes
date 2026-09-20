import { useAssetBase } from '../AssetContext';
import { useEffect, useMemo, useState } from 'react';
import { compose } from './planner';
import { validateCapabilities } from './validate';
import { defaultEnvironment, getTemplate, templates } from './templates';
import type { CompositionPlan, Environment, WorkCapability } from './model';
import './composition.css';

type Settings = { template: string; pinned: boolean; environment: Environment };
const initial: Settings = { template: 'portfolio', pinned: true, environment: defaultEnvironment };
export function CompositionPanel({
  entryId,
  settings = initial,
  onSettings,
  onTask,
  onSelect,
  onStartJourney,
}: {
  entryId: string;
  settings?: Settings;
  onSettings: (settings: Settings) => void;
  onTask: (plan: CompositionPlan & { handoffs: string[] }) => void;
  onSelect: (entry: { slug: string }) => void;
  onStartJourney: (id: string) => void;
}) {
  const assetBase = useAssetBase();
  const [works, setWorks] = useState<WorkCapability[]>([]);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setError('');
    fetch(assetBase + '/content/capabilities.json', { signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('组合材料无法加载。');
        const value = await response.json();
        const next = validateCapabilities(value);
        if (!abort.signal.aborted) setWorks(next);
      })
      .catch((reason) => {
        if (!abort.signal.aborted) setError(reason.message);
      });
    return () => abort.abort();
  }, [retry, assetBase]);
  const template = getTemplate(settings.template) || templates[0];
  const result = useMemo(
    () => compose(works, template, settings.environment, settings.pinned ? entryId : undefined),
    [works, template, settings, entryId],
  );
  function condition<K extends keyof Environment>(key: K, value: Environment[K]) {
    onSettings({ ...settings, environment: { ...settings.environment, [key]: value } });
  }
  return (
    <div className="reading-body composition">
      <h3>先选用户要完成的事</h3>
      <label className="field">
        操作路径
        <select
          value={template.id}
          onChange={(event) => onSettings({ ...settings, template: event.target.value })}
        >
          {templates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <label className="condition-check">
        <input
          type="checkbox"
          checked={settings.pinned}
          onChange={(event) => onSettings({ ...settings, pinned: event.target.checked })}
        />
        方案中保留当前作品
      </label>
      <details className="composition-conditions" open>
        <summary>按项目条件筛选</summary>
        <div className="condition-grid">
          <label>
            框架
            <select
              value={settings.environment.framework}
              onChange={(event) =>
                condition('framework', event.target.value as Environment['framework'])
              }
            >
              <option value="unknown">尚未确认</option>
              <option value="react">React</option>
              <option value="other">其他框架</option>
            </select>
          </label>
          <label>
            主要操作
            <select
              value={settings.environment.input}
              onChange={(event) => condition('input', event.target.value as Environment['input'])}
            >
              <option value="unknown">尚未确认</option>
              <option value="pointer">鼠标</option>
              <option value="touch">触摸与键盘</option>
            </select>
          </label>
          <label>
            外部数据
            <select
              value={settings.environment.externalData}
              onChange={(event) =>
                condition('externalData', event.target.value as Environment['externalData'])
              }
            >
              <option value="unknown">尚未确认</option>
              <option value="allowed">允许读取</option>
              <option value="blocked">不接外部服务</option>
            </select>
          </label>
          <label>
            操作频率
            <select
              value={settings.environment.navigation}
              onChange={(event) =>
                condition('navigation', event.target.value as Environment['navigation'])
              }
            >
              <option value="occasional">偶尔切换</option>
              <option value="frequent">频繁切换</option>
            </select>
          </label>
        </div>
        <label className="condition-check">
          <input
            type="checkbox"
            checked={settings.environment.motion === 'reduced'}
            onChange={(event) => condition('motion', event.target.checked ? 'reduced' : 'normal')}
          />
          需要减少动态效果
        </label>
        <label className="condition-check">
          <input
            type="checkbox"
            checked={settings.environment.allowAdaptation}
            onChange={(event) => condition('allowAdaptation', event.target.checked)}
          />
          允许必要改造和基础实现
        </label>
      </details>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => setRetry((value) => value + 1)}>重新加载组合材料</button>
        </div>
      ) : !works.length ? (
        <p role="status">正在读取组合条件…</p>
      ) : (
        <>
          {!result.plans.length && (
            <div className="plan-empty" role="status">
              <h4>当前条件下没有完整方案</h4>
              <p>
                {result.rejected.find((issue) => issue.code === 'pinned-incompatible')?.detail ||
                  '必需的操作环节缺少可用实现。请调整条件或允许添加基础实现。'}
              </p>
              <p>主题效果等辅助角色可以用于其他路径；这里不会为了凑组合改变它的能力。</p>
            </div>
          )}
          {result.plans.map((plan, index) => (
            <details className="composition-plan" key={plan.id} open={index === 0}>
              <summary>
                方案 {index + 1} · {plan.issues.length ? '需要适配或确认' : '待实际接入验证'}
              </summary>
              <ol className="recipe-steps">
                {plan.steps.map((step) => (
                  <li key={step.slot.id}>
                    <div>
                      <h4>{step.slot.title}</h4>
                      {step.work ? (
                        <button
                          className="related-case"
                          onClick={() => onSelect({ slug: step.work!.slug })}
                        >
                          {step.work.title} →
                        </button>
                      ) : (
                        <strong>{step.omitted ? '省略可选效果' : step.slot.base?.title}</strong>
                      )}
                      <p>{step.slot.purpose}</p>
                      {!step.work && !step.omitted && <p>{step.slot.base?.task}</p>}
                    </div>
                  </li>
                ))}
              </ol>
              <details className="plan-issues">
                <summary>必要条件与改造 · {plan.issues.length} 项</summary>
                <ul>
                  {plan.issues.map((issue, i) => (
                    <li key={i}>
                      <span>{issue.severity === 'unknown' ? '待确认' : '需改造'}：</span>
                      {issue.detail}
                    </li>
                  ))}
                </ul>
              </details>
              <p className="quiet-note">这是按已知能力筛选的建议，尚未在你的项目验证。</p>
              <button
                className="primary-button wide"
                onClick={() => onTask({ ...plan, handoffs: template.handoffs })}
              >
                生成这条路径的任务 →
              </button>
            </details>
          ))}
          {result.rejected.length > 0 && (
            <details className="plan-issues">
              <summary>为什么有些作品没选入</summary>
              <ul>
                {result.rejected.slice(0, 12).map((issue, index) => (
                  <li key={index}>{issue.detail}</li>
                ))}
              </ul>
              {result.rejected.length > 12 && (
                <p>另有 {result.rejected.length - 12} 条限制，保存在组合结果中。</p>
              )}
            </details>
          )}
        </>
      )}
      <div className="composition-examples">
        <h4>实际接好的三条示例</h4>
        <p>示例使用固定的作品与改造，不会随上方候选自动变成新实现。</p>
        {templates.map((item) => (
          <button key={item.id} className="related-case" onClick={() => onStartJourney(item.id)}>
            {item.title} ↗
          </button>
        ))}
      </div>
    </div>
  );
}
