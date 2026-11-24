import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * A button for something that wipes saved work, such as New game or Clear everything.
 * The first tap only asks "Tap again"; the second tap does it. If nobody taps again within a few seconds it goes back to normal.
 * This avoids a browser pop-up, which phones and kiosks can block.
 */
export const ConfirmButton: React.FC<{ label: string; confirmLabel?: string; onConfirm: () => void; disabled?: boolean; icon?: React.ReactNode }> = ({ label, confirmLabel = 'Tap again to confirm', onConfirm, disabled, icon }) => {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const id = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(id);
  }, [armed]);
  useEffect(() => { if (disabled) setArmed(false); }, [disabled]);
  return (
    <button type="button" disabled={disabled} onClick={() => { if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40 ${armed ? 'border-red-600 bg-red-600 text-white' : 'border-orange-300 text-orange-800 hover:bg-orange-50'}`}>
      {icon ?? <RotateCcw className="h-4 w-4" aria-hidden="true" />}{armed ? confirmLabel : label}
    </button>
  );
};
