import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { CopyButton } from '../common';

/** The current Unix time, ticking every second, with copy buttons. */
export const LiveEpoch: React.FC = () => {
  const [now, setNow] = useState(() => Date.now());
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [running]);
  const rows: [string, string][] = [['Seconds', String(Math.floor(now / 1000))], ['Milliseconds', String(now)], ['ISO 8601 (UTC)', new Date(now).toISOString()]];
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Right now</h2>
        <button type="button" onClick={() => setRunning((value) => !value)} aria-pressed={!running} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          {running ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}{running ? 'Pause' : 'Resume'}
        </button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="truncate font-mono text-sm font-bold text-slate-900">{value}</p></div>
            <CopyButton text={value} label="Copy" />
          </div>
        ))}
      </div>
    </div>
  );
};
