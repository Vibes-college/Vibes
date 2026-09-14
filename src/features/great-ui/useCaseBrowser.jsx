import { useEffect, useRef, useState } from 'react';
import { currentBrowseId } from './browsing';
import { readBrowse, saveBrowse } from './browse-storage';

// Access storage inside the guarded methods: even obtaining localStorage can
// throw in a restricted browser. In-memory fallback keeps this visit usable.
const memory = new Map();
const storage = (name) => ({
  getItem(key) {
    try {
      return memory.get(key) ?? window[name].getItem(key);
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem(key, value) {
    memory.set(key, value);
    try {
      window[name].setItem(key, value);
    } catch {
      // Navigation remains available when storage is blocked or full.
    }
  },
});
const ports = () => ({
  history: window.history,
  session: storage('sessionStorage'),
  local: storage('localStorage'),
});

export function useCaseBrowser(entries, current, onSelect) {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigating = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    const next = readBrowse(entries, current.id, ports());
    setState(next);
    saveBrowse(next, ports());
    navigating.current = false;
    setBusy(false);
    return () => {
      generation.current++;
    };
  }, [entries, current.id]);
  const apply = async (next) => {
    if (!state || navigating.current) return;
    setError('');
    if (currentBrowseId(next) === current.id) {
      setState(next);
      saveBrowse(next, ports());
      return;
    }
    navigating.current = true;
    const attempt = generation.current;
    setBusy(true);
    saveBrowse(next, ports(), false);
    try {
      await onSelect(entries.find((entry) => entry.id === currentBrowseId(next)));
    } catch {
      if (generation.current === attempt) {
        saveBrowse(state, ports());
        setError('作品暂时无法打开，请重试。');
      }
    } finally {
      if (generation.current === attempt) {
        navigating.current = false;
        setBusy(false);
      }
    }
  };
  return { state, busy, error, apply };
}
