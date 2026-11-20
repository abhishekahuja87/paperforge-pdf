import { useSyncExternalStore } from 'react';

/** The tools a visitor pinned and the ones they opened lately. Kept only in this browser's local storage. */
export interface MyTools { recent: string[]; pinned: string[] }

const RECENT_KEY = 'mdu_recent_tools';
const PINNED_KEY = 'mdu_pinned_tools';
const MAX_RECENT = 8;
const MAX_PINNED = 24;
const EMPTY: MyTools = { recent: [], pinned: [] };

let state: MyTools | null = null;
const listeners = new Set<() => void>();

const read = (key: string): string[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 40) : [];
  } catch { return []; }
};
const write = (key: string, list: string[]) => { try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* storage blocked: the lists still work until the page closes */ } };

export const getMyTools = (): MyTools => (state ??= { recent: read(RECENT_KEY), pinned: read(PINNED_KEY) });

function commit(next: MyTools) {
  const before = getMyTools();
  state = next;
  if (next.recent !== before.recent) write(RECENT_KEY, next.recent);
  if (next.pinned !== before.pinned) write(PINNED_KEY, next.pinned);
  listeners.forEach((listener) => listener());
}

export function recordVisit(id: string): void {
  const current = getMyTools();
  if (current.recent[0] === id) return;
  commit({ ...current, recent: [id, ...current.recent.filter((item) => item !== id)].slice(0, MAX_RECENT) });
}

export function togglePin(id: string): void {
  const current = getMyTools();
  const pinned = current.pinned.includes(id) ? current.pinned.filter((item) => item !== id) : [id, ...current.pinned].slice(0, MAX_PINNED);
  commit({ ...current, pinned });
}

export function clearMyTools(): void { commit({ recent: [], pinned: [] }); }

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === RECENT_KEY || event.key === PINNED_KEY || event.key === null) { state = { recent: read(RECENT_KEY), pinned: read(PINNED_KEY) }; listener(); }
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(listener); window.removeEventListener('storage', onStorage); };
}

export const useMyTools = (): MyTools => useSyncExternalStore(subscribe, getMyTools, () => EMPTY);
