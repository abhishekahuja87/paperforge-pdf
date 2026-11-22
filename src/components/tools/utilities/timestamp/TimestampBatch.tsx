import React, { useMemo, useState } from 'react';
import { CopyButton, fieldClass } from '../common';
import { batchToCsv, convertBatch } from '../../../../lib/utilities/timestampTools';
import { ZoneSelect, realZone } from './ZoneSelect';

/** Convert a whole list of timestamps at once, for example from a log file, and copy the result as CSV. */
export const TimestampBatch: React.FC = () => {
  const [text, setText] = useState('1700000000\n1700003600\n1700000000000');
  const [zone, setZone] = useState('local');
  const rows = useMemo(() => convertBatch(text, realZone(zone)), [text, zone]);
  const csv = useMemo(() => batchToCsv(rows), [rows]);
  return (
    <div>
      <h2 className="text-sm font-bold text-slate-900">Many timestamps at once</h2>
      <p className="mt-1 text-xs text-slate-500">Paste one timestamp per line (commas also work). Seconds, milliseconds, microseconds and nanoseconds are told apart by size.</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_16rem]">
        <label className="block text-xs font-semibold text-slate-700">Timestamps
          <textarea value={text} onChange={(event) => setText(event.target.value)} rows={6} spellCheck={false} className={`${fieldClass} font-mono`} />
        </label>
        <ZoneSelect label="Show times in" value={zone} onChange={setZone} />
      </div>
      {rows.length > 0 && (
        <>
          <div className="mt-3 max-h-80 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[34rem] text-left text-xs">
              <caption className="sr-only">The timestamps as dates</caption>
              <thead className="sticky top-0 bg-slate-50 text-slate-600"><tr><th scope="col" className="px-3 py-2">Timestamp</th><th scope="col" className="px-3 py-2">Unit</th><th scope="col" className="px-3 py-2">UTC</th><th scope="col" className="px-3 py-2">In your zone</th></tr></thead>
              <tbody>{rows.map((row, index) => <tr key={`${row.input}-${index}`} className="border-t border-slate-100"><td className="px-3 py-1.5 font-mono">{row.input}</td><td className="px-3 py-1.5 text-slate-600">{row.unit}</td><td className={`px-3 py-1.5 font-mono ${row.unit ? '' : 'text-red-700'}`}>{row.iso}</td><td className="px-3 py-1.5 font-mono">{row.local}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2"><CopyButton text={csv} label="Copy as CSV" /><span className="text-xs text-slate-500">{rows.length} line{rows.length === 1 ? '' : 's'}</span></div>
        </>
      )}
    </div>
  );
};
