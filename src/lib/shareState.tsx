import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Shareable, pre-filled links for the calculators.
 *
 * Wrap a calculator in <ShareProvider>. Each shared input (NumberField, SelectField, DateField, ChoiceButtons, or
 * any control that calls useShared) records its value and, when the page was opened from a shared link, takes the
 * value from the address once. Only plain numbers, dates and choices travel in the link, and nothing is sent to a
 * server.
 */
interface ShareContextValue {
  initial: URLSearchParams;
  values: Map<string, string>;
  /** The visible label of each shared field, for the result picture. */
  labels: Map<string, string>;
  /** The starting value each field had when it first appeared, so only what the person changed is remembered. */
  baseline: Map<string, string>;
  /** The element that holds the calculator, so the page can read its result boxes for the picture. */
  root: React.RefObject<HTMLDivElement | null>;
  /** Remembers the current inputs on this device. Does nothing when the page was opened from a shared link. */
  persist: () => void;
  /** Forgets the remembered inputs and puts every field back to its starting value. */
  reset: () => void;
}

const ShareContext = createContext<ShareContextValue | null>(null);

const SAVED_PREFIX = 'mdu.calc.v1:';

/** The inputs remembered for this calculator on this device, as address-style pairs. Empty when there are none or storage is blocked. */
function readSaved(path: string): URLSearchParams {
  const found = new URLSearchParams();
  try {
    const raw = window.localStorage.getItem(`${SAVED_PREFIX}${path}`);
    const data: unknown = raw ? JSON.parse(raw) : null;
    if (data && typeof data === 'object') {
      Object.entries(data as Record<string, unknown>).forEach(([key, value]) => { if (typeof value === 'string') found.set(key, value); });
    }
  } catch { /* nothing remembered */ }
  return found;
}

export const ShareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Bumping this remounts the calculator, which is how "Start again" puts every field back to its starting value.
  const [generation, setGeneration] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const value = useMemo<ShareContextValue>(() => {
    const path = typeof window === 'undefined' ? '' : window.location.pathname;
    const search = typeof window === 'undefined' ? '' : window.location.search;
    // A shared link wins over remembered numbers, and it never overwrites them.
    const fromLink = generation === 0 && search !== '';
    const initial = generation > 0 ? new URLSearchParams() : fromLink ? new URLSearchParams(search) : typeof window === 'undefined' ? new URLSearchParams() : readSaved(path);
    const values = new Map<string, string>();
    const baseline = new Map<string, string>();
    return {
      initial,
      values,
      labels: new Map<string, string>(),
      baseline,
      root,
      persist: () => {
        if (typeof window === 'undefined' || fromLink) return;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          // Only what differs from the starting values is kept, so a changed default on the site still reaches people who never edited that field.
          const changed = Object.fromEntries([...values].filter(([key, now]) => now !== baseline.get(key)));
          try {
            if (Object.keys(changed).length > 0) window.localStorage.setItem(`${SAVED_PREFIX}${path}`, JSON.stringify(changed));
            else window.localStorage.removeItem(`${SAVED_PREFIX}${path}`);
          } catch { /* still works without saving */ }
        }, 400);
      },
      reset: () => {
        window.clearTimeout(timer.current);
        try { window.localStorage.removeItem(`${SAVED_PREFIX}${path}`); } catch { /* nothing to forget */ }
        setGeneration((count) => count + 1);
      },
    };
  }, [generation]);
  // The values are already captured, so drop the query from the address bar; a later reload then starts clean.
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.search === '') return;
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.hash}`);
  }, []);
  return (
    <ShareContext.Provider value={value}>
      <div ref={root} key={generation}>{children}</div>
    </ShareContext.Provider>
  );
};

/** For the share bar: the calculator element, the labelled inputs, and the remember and start-again actions. */
export function useShareContext(): ShareContextValue | null {
  return useContext(ShareContext);
}

/** A short, readable address key made from a field label. */
export const shareKey = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 28).replace(/-+$/, '');

export const acceptNumber = (text: string) => /^-?\d{1,15}(\.\d{1,10})?$/.test(text);
export const acceptDate = (text: string) => /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(text));
export const acceptTime = (text: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(text);

/**
 * Registers one field with the share link. `accepts` decides whether a value from the address is allowed
 * (for example, a choice must still be one of the options). A value that is not accepted yet is retried on later
 * renders, because the options of one field can depend on another field that is filled in first.
 */
export function useShared(label: string, value: string, onChange: (next: string) => void, accepts: (text: string) => boolean, override?: string) {
  const context = useContext(ShareContext);
  const key = override ?? shareKey(label);
  const applied = useRef(false);
  const latest = useRef(onChange);
  latest.current = onChange;

  useEffect(() => {
    if (!context || applied.current) return;
    const wanted = context.initial.get(key);
    if (wanted === null || wanted === value) {
      applied.current = true;
      return;
    }
    if (accepts(wanted)) {
      applied.current = true;
      latest.current(wanted);
    }
  });

  useEffect(() => {
    if (!context) return undefined;
    if (!context.baseline.has(key)) context.baseline.set(key, value);
    context.values.set(key, value);
    context.labels.set(key, label);
    context.persist();
    return () => { context.values.delete(key); };
  }, [context, key, value, label]);
}

/** The address of this page with the current inputs, or '' when there is nothing to share. */
export function useShareUrl(): () => string {
  const context = useContext(ShareContext);
  return () => {
    if (!context || typeof window === 'undefined') return '';
    const url = new URL(window.location.pathname, window.location.origin);
    context.values.forEach((value, key) => { if (value !== '') url.searchParams.set(key, value); });
    return url.toString();
  };
}
