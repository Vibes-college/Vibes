import { useState } from 'react';
import { Accordion } from './Accordion';

const plans = [
  {
    id: 'solo',
    name: '个人整理',
    description: '把自己的资料整理清楚。',
    features: ['一个个人空间', '按主题归档', '随时调整结构'],
  },
  {
    id: 'team',
    name: '共同整理',
    description: '和伙伴一起形成共享资料。',
    features: ['一个共享空间', '共同维护目录', '讨论与审阅流程'],
  },
];

export function Product({ reduced }: { reduced: boolean }) {
  const [selected, setSelected] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="journey-product">
      <p className="journey-kicker">产品介绍 · 简化组合示例</p>
      <h1>让好资料，成为下一步的起点。</h1>
      <p className="journey-lead">
        先说明价值，再并排比较，最后作出选择。这里保留直接可读的文字，省略全屏转场与逐字揭示。
      </p>
      <section aria-labelledby="plan-title">
        <h2 id="plan-title">哪种方式更适合你？</h2>
        <div className="journey-plans">
          {plans.map((plan) => (
            <div className="journey-plan" key={plan.id} data-selected={selected === plan.id}>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                className="primary-button"
                aria-pressed={selected === plan.id}
                onClick={() => {
                  setSelected(plan.id);
                  setConfirmed(false);
                }}
              >
                选择{plan.name}
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="journey-faq">
        <h2>把疑问放在一起比较</h2>
        <Accordion
          multiple
          reduced={reduced}
          items={[
            {
              title: '个人整理适合谁？',
              description:
                '主要由自己收集与维护资料、暂时没有协作需要的人。这个答案可以和下一项同时打开。',
            },
            {
              title: '共同整理适合谁？',
              description:
                '需要多人维护目录、讨论材料并分工的人。主要区别直接列在方案卡片上，没有藏进问答。',
            },
            {
              title: '确认后会发生什么？',
              description:
                '本地示例会显示你的选择结果，不创建账号、不下单。你可以返回比较并更改选择。',
            },
          ]}
        />
      </section>
      <section className="journey-selection" aria-label="确认方案">
        {selected ? (
          <>
            <p>
              当前选择：<strong>{plans.find((plan) => plan.id === selected)?.name}</strong>
            </p>
            <button className="primary-button" onClick={() => setConfirmed(true)}>
              确认选择
            </button>
          </>
        ) : (
          <p>先选择一个适合自己的方案。</p>
        )}
        {confirmed && (
          <p role="status">
            已确认：{plans.find((plan) => plan.id === selected)?.name}
            。你可以继续更改，本次选择仅保留在当前体验中。
          </p>
        )}
      </section>
    </div>
  );
}
