import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  browseMembers,
  createBrowse,
  currentBrowseId,
  moveBrowse,
  nextBrowseId,
  restartBrowse,
  restoreBrowse,
  selectBrowse,
  toggleBrowse,
  type BrowseState,
} from '../../src/features/great-ui/browsing.ts';
import {
  browseHistoryKey,
  browsePreferencesKey,
  browseSessionKey,
  readBrowse,
  saveBrowse,
} from '../../src/features/great-ui/browse-storage.ts';
import { index } from '../../src/features/great-ui/content-build.mjs';

const entries = [
  { id: 'a1', category: 'A' },
  { id: 'a2', category: 'A' },
  { id: 'b1', category: 'B' },
  { id: 'b2', category: 'B' },
  { id: 'c1', category: 'C' },
];
function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test('first-time browsing follows the learning order and ends without wrapping', () => {
  let state = createBrowse(index, index[0].id);
  assert.equal(state.shuffle, false);
  for (const entry of index.slice(1)) {
    assert.equal(nextBrowseId(state, index), entry.id);
    state = moveBrowse(state, index, 1);
  }
  assert.equal(nextBrowseId(state, index), undefined);
  assert.deepEqual(
    state.trail,
    index.map((entry) => entry.id),
  );
  assert.equal(currentBrowseId(restartBrowse(state, index)), index[0].id);
});

test('selected random rounds cover all 48 works once and prefer another available category', () => {
  const before = structuredClone(index);
  for (let seed = 1; seed <= 30; seed++) {
    let state = createBrowse(index, index[seed].id, { scope: 'all', shuffle: true }, random(seed));
    assert.equal(state.scope, 'all');
    assert.equal(state.shuffle, true);
    const viewed = new Set([currentBrowseId(state)]);
    while (nextBrowseId(state, index)) {
      const category = index.find((entry) => entry.id === currentBrowseId(state))!.category;
      const different = index.some((entry) => !viewed.has(entry.id) && entry.category !== category);
      state = moveBrowse(state, index, 1);
      const id = currentBrowseId(state);
      assert.ok(!viewed.has(id));
      if (different) assert.notEqual(index.find((entry) => entry.id === id)!.category, category);
      viewed.add(id);
      assert.ok(restoreBrowse(state, index));
    }
    assert.equal(viewed.size, 48);
    assert.deepEqual(moveBrowse(state, index, 1), state);
    const next = restartBrowse(state, index, random(seed + 1));
    assert.notEqual(currentBrowseId(next), currentBrowseId(state));
    assert.equal(next.seen.length, 1);
    assert.equal(next.remaining.length, 47);
  }
  assert.deepEqual(index, before);
});

test('back and forward replay actual visits, including manually chosen works', () => {
  const start = createBrowse(entries, 'a1', undefined, random(7));
  const second = moveBrowse(start, entries, 1);
  const third = moveBrowse(second, entries, 1);
  const back = moveBrowse(third, entries, -1);
  assert.equal(currentBrowseId(back), currentBrowseId(second));
  assert.deepEqual(moveBrowse(back, entries, 1), third);
  const selected = selectBrowse(third, entries, 'a1', 'all', random(3));
  assert.equal(currentBrowseId(moveBrowse(selected, entries, -1)), currentBrowseId(third));
  assert.equal(new Set(selected.seen).size, 3);
  assert.ok(!selected.remaining.includes('a1'));
});

test('category selection anchors the chosen work and retains either browsing mode', () => {
  for (const shuffle of [true, false]) {
    let state = createBrowse(entries, 'b1', { scope: 'all', shuffle }, random(2));
    state = selectBrowse(state, entries, 'a1', 'A', random(2));
    assert.equal(state.scope, 'A');
    assert.equal(state.shuffle, shuffle);
    assert.equal(state.cursor, 0);
    assert.equal(browseMembers(entries, state.scope).length, 2);
    state = moveBrowse(state, entries, 1);
    assert.equal(currentBrowseId(state), 'a2');
    assert.equal(nextBrowseId(state, entries), undefined);
    state = selectBrowse(state, entries, 'b2');
    assert.equal(state.scope, 'all');
    assert.equal(currentBrowseId(state), 'b2');
  }
});

test('mode changes keep the current work and history, and shuffle excludes already seen works', () => {
  let state = createBrowse(entries, 'a1', { scope: 'all', shuffle: false });
  state = moveBrowse(state, entries, 1);
  state = moveBrowse(state, entries, 1);
  const before = structuredClone(state);
  state = toggleBrowse(state, entries, random(12));
  assert.equal(currentBrowseId(state), 'b1');
  assert.deepEqual(state.trail, before.trail);
  assert.equal(currentBrowseId(moveBrowse(state, entries, -1)), 'a2');
  assert.deepEqual(new Set(state.remaining), new Set(['b2', 'c1']));
  state = moveBrowse(state, entries, -1);
  state = toggleBrowse(state, entries);
  assert.equal(currentBrowseId(state), 'a2');
  assert.equal(nextBrowseId(state, entries), 'b1');
  assert.ok(restoreBrowse(state, entries));
});

