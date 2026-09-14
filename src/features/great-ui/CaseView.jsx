import { useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, WandSparkles, Blocks } from 'lucide-react';
import { TermProvider, Term, RichText } from './Terms.jsx';
import { Recording } from './Recording.jsx';
import { PromptDialog } from './PromptDialog.jsx';
import { CaseNavigation } from './CaseNavigation.jsx';
import { Taxonomy } from './Taxonomy.jsx';
import { CompositionPanel } from './composition/CompositionPanel';
import { createTask } from './task.mjs';

export function CaseView({ entry, entries, state, onChange, onSelect, onStartJourney }) {
  const { section, form } = state;
  const task = useRef(null);
  const [compose, setCompose] = useState(false);
  const guide = entry.learning;
  const goal = guide.goals.find((item) => item.id === form.goalId) || guide.goals[0];
  const requirements = createTask(entry, form);
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
                    <div className="learning-prose">
                      <RichText text={s.text} />
                    </div>
                  </div>
                </section>
              ))}
              <div className="judgment">
                <h3>适合用在哪里</h3>
                <div className="learning-prose">
                  <RichText text={entry.suitable} />
                </div>
                <h3>什么时候不用</h3>
                <div className="learning-prose">
                  <RichText text={entry.avoid} />
                </div>
              </div>
              <div className="practice">
                <h3>试一次，就会更懂</h3>
                <div className="learning-prose">
                  <RichText text={guide.practice} />
                </div>
              </div>
              {entry.related && (
                <div className="related-learning">
                  {entry.related.alternatives.length > 0 && (
                    <section className="related-group" aria-label="相似作品">
                      <h3>相似作品</h3>
                      {entry.related.alternatives.map((item) => (
                        <button
                          key={item.slug}
                          className="related-work"
                          onClick={() => onSelect(item)}
                        >
                          <span className="related-work-name">{item.title}</span>
                          <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      ))}
                    </section>
                  )}
                  {entry.related.principles.length > 0 && (
                    <section className="related-group" aria-label="相同原理">
                      <h3>相同原理</h3>
                      {entry.related.principles.map((item) => (
                        <button
                          key={item.slug}
                          className="related-work"
                          onClick={() => onSelect(item)}
                        >
                          <span className="related-work-name">{item.title}</span>
                          <span className="related-work-note">{item.shared.join(' · ')}</span>
                          <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      ))}
                    </section>
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
              {guide.useIntro && (
                <div className="guide-intro learning-prose">
                  <RichText text={guide.useIntro} />
                </div>
              )}
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
                <p>{requirements.preserve.join('；')}</p>
                <ul>
                  {requirements.checks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </details>
            </div>
          )}
          {section === 'compose' && (
            <div>
              {guide.combinationIntro && (
                <div className="guide-intro learning-prose">
                  <RichText text={guide.combinationIntro} />
                </div>
              )}
              <CompositionPanel
                entryId={entry.id}
                settings={state.composer}
                onSettings={(composer) => onChange({ composer })}
                onTask={openTask}
                onSelect={onSelect}
                onStartJourney={onStartJourney}
              />
            </div>
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
