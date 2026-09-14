import { useEffect, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { CaseView } from './CaseView.jsx';
import { AssetContext } from './AssetContext';
import { JourneyLoader } from './JourneyLoader.jsx';
import './styles.css';

// Module state survives Astro navigation, but contains no account or server data.
const drafts = new Map();
const initial = () => ({
  section: 'learn',
  form: { placement: '', changes: '', goalId: 'faithful' },
});

export default function LearningPage({ entry, entries }) {
  const [state, setState] = useState(initial);
  const [journey, setJourney] = useState(null);
  useEffect(() => {
    setState(drafts.get(entry.id) || initial());
    const pathname = location.pathname;
    const restore = () => {
      const kind = new URLSearchParams(location.search).get('journey');
      setJourney(['portfolio', 'product', 'tool'].includes(kind) ? kind : null);
    };
    const localHistory = (event) => {
      if (location.pathname !== pathname) return;
      // Astro owns navigation between pages. Query changes belong to this island;
      // avoid remounting it while its own transition is restoring a project.
      event.stopImmediatePropagation();
      restore();
      window.dispatchEvent(new window.Event('great-ui:location'));
    };
    restore();
    window.addEventListener('popstate', localHistory, true);
    return () => window.removeEventListener('popstate', localHistory, true);
  }, [entry.id]);
  const change = (patch) =>
    setState((previous) => {
      const next = { ...previous, ...patch };
      drafts.set(entry.id, next);
      return next;
    });
  const showJourney = (kind) => {
    const url = new URL(location.href);
    if (kind) url.searchParams.set('journey', kind);
    else url.searchParams.delete('journey');
    url.searchParams.delete('project');
    history.pushState(history.state, '', url);
    setJourney(kind);
    window.scrollTo(0, 0);
  };
  return (
    <AssetContext.Provider value="/great-ui">
      <div className="great-ui">
        <div className="app-shell">
          {journey ? (
            <JourneyLoader kind={journey} onExit={() => showJourney(null)} />
          ) : (
            <CaseView
              entry={entry}
              entries={entries}
              state={state}
              onChange={change}
              onSelect={(item) => navigate(`/zh/works/great-ui-${item.slug}/`)}
              onStartJourney={showJourney}
            />
          )}
        </div>
      </div>
    </AssetContext.Provider>
  );
}
