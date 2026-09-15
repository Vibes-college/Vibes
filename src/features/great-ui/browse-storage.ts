import {
  createBrowse,
  currentBrowseId,
  defaultBrowsePreferences,
  restoreBrowse,
  selectBrowse,
  type BrowseEntry,
  type BrowseState,
} from './browsing.ts';

export const browseSessionKey = 'vibes:great-ui:browse-session:v1';
export const browsePreferencesKey = 'vibes:great-ui:browse-preferences:v1';
export const browseHistoryKey = 'vibesGreatUiBrowse';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
type HistoryPort = Pick<History, 'state' | 'replaceState'>;

const safely = <T>(read: () => T, fallback: T): T => {
  try {
    return read();
  } catch {
    return fallback;
  }
};

export function readBrowse(
  entries: BrowseEntry[],
  current: string,
  ports: { history: HistoryPort; session: StoragePort; local: StoragePort },
  random = Math.random,
): BrowseState {
  const snapshot = restoreBrowse(ports.history.state?.[browseHistoryKey], entries);
  if (snapshot && currentBrowseId(snapshot) === current) return snapshot;
  const saved = restoreBrowse(
    safely(() => JSON.parse(ports.session.getItem(browseSessionKey) || 'null'), null),
    entries,
  );
  if (saved) return selectBrowse(saved, entries, current, saved.scope, random);
  const preferences = safely(
    () => JSON.parse(ports.local.getItem(browsePreferencesKey) || 'null'),
    null,
  );
  return createBrowse(
    entries,
    current,
    preferences && typeof preferences.scope === 'string' && typeof preferences.shuffle === 'boolean'
      ? preferences
      : defaultBrowsePreferences,
    random,
  );
}

export function saveBrowse(
  state: BrowseState,
  ports: { history: HistoryPort; session: StoragePort; local: StoragePort },
  snapshot = true,
) {
  safely(() => ports.session.setItem(browseSessionKey, JSON.stringify(state)), undefined);
  safely(
    () =>
      ports.local.setItem(
        browsePreferencesKey,
        JSON.stringify({ scope: state.scope, shuffle: state.shuffle }),
      ),
    undefined,
  );
  // Keep Astro's own history fields. Before navigation only stage the session;
  // the old page must retain its snapshot for the browser Back button.
  if (snapshot)
    safely(
      () => ports.history.replaceState({ ...ports.history.state, [browseHistoryKey]: state }, ''),
      undefined,
    );
}
