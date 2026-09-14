import { useEffect, useState } from 'react';
import { CaseView } from './CaseView.jsx';
import { validateCatalog, validateDetail } from './catalog';
import { JourneyLoader } from './JourneyLoader.jsx';
const readLocation = () => {
  const params = new URLSearchParams(location.search);
  const kind = params.get('journey');
  return {
    slug: params.get('case') || 'staggered-page-transition',
    journey: ['portfolio', 'product', 'tool'].includes(kind) ? kind : null,
  };
};
export function App() {
  const [route, setRoute] = useState(readLocation);
  const [catalog, setCatalog] = useState([]);
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [states, setStates] = useState({});
  useEffect(() => {
    const abort = new AbortController();
    setError('');
    fetch('/content/catalog.json', { signal: abort.signal })
      .then((response) => {
        if (!response.ok) throw new Error('作品目录无法加载。');
        return response.json();
      })
      .then((value) => {
        if (!abort.signal.aborted) setCatalog(validateCatalog(value));
      })
      .catch((reason) => {
        if (!abort.signal.aborted) setError(reason.message);
      });
    return () => abort.abort();
  }, [retry]);
  useEffect(() => {
    if (!catalog.length || route.journey) return;
    const item = catalog.find((item) => item.slug === route.slug);
    if (!item) {
      setEntry(null);
      setError('找不到这个作品。');
      return;
    }
    const abort = new AbortController();
    setEntry(null);
    setError('');
    fetch(`/content/${item.slug}.json`, { signal: abort.signal })
      .then((response) => {
        if (!response.ok) throw new Error('作品材料暂时无法加载。');
        return response.json();
      })
      .then((value) => {
        if (!abort.signal.aborted) setEntry(validateDetail(value, item));
      })
      .catch((reason) => {
        if (!abort.signal.aborted) setError(reason.message);
      });
    return () => abort.abort();
  }, [route, catalog, retry]);
  useEffect(() => {
    document.title =
      (route.journey ? '组合体验' : entry?.title || '作品学习') + ' · Great UI 工作台 — VIBES';
  }, [entry, route.journey]);
  useEffect(() => {
    const url = new URL(location.href);
    if (url.searchParams.has('view')) {
      url.searchParams.delete('view');
      history.replaceState(null, '', url);
    }
    const restore = () => {
      setRoute(readLocation());
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  function navigate(patch) {
    const url = new URL(location.href);
    const next = { ...route, ...patch };
    url.searchParams.set('case', next.slug);
    if (next.journey) url.searchParams.set('journey', next.journey);
    else url.searchParams.delete('journey');
    url.searchParams.delete('project');
    if (url.href !== location.href) history.pushState(null, '', url);
    setRoute(next);
    window.scrollTo(0, 0);
  }
  const state =
    entry &&
    (states[entry.id] || {
      section: 'learn',
      form: { placement: '', changes: '', goalId: 'faithful' },
    });
  return (
    <main className="app-shell">
      {route.journey ? (
        <JourneyLoader kind={route.journey} onExit={() => navigate({ journey: null })} />
      ) : error ? (
        <div className="load-state" role="alert">
          <p>{error}</p>
          <button onClick={() => setRetry((value) => value + 1)}>重新加载</button>
          <button onClick={() => navigate({ slug: 'staggered-page-transition' })}>
            回到首个作品
          </button>
        </div>
      ) : !entry ? (
        <p role="status">正在加载作品材料…</p>
      ) : (
        <CaseView
          key={entry.id}
          entry={entry}
          entries={catalog}
          onSelect={(item) => navigate({ slug: item.slug })}
          onStartJourney={(journey) => navigate({ journey })}
          state={state}
          onChange={(patch) => setStates((all) => ({ ...all, [entry.id]: { ...state, ...patch } }))}
        />
      )}
    </main>
  );
}
