import React from 'react';
import { STRIP_HOURS, handAngles, hourStrip, kindOfHour, localParts, overlapCells, type HourKind } from '../../../lib/utilities/timeZoneVisual';

interface Props {
  instant: Date;
  zones: { zone: string; label: string; time: string }[];
}

const CELL: Record<HourKind, string> = {
  work: 'bg-emerald-500 text-white',
  awake: 'bg-amber-200 text-amber-900',
  night: 'bg-slate-700 text-slate-100',
};
const KIND_WORD: Record<HourKind, string> = { work: 'working hours', awake: 'awake, outside working hours', night: 'night' };

const Clock: React.FC<{ hour: number; minute: number }> = ({ hour, minute }) => {
  const angles = handAngles(hour, minute);
  const night = kindOfHour(hour) === 'night';
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-16 shrink-0" aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill={night ? '#334155' : '#fffbeb'} stroke={night ? '#94a3b8' : '#d97706'} strokeWidth="3" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1="50" y1="8" x2="50" y2={i % 3 === 0 ? 17 : 13} stroke={night ? '#e2e8f0' : '#78350f'} strokeWidth={i % 3 === 0 ? 3 : 1.5} transform={`rotate(${i * 30} 50 50)`} />
      ))}
      <line x1="50" y1="50" x2="50" y2="26" stroke={night ? '#f8fafc' : '#0f172a'} strokeWidth="5" strokeLinecap="round" transform={`rotate(${angles.hour} 50 50)`} />
      <line x1="50" y1="50" x2="50" y2="14" stroke={night ? '#fdba74' : '#c2410c'} strokeWidth="3" strokeLinecap="round" transform={`rotate(${angles.minute} 50 50)`} />
      <circle cx="50" cy="50" r="3.5" fill={night ? '#f8fafc' : '#0f172a'} />
    </svg>
  );
};

/** Pictures for the same result the table shows: an analog clock per zone and a 24-hour strip with working hours shaded. */
export const TimeZoneVisual: React.FC<Props> = ({ instant, zones }) => {
  const strips = zones.map((item) => hourStrip(instant, item.zone));
  const overlap = overlapCells(strips);
  const columns = { gridTemplateColumns: `repeat(${STRIP_HOURS}, minmax(0, 1fr))` };
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold text-slate-900">Clocks</h3>
      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {zones.map((item) => {
          const parts = localParts(instant, item.zone);
          return (
            <li key={item.zone} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
              {parts && <Clock hour={parts.hour} minute={parts.minute} />}
              <span className="min-w-0 text-xs"><span className="block truncate font-semibold text-slate-800">{item.label}</span><span className="font-bold text-orange-800">{item.time}</span></span>
            </li>
          );
        })}
      </ul>

      <h3 className="mt-5 text-sm font-semibold text-slate-900">The 24 hours around this moment</h3>
      <p className="mt-1 text-[11px] text-slate-500">Each box is one hour, with the hour of the day in that zone inside it. The line in the middle is the time you chose. Time runs left to right, from 12 hours before to 12 hours after.</p>
      <div className="mt-2 space-y-2">
        {zones.map((item, row) => (
          <div key={item.zone}>
            <p className="mb-0.5 truncate text-[11px] font-semibold text-slate-700">{item.label}</p>
            <div className="relative">
              <div role="img" aria-label={`${item.label}: ${strips[row].map((cell) => `${cell.hour}:00 ${KIND_WORD[cell.kind]}`).join(', ')}`} className="grid overflow-hidden rounded-md" style={columns}>
                {strips[row].map((cell, index) => (
                  <span key={index} className={`flex h-7 items-center justify-center text-[9px] font-semibold leading-none ${CELL[cell.kind]} ${index > 0 ? 'border-l border-white/30' : ''}`}>{cell.hour}</span>
                ))}
              </div>
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-1 -top-1 left-1/2 w-0.5 -translate-x-1/2 bg-orange-600" />
            </div>
          </div>
        ))}
        {zones.length > 1 && (
          <div>
            <p className="mb-0.5 text-[11px] font-semibold text-slate-700">Everyone in working hours</p>
            <div role="img" aria-label={overlap.length ? `${overlap.length} hours when everyone is in working hours` : 'No hour when everyone is in working hours'} className="grid overflow-hidden rounded-md bg-slate-100" style={columns}>
              {strips[0].map((_, index) => (
                <span key={index} className={`h-4 ${overlap.includes(index) ? 'bg-emerald-600' : ''} ${index > 0 ? 'border-l border-white/60' : ''}`} />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-600">{overlap.length ? `${overlap.length} ${overlap.length === 1 ? 'hour' : 'hours'} in this window when everyone is in working hours (green).` : 'No hour in this window when everyone is in working hours.'}</p>
          </div>
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-700">
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-emerald-500" />Working hours (9 am to 6 pm)</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-amber-200" />Awake (7 to 9 am, 6 to 10 pm)</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-slate-700" />Night</li>
      </ul>
    </div>
  );
};

export default TimeZoneVisual;
