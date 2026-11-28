import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

function load<T>(key: string, initial: T, read: (value: unknown) => T | null): T {
  try {
    const raw = window.localStorage.getItem(key);
    return (raw ? read(JSON.parse(raw)) : null) ?? initial;
  } catch {
    return initial;
  }
}

/**
 * State kept in localStorage on this device. Falls back to plain state when the browser refuses storage.
 * When the key changes (for example the same page reused for another route) the state is reloaded for the
 * new key, so data saved for one key can never be written under another.
 */
export function usePersisted<T>(key: string, initial: T, read: (value: unknown) => T | null): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<{ key: string; value: T }>(() => ({ key, value: load(key, initial, read) }));
  const current = state.key === key ? state.value : load(key, initial, read);
  const latest = useRef(current);
  latest.current = current;
  useEffect(() => {
    if (state.key !== key) setState({ key, value: latest.current });
  }, [key, state.key]);
  // The key the person has changed something under. Opening a page writes nothing until a change is made, so a
  // visit alone leaves no saved data behind; once something is saved, later changes keep updating it.
  const touched = useRef<string | null>(null);
  useEffect(() => {
    try {
      if (touched.current !== key && window.localStorage.getItem(key) === null) return;
      window.localStorage.setItem(key, JSON.stringify(current));
    } catch { /* still works without saving */ }
  }, [key, current]);
  const set: Dispatch<SetStateAction<T>> = (next) => {
    touched.current = key;
    setState((prev) => {
      const base = prev.key === key ? prev.value : load(key, initial, read);
      return { key, value: typeof next === 'function' ? (next as (v: T) => T)(base) : next };
    });
  };
  return [current, set];
}
