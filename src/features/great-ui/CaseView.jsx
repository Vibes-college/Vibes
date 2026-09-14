import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, WandSparkles, Blocks } from 'lucide-react';
import { TermProvider, Term, RichText } from './Terms.jsx';
import { Recording } from './Recording.jsx';
import { PromptDialog } from './PromptDialog.jsx';
import { CaseNavigation } from './CaseNavigation.jsx';
import { Taxonomy } from './Taxonomy.jsx';
import { CompositionPanel } from './composition/CompositionPanel';

export function CaseView({ entry, entries, state, onChange, onSelect, onStartJourney }) {
  const { section, form } = state;
  const task = useRef(null);
  const [compose, setCompose] = useState(false);
  const guide = entry.learning;
  const goal = guide.goals.find((item) => item.id === form.goalId) || guide.goals[0];
  const openTask = (combined = null) => {
    setCompose(combined);
    task.current.showModal();
  };
  return (
    <TermProvider entry={entry}>
      <div className="lab-grid">
        <section className="showcase" aria-label="案例预览">
          <Recording entry={entry} />
          <CaseNavigation entries={entries} current={entry} onSelect={onSelect} />
          <div className="case-info">
            <h1>{entry.title}</h1>
            <p className="effect-description">{entry.summary}</p>
            <div className="source-row">
              <a href={entry.reference} target="_blank" rel="noreferrer">
                原作 <ArrowUpRight size={12} />
              </a>
              <a href={entry.source} target="_blank" rel="noreferrer">
                源码 <ArrowUpRight size={12} />
              </a>
              <span>by Great UI</span>
            </div>
          </div>
          <Taxonomy entry={entry} />
          <button className="use-button" onClick={() => openTask()}>
            <span>用这个效果</span>
            <span>
              复制给 Agent <ArrowRight size={16} />
            </span>
          </button>
        </section>
        <section className="reading" aria-label="学习、使用与组合">
          <nav className="reading-tabs" aria-label="案例内容">
            {[
              { id: 'learn', title: '拆解设计', icon: BookOpen },
              { id: 'use', title: '改造设计', icon: WandSparkles },
              { id: 'compose', title: '串联设计', icon: Blocks },
            ].map(({ id, title, icon: Icon }) => (
              <button
                key={id}
                aria-pressed={section === id}
                onClick={() => onChange({ section: id })}
              >
                <Icon size={14} />
                {title}
              </button>
            ))}
          </nav>
          {section === 'learn' && (
            <div className="reading-body">
              {entry.sections.map((s, i) => (
                <section className="explanation" key={s.title}>
                  <span className="section-number">0{i + 1}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>
                      <RichText text={s.text} />
                    </p>
                  </div>
                </section>
              ))}
              <div className="judgment">
                <h3>适合用在哪里</h3>
                <p>{entry.suitable}</p>
                <h3>什么时候不用</h3>
                <p>{entry.avoid}</p>
              </div>
              <div className="practice">
                <h3>试一次，就会更懂</h3>
                <p>{guide.practice}</p>
              </div>
              {entry.related && (
                <div className="related-learning">
                  {entry.related.alternatives.length > 0 && (
                    <>
                      <h3>可以比较的同类作品</h3>
                      <p>承担相近角色，按内容和操作方式选择。</p>
                      {entry.related.alternatives.map((item) => (
                        <button
                          key={item.slug}
                          className="related-case"
                          onClick={() => onSelect(item)}
                        >
                          {item.title} →
                        </button>
                      ))}
                    </>
                  )}
                  {entry.related.principles.length > 0 && (
                    <>
                      <h3>同一个原理，还能怎样用</h3>
                      {entry.related.principles.map((item) => (
                        <button
                          key={item.slug}
                          className="related-case"
                          onClick={() => onSelect(item)}
                        >
                          {item.title}
                          <small>{item.shared.join(' · ')}</small>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
              <div className="term-index">
                <span className="eyebrow">相关概念</span>
                <div>
                  {entry.terms.map((id) => (
                    <Term key={id} id={id} />
                  ))}
                </div>
              </div>
            </div>
          )}
          {section === 'use' && (
            <div className="reading-body agent-guide">
              <h3>你想改善什么？</h3>
              <div className="goal-options">
                {guide.goals.map((item) => (
                  <button
                    key={item.id}
                    aria-pressed={goal.id === item.id}
                    onClick={() => onChange({ form: { ...form, goalId: item.id } })}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
              <div className="goal-detail">
                <h4>让 Agent 这样改</h4>
                <p>{goal.action}</p>
                <h4>改好后看什么</h4>
                <p>{goal.judge}</p>
              </div>
              <button className="primary-button wide" onClick={() => openTask()}>
                生成修改任务 <ArrowRight size={15} />
              </button>
              <details className="adjustment-reference">
                <summary>可以改哪些地方</summary>
                {guide.adjustments.map(([title, source, note]) => (
                  <div className="adjustment" key={title}>
                    <h4>{title}</h4>
                    <p>{note}</p>
                    <code>{source}</code>
                  </div>
                ))}
              </details>
              <details className="adjustment-reference">
                <summary>需要保留的关系与检查</summary>
                <p>
                  {goal.id === 'compare'
                    ? '允许多项展开时，有意替换原作的单项规则；标题可见、状态清楚和答案可操作仍需保留。'
                    : entry.preserve.join('；') + '。'}
                </p>
                <ul>
                  {entry.checks
                    .filter((c) => goal.id !== 'compare' || !c.includes('初始第二项'))
                    .map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                </ul>
              </details>
            </div>
          )}
          {section === 'compose' && (
            <CompositionPanel
              entryId={entry.id}
              settings={state.composer}
              onSettings={(composer) => onChange({ composer })}
              onTask={openTask}
              onSelect={onSelect}
              onStartJourney={onStartJourney}
            />
          )}
        </section>
      </div>
      <PromptDialog
        dialogRef={task}
        entry={entry}
        form={form}
        compose={compose}
        onFormChange={(form) => onChange({ form })}
      />
    </TermProvider>
  );
}
