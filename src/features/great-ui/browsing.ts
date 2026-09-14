export interface BrowseEntry {
  id: string;
  category: string;
}

export interface BrowsePreferences {
  scope: string;
  shuffle: boolean;
}

export interface BrowseState extends BrowsePreferences {
  version: 1;
  trail: string[];
  cursor: number;
  seen: string[];
  remaining: string[];
}

export const defaultBrowsePreferences: BrowsePreferences = { scope: 'all', shuffle: true };
export const currentBrowseId = (state: BrowseState) => state.trail[state.cursor];
export const browseMembers = (entries: BrowseEntry[], scope: string) =>
  entries.filter((entry) => scope === 'all' || entry.category === scope);

// Shuffle within category buckets, then prefer a different category at each draw.
// This avoids repeats without retry loops, including an uneven or single-category catalog.
function randomOrder(entries: BrowseEntry[], previous: string, random: () => number): string[] {
  const buckets = new Map<string, string[]>();
  for (const entry of entries) {
    const bucket = buckets.get(entry.category) || [];
    bucket.push(entry.id);
    buckets.set(entry.category, bucket);
  }
  for (const bucket of buckets.values()) {
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }
  }
  const order: string[] = [];
  while (buckets.size) {
    const categories = [...buckets.keys()];
    const different = categories.filter((category) => category !== previous);
    const choices = different.length ? different : categories;
    previous = choices[Math.floor(random() * choices.length)];
    const bucket = buckets.get(previous)!;
    order.push(bucket.pop()!);
    if (!bucket.length) buckets.delete(previous);
  }
  return order;
}

function remainingOrder(state: BrowseState, entries: BrowseEntry[], random: () => number) {
  if (!state.shuffle) return [];
  const seen = new Set(state.seen);
  return randomOrder(
    browseMembers(entries, state.scope).filter((entry) => !seen.has(entry.id)),
    entries.find((entry) => entry.id === currentBrowseId(state))!.category,
    random,
  );
}

export function createBrowse(
  entries: BrowseEntry[],
  current: string,
  preferences = defaultBrowsePreferences,
  random = Math.random,
): BrowseState {
  const entry = entries.find((entry) => entry.id === current);
  if (!entry) throw new Error('当前作品不在目录中');
  const scope = preferences.scope === entry.category ? entry.category : 'all';
  const state: BrowseState = {
    version: 1,
    scope,
    shuffle: preferences.shuffle,
    trail: [current],
    cursor: 0,
    seen: [current],
    remaining: [],
  };
  return { ...state, remaining: remainingOrder(state, entries, random) };
}

export function nextBrowseId(state: BrowseState, entries: BrowseEntry[]): string | undefined {
  if (state.cursor < state.trail.length - 1) return state.trail[state.cursor + 1];
  if (state.shuffle) return state.remaining[0];
  const members = browseMembers(entries, state.scope);
  return members[members.findIndex((entry) => entry.id === currentBrowseId(state)) + 1]?.id;
}

function visit(state: BrowseState, id: string): BrowseState {
  // Bound a very long session while keeping the current round's seen set intact.
  const trail = [...state.trail.slice(0, state.cursor + 1), id].slice(-1000);
  return {
    ...state,
    trail,
    cursor: trail.length - 1,
    seen: state.seen.includes(id) ? state.seen : [...state.seen, id],
    remaining: state.remaining.filter((item) => item !== id),
  };
}

export function moveBrowse(state: BrowseState, entries: BrowseEntry[], direction: -1 | 1) {
  if (direction === -1) return { ...state, cursor: Math.max(0, state.cursor - 1) };
  if (state.cursor < state.trail.length - 1) return { ...state, cursor: state.cursor + 1 };
  const id = nextBrowseId(state, entries);
  return id ? visit(state, id) : state;
}

export function selectBrowse(
  state: BrowseState,
  entries: BrowseEntry[],
  id: string,
  scope = state.scope,
  random = Math.random,
) {
  if (scope !== state.scope || !browseMembers(entries, scope).some((entry) => entry.id === id))
    return createBrowse(entries, id, { scope, shuffle: state.shuffle }, random);
  if (id === currentBrowseId(state)) return state;
  const next = visit(state, id);
  return { ...next, remaining: remainingOrder(next, entries, random) };
}

export function toggleBrowse(state: BrowseState, entries: BrowseEntry[], random = Math.random) {
  const next = { ...state, shuffle: !state.shuffle, trail: state.trail.slice(0, state.cursor + 1) };
  return { ...next, remaining: remainingOrder(next, entries, random) };
}

export function restartBrowse(state: BrowseState, entries: BrowseEntry[], random = Math.random) {
  const members = browseMembers(entries, state.scope);
  const current = currentBrowseId(state);
  const first = state.shuffle
    ? randomOrder(
        members.filter((entry) => entry.id !== current),
        entries.find((entry) => entry.id === current)!.category,
        random,
      )[0] || current
    : members[0].id;
  return createBrowse(entries, first, state, random);
}

export function restoreBrowse(value: unknown, entries: BrowseEntry[]): BrowseState | null {
  if (!value || typeof value !== 'object') return null;
  const state = value as BrowseState;
  if (
    state.version !== 1 ||
    typeof state.shuffle !== 'boolean' ||
    (state.scope !== 'all' && !entries.some((entry) => entry.category === state.scope))
  )
    return null;
  const members = new Set(browseMembers(entries, state.scope).map((entry) => entry.id));
  const ids = (items: unknown, unique: boolean, max: number): items is string[] =>
    Array.isArray(items) &&
    items.length <= max &&
    items.every((id) => typeof id === 'string' && members.has(id)) &&
    (!unique || new Set(items).size === items.length);
  if (
    !ids(state.trail, false, 1000) ||
    !state.trail.length ||
    !ids(state.seen, true, members.size) ||
    !ids(state.remaining, true, members.size) ||
    !Number.isInteger(state.cursor) ||
    state.cursor < 0 ||
    state.cursor >= state.trail.length ||
    state.trail.some((id) => !state.seen.includes(id)) ||
    state.remaining.some((id) => state.seen.includes(id)) ||
    (state.shuffle
      ? state.remaining.length + state.seen.length !== members.size
      : state.remaining.length !== 0)
  )
    return null;
  return state;
}
