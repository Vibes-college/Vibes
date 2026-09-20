import { useAssetBase } from '../AssetContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Transition, type TransitionPhase } from './Transition';
import { TextReveal } from './TextReveal';
import { Accordion } from './Accordion';
import { isProjectData, type ProjectData } from './data';

const projectList = [
  { id: 'field-notes', title: '山野手记', type: '编辑设计' },
  { id: 'quiet-work', title: '专注时刻', type: '产品设计' },
];

export function Portfolio({ reduced }: { reduced: boolean }) {
  const assetBase = useAssetBase();
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [ready, setReady] = useState<{
    data: ProjectData | null;
    id: string | null;
    push: boolean;
  } | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [contact, setContact] = useState(false);
  const generation = useRef(0);
  const [epoch, setEpoch] = useState(0);
  const request = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const focusAfter = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const motionPreference = useRef(reduced);
  const directNavigation = useRef(reduced);
  motionPreference.current = reduced;

  const open = useCallback(async (id: string | null, push = true) => {
    if (push && busy.current) return;
    request.current?.abort();
    setEpoch(++generation.current);
    const controller = new AbortController();
    request.current = controller;
    busy.current = true;
    setPending(true);
    setError('');
    setReady(null);
    setContact(false);
    directNavigation.current = motionPreference.current;
    setPhase(motionPreference.current ? 'covered' : 'covering');
    try {
      let data: ProjectData | null = null;
      if (id) {
        if (!projectList.some((item) => item.id === id)) throw new Error('未找到这个示例项目。');
        const response = await fetch(`${assetBase}/journeys/${id}.json`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('项目暂时无法打开，请重试。');
        const value: unknown = await response.json();
        if (!isProjectData(value) || value.id !== id) throw new Error('项目资料不完整，请重试。');
        data = value;
      }
      if (controller.signal.aborted) return;
      setReady({ data, id, push });
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : '项目暂时无法打开。');
      setPhase('idle');
      setPending(false);
      busy.current = false;
    }
  }, []);

  // Changing the preference completes the visual handoff without aborting the data request.
  useEffect(() => {
    if (!reduced) return;
    directNavigation.current = true;
    if (phase === 'covering') setPhase('covered');
    if (phase === 'revealing') {
      setPhase('idle');
      setPending(false);
      busy.current = false;
    }
  }, [reduced, phase]);

  useEffect(() => {
    if (phase !== 'covered' || !ready) return;
    setProject(ready.data);
    if (ready.push) {
      const url = new URL(location.href);
      if (ready.id) url.searchParams.set('project', ready.id);
      else url.searchParams.delete('project');
      history.pushState(history.state, '', url);
    }
    setReady(null);
    focusAfter.current = true;
    window.scrollTo(0, 0);
    setPhase(directNavigation.current || reduced ? 'idle' : 'revealing');
    if (directNavigation.current || reduced) {
      setPending(false);
      busy.current = false;
    }
  }, [phase, ready, reduced]);

  useEffect(() => {
    if (phase === 'idle' && focusAfter.current) {
      focusAfter.current = false;
      heading.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  useEffect(() => {
    const restore = () => {
      if (new URLSearchParams(location.search).get('journey') === 'portfolio')
        void open(new URLSearchParams(location.search).get('project'), false);
    };
    if (new URLSearchParams(location.search).get('project')) restore();
    window.addEventListener('popstate', restore);
    window.addEventListener('great-ui:location', restore);
    return () => {
      request.current?.abort();
      window.removeEventListener('popstate', restore);
      window.removeEventListener('great-ui:location', restore);
    };
  }, [open]);

  function cancel() {
    request.current?.abort();
    setEpoch(++generation.current);
    setReady(null);
    setPending(false);
    setPhase('idle');
    busy.current = false;
    focusAfter.current = true;
  }

  return (
    <div className="journey-portfolio" data-phase={phase} data-project={project?.id || 'list'}>
      {pending && (
        <div className="journey-wait" role="status">
          正在打开项目… <button onClick={cancel}>取消</button>
        </div>
      )}
      {error && (
        <p className="journey-error" role="alert">
          {error} 当前内容仍可继续使用。
        </p>
      )}
      <div inert={pending}>
        {project ? (
          <>
            <button className="journey-back" onClick={() => void open(null)}>
              ← 全部项目
            </button>
            <p className="journey-kicker">{project.kicker}</p>
            <h1 ref={heading} tabIndex={-1}>
              {project.title}
            </h1>
            {phase === 'idle' ? (
              <TextReveal key={project.id} text={project.intro} reduced={reduced} />
            ) : (
              <p className="journey-intro">{project.intro}</p>
            )}
            <section className="journey-outcome">
              <h2>{project.outcome}</h2>
              <ul>
                {project.facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </section>
            <section className="journey-faq">
              <h2>再了解一点</h2>
              <Accordion key={project.id} items={project.questions} reduced={reduced} />
            </section>
            <section className="journey-contact">
              <h2>把想法带到下一步</h2>
              <button className="primary-button" onClick={() => setContact(true)}>
                查看联系信息
              </button>
              {contact && (
                <p role="status">
                  示例邮箱：hello@example.test。此页面仅演示联系入口，没有发送消息。
                </p>
              )}
            </section>
          </>
        ) : (
          <>
            <p className="journey-kicker">选一个项目，走完这条路径</p>
            <h1 ref={heading} tabIndex={-1}>
              让每一步都有理由。
            </h1>
            <p className="journey-lead">进入项目，读懂设计，再找到你关心的答案。</p>
            <div className="journey-projects">
              {projectList.map((item, index) => (
                <a
                  key={item.id}
                  href={`?case=staggered-page-transition&journey=portfolio&project=${item.id}`}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    void open(item.id);
                  }}
                >
                  <div className={`journey-project-art art-${index}`} aria-hidden="true">
                    <span>{index === 0 ? '山 / 野' : '专 / 注'}</span>
                  </div>
                  <small>{item.type}</small>
                  <h2>
                    {item.title} <span aria-hidden="true">↗</span>
                  </h2>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
      {!reduced && !directNavigation.current && (
        <Transition
          key={epoch}
          phase={phase}
          onCovered={() => {
            if (epoch === generation.current)
              setPhase((current) => (current === 'covering' ? 'covered' : current));
          }}
          onRevealed={() => {
            if (
              epoch !== generation.current ||
              motionPreference.current ||
              directNavigation.current
            )
              return;
            setPhase('idle');
            setPending(false);
            busy.current = false;
          }}
        />
      )}
    </div>
  );
}
