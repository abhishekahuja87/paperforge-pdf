import React from 'react';
import { Loader2 } from 'lucide-react';

interface MainActionButtonProps {
  onClick: () => void;
  /** Disables the button, for example while working or when there is nothing to do yet. */
  disabled?: boolean;
  /** True while working: shows a spinner and the busy text. */
  busy?: boolean;
  /** Text shown while working, for example "Splitting...". Falls back to the normal text. */
  busyLabel?: string;
  children: React.ReactNode;
}

/** The big orange button every PDF tool ends with. Named for what it does, never "Save" or "Download". */
export const MainActionButton: React.FC<MainActionButtonProps> = ({ onClick, disabled = false, busy = false, busyLabel, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || busy}
    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
  >
    {busy ? (<><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /><span>{busyLabel ?? children}</span></>) : children}
  </button>
);
