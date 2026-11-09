import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';

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
}

const ShareContext = createContext<ShareContextValue | null>(null);

export const ShareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo<ShareContextValue>(() => ({
    initial: new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search),
    values: new Map<string, string>(),
  }), []);
  // The values are already captured, so drop the query from the address bar; a later reload then starts clean.
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.search === '') return;
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.hash}`);
  }, []);
  return <ShareContext.Provider value={value}>{children}</ShareContext.Provider>;
};

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
    context.values.set(key, value);
    return () => { context.values.delete(key); };
  }, [context, key, value]);
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
