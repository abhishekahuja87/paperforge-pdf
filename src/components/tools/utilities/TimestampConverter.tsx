import React, { useMemo, useState } from 'react';
import { CalcFooter, SimpleTable, calcCard } from '../../finance/ui';
import { CopyButton, DateField, fieldClass } from './common';
import { epochToDate, zonedTimeToDate } from '../../../lib/utilities/dev';

function relative(date: Date): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  const units: [number, string][] = [[31_557_600, 'year'], [86_400, 'day'], [3600, 'hour'], [60, 'minute']];
  for (const [size, name] of units) if (abs >= size) { const n = Math.floor(abs / size); return seconds < 0 ? `${n} ${name}${n > 1 ? 's' : ''} ago` : `in ${n} ${name}${n > 1 ? 's' : ''}`; }
  return seconds < 0 ? 'just now' : 'in a few seconds';
}

export const TimestampConverter: React.FC = () => {
  const [stamp, setStamp] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [date, setDate] = useState('2026-11-08');
  const [time, setTime] = useState('12:00');
  const [zone, setZone] = useState('local');

  const parsed = useMemo(() => epochToDate(stamp), [stamp]);
  const rows = parsed ? [
    ['UTC', parsed.toISOString().replace('T', ' ').replace('.000Z', '').replace('Z', '')],
    ['India (IST)', parsed.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' })],
    ['Your browser time zone', parsed.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })],
    ['ISO 8601', parsed.toISOString()],
    ['Relative', relative(parsed)],
  ] : [];

  const reverse = useMemo(() => {
    const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const t = /^(\d{2}):(\d{2})$/.exec(time);
    if (!d || !t) return null;
    const instant = zone === 'utc' ? new Date(Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]))) : zone === 'ist' ? zonedTimeToDate(date, time, 'Asia/Kolkata') : new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
    return instant && !Number.isNaN(instant.getTime()) ? instant : null;
  }, [date, time, zone]);

  return (
    <section className={calcCard}>
      <h2 className="text-sm font-bold text-slate-900">Timestamp to date</h2>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <label className="block min-w-0 flex-1 text-xs font-semibold text-slate-700">Unix timestamp (seconds or milliseconds)<input value={stamp} onChange={(event) => setStamp(event.target.value)} inputMode="numeric" className={`${fieldClass} font-mono`} /></label>
        <button type="button" onClick={() => setStamp(String(Math.floor(Date.now() / 1000)))} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Use current time</button>
      </div>
      {parsed ? <SimpleTable caption="The timestamp as a date" head={['Format', 'Value']} rows={rows} /> : <p className="mt-3 text-xs text-red-700" role="alert">Enter a whole number such as 1700000000.</p>}
      <p className="mt-2 text-xs text-slate-500">Numbers with 11 or more digits are read as milliseconds, shorter ones as seconds.</p>

      <h2 className="mt-6 text-sm font-bold text-slate-900">Date to timestamp</h2>
      <div className="mt-2 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
        <DateField label="Date" value={date} onChange={setDate} />
        <label className="block text-xs font-semibold text-slate-700">Time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} className={fieldClass} /></label>
        <label className="block text-xs font-semibold text-slate-700">Time zone
          <select value={zone} onChange={(event) => setZone(event.target.value)} className={fieldClass}>
            <option value="local">My browser time zone</option><option value="ist">India (IST)</option><option value="utc">UTC</option>
          </select>
        </label>
      </div>
      {reverse ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[['Seconds', String(Math.floor(reverse.getTime() / 1000))], ['Milliseconds', String(reverse.getTime())]].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="font-mono text-sm font-bold">{value}</p></div><CopyButton text={value} label="Copy" /></div>
          ))}
        </div>
      ) : <p className="mt-3 text-xs text-red-700" role="alert">Enter a valid date and time.</p>}
      <CalcFooter />
    </section>
  );
};

export default TimestampConverter;
