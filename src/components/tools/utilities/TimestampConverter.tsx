import React, { useMemo, useState } from 'react';
import { CalcFooter, SimpleTable, calcCard } from '../../common/CalcKit';
import { CopyButton, DateField, fieldClass } from '../../common/FieldKit';
import { zonedTimeToDate } from '../../../lib/utilities/dev';
import { dateFacts, formatWithOffset, parseEpoch, toRfc2822 } from '../../../lib/utilities/timestampTools';
import { LiveEpoch } from './timestamp/LiveEpoch';
import { TimestampBatch } from './timestamp/TimestampBatch';
import { TimestampMath } from './timestamp/TimestampMath';
import { ZoneSelect, realZone } from './timestamp/ZoneSelect';

function relative(date: Date): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  const units: [number, string][] = [[31_557_600, 'year'], [86_400, 'day'], [3600, 'hour'], [60, 'minute']];
  for (const [size, name] of units) if (abs >= size) { const n = Math.floor(abs / size); return seconds < 0 ? `${n} ${name}${n > 1 ? 's' : ''} ago` : `in ${n} ${name}${n > 1 ? 's' : ''}`; }
  return seconds < 0 ? 'just now' : 'in a few seconds';
}

export const TimestampConverter: React.FC = () => {
  const [stamp, setStamp] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [showZone, setShowZone] = useState('Asia/Kolkata');
  const [date, setDate] = useState('2026-11-08');
  const [time, setTime] = useState('12:00');
  const [zone, setZone] = useState('local');

  const parsed = useMemo(() => parseEpoch(stamp), [stamp]);
  const shown = realZone(showZone);
  const rows = parsed ? (() => {
    const facts = dateFacts(parsed.date, shown);
    return [
      [`In ${shown.replace(/_/g, ' ')}`, formatWithOffset(parsed.date, shown)],
      ['UTC', formatWithOffset(parsed.date, 'UTC')],
      ['Your browser time zone', formatWithOffset(parsed.date, realZone('local'))],
      ['ISO 8601', parsed.date.toISOString()],
      ['RFC 2822 (email)', toRfc2822(parsed.date, shown)],
      ['Relative', relative(parsed.date)],
      ['Day of the week', facts.weekday],
      ['Day of the year', `${facts.dayOfYear} of ${facts.leapYear ? 366 : 365}`],
      ['ISO week', facts.isoWeek],
      ['Quarter', `Q${facts.quarter}`],
      ['Seconds', String(Math.floor(parsed.date.getTime() / 1000))],
      ['Milliseconds', String(parsed.date.getTime())],
    ];
  })() : [];

  const reverse = useMemo(() => {
    const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const t = /^(\d{2}):(\d{2})$/.exec(time);
    if (!d || !t) return null;
    const instant = zone === 'local' ? new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2])) : zonedTimeToDate(date, time, zone);
    return instant && !Number.isNaN(instant.getTime()) ? instant : null;
  }, [date, time, zone]);

  return (
    <section className={`${calcCard} space-y-6`}>
      <LiveEpoch />

      <div>
        <h2 className="text-sm font-bold text-slate-900">Timestamp to date</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_16rem]">
          <label className="block min-w-0 text-xs font-semibold text-slate-700">Unix timestamp
            <span className="mt-1.5 flex gap-2">
              <input value={stamp} onChange={(event) => setStamp(event.target.value)} inputMode="numeric" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900" />
              <button type="button" onClick={() => setStamp(String(Math.floor(Date.now() / 1000)))} className="min-h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Use now</button>
            </span>
          </label>
          <ZoneSelect label="Show in time zone" value={showZone} onChange={setShowZone} />
        </div>
        {parsed ? (
          <>
            <p className="mt-2 text-xs text-slate-600" aria-live="polite">Read as <strong>{parsed.unit}</strong> from its size.</p>
            <SimpleTable caption="The timestamp as a date" head={['Format', 'Value']} rows={rows} />
          </>
        ) : <p className="mt-3 text-xs text-red-700" role="alert">Enter a whole number such as 1700000000.</p>}
        <p className="mt-2 text-xs text-slate-500">Up to 11 digits are read as seconds, 12 to 14 as milliseconds, 15 to 17 as microseconds and longer numbers as nanoseconds.</p>
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-900">Date to timestamp</h2>
        <div className="mt-2 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
          <DateField label="Date" value={date} onChange={setDate} />
          <label className="block text-xs font-semibold text-slate-700">Time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} className={fieldClass} /></label>
          <ZoneSelect label="Time zone" value={zone} onChange={setZone} />
        </div>
        {reverse ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[['Seconds', String(Math.floor(reverse.getTime() / 1000))], ['Milliseconds', String(reverse.getTime())]].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="font-mono text-sm font-bold">{value}</p></div><CopyButton text={value!} label="Copy" /></div>
            ))}
          </div>
        ) : <p className="mt-3 text-xs text-red-700" role="alert">Enter a valid date and time.</p>}
      </div>

      <TimestampMath start={stamp} />
      <TimestampBatch />
      <CalcFooter />
    </section>
  );
};

export default TimestampConverter;
