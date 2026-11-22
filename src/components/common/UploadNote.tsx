import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

/** The one look for a note on a tool page: plain light grey text with no box for information (like the hint under the upload button), an amber box only for a warning. */
export const UploadNote: React.FC<{ tone?: 'info' | 'warning'; children: React.ReactNode }> = ({ tone = 'info', children }) => {
  const warning = tone === 'warning';
  const Icon = warning ? AlertTriangle : Info;
  return (
    <div className={`flex items-start gap-2 text-xs leading-relaxed ${warning ? 'rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900' : 'px-1 text-stone-500'}`}>
      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${warning ? 'text-amber-700' : 'text-stone-400'}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

export default UploadNote;
