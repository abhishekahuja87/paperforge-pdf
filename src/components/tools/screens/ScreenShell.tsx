import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  /** Class names for the background and text colour. */
  surface: string;
  label: string;
  onClose: () => void;
  /** Buttons shown at the bottom. They fade out after a few seconds and come back when the screen is touched. */
  bar?: React.ReactNode;
  /** Called for keys other than Escape, so each tool can add its own. */
  onKey?: (event: KeyboardEvent) => void;
  onScreenClick?: () => void;
  /** An optional logo or picture (a data URL) shown small in the bottom left corner. */
  logo?: string;
  children: React.ReactNode;
}

/** Full-screen layer for a classroom monitor, gym TV or shop screen: asks for full screen, keeps the screen awake, closes on Escape, hides its buttons when idle. */
export const ScreenShell: React.FC<Props> = ({ surface, label, onClose, bar, onKey, onScreenClick, logo, children }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [controls, setControls] = useState(true);
  const hideTimer = useRef<number | undefined>(undefined);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const keyRef = useRef(onKey);
  keyRef.current = onKey;

  const reveal = useCallback(() => {
    setControls(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setControls(false), 3500);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    let active = true;
    let lock: WakeLockSentinel | null = null;
    const takeLock = async () => {
      try { lock = (await navigator.wakeLock?.request('screen')) ?? null; } catch { lock = null; }
    };
    void takeLock();
    const onVisible = () => { if (document.visibilityState === 'visible') void takeLock(); };
    const onFullscreen = () => { if (!document.fullscreenElement) closeRef.current(); };
    const handleKey = (event: KeyboardEvent) => {
      reveal();
      if (event.key === 'Escape') closeRef.current();
      else keyRef.current?.(event);
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('keydown', handleKey);
    try { void root?.requestFullscreen?.().then(() => { if (active) document.addEventListener('fullscreenchange', onFullscreen); }).catch(() => undefined); } catch { /* the layer still fills the window */ }
    reveal();
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('keydown', handleKey);
      window.clearTimeout(hideTimer.current);
      void lock?.release().catch(() => undefined);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, [reveal]);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onPointerMove={reveal}
      onPointerDown={reveal}
      onClick={(event) => { if (onScreenClick && (event.target as HTMLElement).closest('button') === null) onScreenClick(); }}
      className={`fixed inset-0 z-[100] flex flex-col ${surface} ${onScreenClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {logo && <img src={logo} alt="" className="pointer-events-none absolute bottom-3 left-3 z-10 max-h-[9vh] max-w-[24vw] rounded-lg bg-white object-contain p-1 shadow" />}
      {/* On a phone the browser shows its own "full screen" message along the bottom for several seconds, so the buttons sit at the top there. */}
      <div className={`order-first flex flex-wrap items-center justify-center gap-3 px-4 pt-3 transition-opacity duration-500 sm:order-last sm:pb-5 sm:pt-0 ${controls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        {bar}
        <button type="button" aria-label="Close" onClick={onClose} className="ml-2 flex h-12 items-center gap-1.5 rounded-full bg-black/20 px-4 text-sm font-bold hover:bg-black/30"><X className="h-4 w-4" aria-hidden="true" />Close</button>
      </div>
    </div>
  );
};
