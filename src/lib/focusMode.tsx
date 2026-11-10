import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'mdu-focus-mode';
const PARAM = 'focus';

function readStored(): boolean {
  try { return window.sessionStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

function writeStored(on: boolean): void {
  try {
    if (on) window.sessionStorage.setItem(STORAGE_KEY, '1');
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked; focus mode then simply lasts for this page view.
  }
}

interface FocusModeValue {
  /** The visitor asked for focus mode. */
  focus: boolean;
  /** Focus mode is on and the current page is a tool page, so the site chrome should be hidden. */
  active: boolean;
  setFocus: (on: boolean) => void;
  /** Called by the tool layout so other pages are never affected. */
  registerToolPage: (on: boolean) => void;
}

const FocusModeContext = createContext<FocusModeValue>({
  focus: false,
  active: false,
  setFocus: () => undefined,
  registerToolPage: () => undefined,
});

/**
 * Focus mode: a visitor-chosen view of a tool page with the header, footer, text and ad slots hidden.
 * It starts off on every page load unless the link has ?focus=1 or the visitor turned it on earlier in this
 * visit (kept in sessionStorage). Pages always render in full for crawlers; the canonical address has no query.
 */
export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [focus, setFocusState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get(PARAM) === '1' || readStored();
  });
  const [toolPage, setToolPage] = useState(false);

  const setFocus = useCallback((on: boolean) => {
    setFocusState(on);
    writeStored(on);
  }, []);

  // Keep the address in step with the mode on tool pages, so the link can be shared.
  useEffect(() => {
    if (!toolPage) return;
    const params = new URLSearchParams(location.search);
    const has = params.get(PARAM) === '1';
    if (focus === has) return;
    if (focus) params.set(PARAM, '1'); else params.delete(PARAM);
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash }, { replace: true });
  }, [focus, toolPage, location.pathname, location.search, location.hash, navigate]);

  // A link opened with ?focus=1 turns the mode on.
  useEffect(() => {
    if (new URLSearchParams(location.search).get(PARAM) === '1' && !focus) setFocus(true);
    // Only react to the address changing, not to the mode itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const active = focus && toolPage;

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setFocus(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, setFocus]);

  const value = useMemo<FocusModeValue>(
    () => ({ focus, active, setFocus, registerToolPage: setToolPage }),
    [focus, active, setFocus],
  );
  return <FocusModeContext.Provider value={value}>{children}</FocusModeContext.Provider>;
};

export const useFocusMode = (): FocusModeValue => useContext(FocusModeContext);