test('one-work scopes terminate safely and sequential restart uses catalog order', () => {
  const single = createBrowse(entries, 'c1', { scope: 'C', shuffle: true });
  assert.equal(nextBrowseId(single, entries), undefined);
  assert.deepEqual(moveBrowse(single, entries, -1), single);
  assert.deepEqual(restartBrowse(single, entries), single);
  const ordered = createBrowse(entries, 'c1', { scope: 'all', shuffle: false });
  assert.equal(nextBrowseId(ordered, entries), undefined);
  assert.equal(currentBrowseId(restartBrowse(ordered, entries)), 'a1');
  assert.throws(() => createBrowse([], 'missing'));
});

test('restoration rejects corrupt or stale catalog state without trusting stored IDs', () => {
  const state = createBrowse(entries, 'a1', { scope: 'all', shuffle: true }, random(1));
  const mutations: Partial<BrowseState>[] = [
    { scope: 'deleted' },
    { cursor: -1 },
    { cursor: 0.5 },
    { cursor: 100 },
    { trail: [] },
    { trail: Array(1001).fill('a1') },
    { seen: ['a1', 'a1'] },
    { remaining: ['a1', 'a2', 'b1', 'b2'] },
    { remaining: [] },
    { remaining: ['missing'] },
    { shuffle: false },
  ];
  for (const patch of mutations) assert.equal(restoreBrowse({ ...state, ...patch }, entries), null);
  assert.equal(restoreBrowse(null, entries), null);
  assert.equal(restoreBrowse({ ...state, seen: null }, entries), null);
  assert.equal(restoreBrowse(state, entries.slice(1)), null);
  assert.equal(restoreBrowse(state, [...entries, { id: 'new', category: 'A' }]), null);
});

function fakePorts() {
  const makeStorage = () => {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
    };
  };
  const history = {
    state: { index: 7, scrollY: 30 } as Record<string, unknown>,
    replaceState(value: Record<string, unknown>) {
      this.state = structuredClone(value);
    },
  };
  return { history, session: makeStorage(), local: makeStorage() };
}

test('page snapshots restore scope and order on reload and browser Back without corrupting Astro state', () => {
  const ports = fakePorts();
  const first = readBrowse(entries, 'a1', ports, random(4));
  saveBrowse(first, ports);
  const pageOne = structuredClone(ports.history.state);
  const next = moveBrowse(first, entries, 1);
  saveBrowse(next, ports, false);
  assert.deepEqual(ports.history.state, pageOne);
  // Astro can carry over old page fields when it creates the next history entry.
  const loaded = readBrowse(entries, currentBrowseId(next), ports);
  assert.deepEqual(loaded, next);
  saveBrowse(loaded, ports);
  assert.equal(ports.history.state.index, 7);
  assert.equal(ports.history.state.scrollY, 30);
  assert.deepEqual(readBrowse(entries, currentBrowseId(next), ports), next);
  ports.history.state = pageOne;
  assert.deepEqual(readBrowse(entries, 'a1', ports), first);
  // A rejected navigation restores the original session and page snapshot.
  saveBrowse(first, ports);
  assert.deepEqual(JSON.parse(ports.session.getItem(browseSessionKey)!), first);
  assert.deepEqual(ports.history.state[browseHistoryKey], first);
});

test('preferences survive a new session; invalid or inaccessible storage has safe defaults', () => {
  const ports = fakePorts();
  const scoped = createBrowse(entries, 'a1', { scope: 'A', shuffle: false });
  saveBrowse(scoped, ports);
  const nextVisit = { ...fakePorts(), local: ports.local };
  assert.equal(readBrowse(entries, 'a2', nextVisit).scope, 'A');
  assert.equal(readBrowse(entries, 'a2', nextVisit).shuffle, false);
  assert.equal(readBrowse(entries, 'b1', nextVisit).scope, 'all');
  nextVisit.local.setItem(
    browsePreferencesKey,
    JSON.stringify({ scope: 'old-category', shuffle: true }),
  );
  assert.equal(readBrowse(entries, 'a1', nextVisit).shuffle, true);
  assert.equal(readBrowse(entries, 'a1', nextVisit).scope, 'all');
  nextVisit.local.setItem(browsePreferencesKey, '{broken');
  nextVisit.session.setItem(browseSessionKey, 'null');
  assert.equal(readBrowse(entries, 'a1', nextVisit).shuffle, false);
  const blocked = {
    getItem() {
      throw new Error('storage denied');
    },
    setItem() {
      throw new Error('quota exceeded');
    },
  };
  const restricted = {
    local: blocked,
    session: blocked,
    history: { state: null, replaceState: blocked.setItem },
  };
  const state = readBrowse(entries, 'a1', restricted, random(1));
  assert.equal(state.scope, 'all');
  assert.equal(state.shuffle, false);
  assert.doesNotThrow(() => saveBrowse(state, restricted));
});
