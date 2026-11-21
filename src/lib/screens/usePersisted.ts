import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/** State kept in localStorage on this device. Falls back to plain state when the browser refuses storage. */
export function usePersisted<T>(key: string, initial: T, read: (value: unknown) => T | null): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return (raw ? read(JSON.parse(raw)) : null) ?? initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* still works without saving */ }
  }, [key, value]);
  return [value, setValue];
}
