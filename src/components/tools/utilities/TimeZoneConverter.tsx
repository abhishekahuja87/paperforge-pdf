import React, { useMemo, useState } from 'react';
import { CalcFooter, SelectField, calcCard } from '../../finance/ui';
import { DateField, fieldClass } from './common';
import { COMMON_ZONES, formatInZone, zonedTimeToDate } from '../../../lib/utilities/dev';

function allZones(): string[] {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone');
    if (list && list.length > 0) return Array.from(new Set(['UTC', ...list]));
  } catch { /* fall back below */ }
  return COMMON_ZONES;
}
const zoneLabel = (zone: string) => (zone === 'Asia/Kolkata' ? 'India (Asia/Kolkata)' : zone.replace(/_/g, ' '));
function localZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'; } catch { return 'Asia/Kolkata'; }
}
const pad = (value: number) => String(value).padStart(2, '0');

export const TimeZoneConverter: React.FC = () => {
  const zones = useMemo(allZones, []);
  const now = new Date();
  const [from, setFrom] = useState(localZone);
  const [date, setDate] = useState(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  const [time, setTime] = useState(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  const [targets, setTargets] = useState<string[]>(['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London']);
  const [extra, setExtra] = useState('');

  const instant = useMemo(() => { try { return zonedTimeToDate(date, time, from); } catch { return null; } }, [date, time, from]);
  const options = zones.map((zone) => ({ value: zone, label: zoneLabel(zone) }));
  const toggle = (zone: string) => setTargets((current) => (current.includes(zone) ? current.filter((item) => item !== zone) : [...current, zone]));
  const setNow = () => { const d = new Date(); setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`); setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`); setFrom(localZone()); };
  const rows = instant ? targets.map((zone) => {
    const formatted = formatInZone(instant, zone);
    const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: '2-digit', hourCycle: 'h23' }).format(instant));
    return { zone, ...formatted, working: hour >= 9 && hour < 18 };
  }) : [];

  return (
    <section className={calcCard}>
      <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
        <DateField label="Date" value={date} onChange={setDate} />
        <label className="block text-xs font-semibold text-slate-700">Time<input type="time" value={time} onChange={(event) => setTime(event.target.value)} className={fieldClass} /></label>
        <SelectField label="In this time zone" value={from} onChange={setFrom} options={options} />
      </div>
      <button type="button" onClick={setNow} className="mt-3 min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Use current date and time here</button>
      {instant ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">The same moment in each chosen time zone</caption>
            <thead className="bg-slate-100 text-slate-600"><tr><th scope="col" className="px-3 py-2">Time zone</th><th scope="col" className="px-3 py-2">Date</th><th scope="col" className="px-3 py-2">Time</th><th scope="col" className="px-3 py-2">Working hours?</th><th scope="col" className="px-3 py-2"><span className="sr-only">Remove</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.zone}>
                  <th scope="row" className="px-3 py-2 font-semibold text-slate-800">{zoneLabel(row.zone)} <span className="font-normal text-slate-500">({row.zone === 'Asia/Kolkata' ? 'IST' : row.abbreviation})</span></th>
                  <td className="whitespace-nowrap px-3 py-2">{row.date}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-bold text-orange-800">{row.time}</td>
                  <td className="px-3 py-2">{row.working ? <span className="text-emerald-700">Yes (9 am to 6 pm)</span> : <span className="text-slate-500">No</span>}</td>
                  <td className="px-3 py-2"><button type="button" onClick={() => toggle(row.zone)} aria-label={`Remove ${zoneLabel(row.zone)}`} className="min-h-9 rounded px-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700">Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="mt-4 text-xs text-red-700" role="alert">Enter a valid date and time.</p>}
      <div className="mt-4 max-w-sm">
        <SelectField label="Add another time zone" value={extra} onChange={(value) => { setExtra(''); if (value && !targets.includes(value)) setTargets((current) => [...current, value]); }} options={[{ value: '', label: 'Choose a time zone' }, ...options]} />
      </div>
      <p className="mt-3 text-xs text-slate-500">Daylight saving time is applied for the date you choose, using your browser&apos;s time zone data. If you pick a time that does not exist (when clocks jump forward), the result may be an hour off.</p>
      <CalcFooter />
    </section>
  );
};

export default TimeZoneConverter;
