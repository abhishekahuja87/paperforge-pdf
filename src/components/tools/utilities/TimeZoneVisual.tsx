import React, { useRef } from 'react';
import { SLOTS, dayOffset, handAngles, kindOfHour, localParts, minutesOf, overlapSlots, shiftDate, slotStrip, timeOf, type HourKind } from '../../../lib/utilities/timeZoneVisual';

interface Row { zone: string; label: string; time: string; date: string }
interface Props {
  /** The chosen moment, and the zone, date and time it was entered in. */
  instant: Date;
  dayStart: Date;
  fromLabel: string;
  date: string;
  time: string;
  onDate: (date: string) => void;
  onTime: (time: string) => void;
  rows: Row[];
  /** Zone of each row, used for its strip. */
  zones: string[];
}

const CELL: Record<HourKind, string> = {
  work: 'bg-emerald-500 text-white',
  awake: 'bg-amber-200 text-amber-900',
  night: 'bg-slate-700 text-slate-100',
};
const WORD: Record<HourKind, string> = { work: 'working hours', awake: 'awake, outside working hours', night: 'night' };
const STEP = 30;

const dayBadge = (offset: number) => (offset > 0 ? 'Next day' : offset < 0 ? 'Previous day' : '');

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

/** Pictures for the same result the table shows: clocks, a half-hour strip per zone with a cursor you can drag, and an overlap bar. */
export const TimeZoneVisual: React.FC<Props> = ({ instant, dayStart, fromLabel, date, time, onDate, onTime, rows, zones }) => {
  const strips = zones.map((zone) => slotStrip(dayStart, zone));
  const overlap = overlapSlots(strips);
  const minutes = minutesOf(time);
  const percent = (minutes / 1440) * 100;
  const columns = { gridTemplateColumns: `repeat(${SLOTS}, minmax(0, 1fr))` };
  const area = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const moveTo = (clientX: number) => {
    const box = area.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const fraction = Math.min(Math.max((clientX - box.left) / box.width, 0), 0.999);
    onTime(timeOf(Math.floor((fraction * 1440) / STEP) * STEP));
  };

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onDate(shiftDate(date, -1))} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Previous day</button>
        <span className="text-xs font-semibold text-slate-800">{date} in {fromLabel}</span>
        <button type="button" onClick={() => onDate(shiftDate(date, 1))} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Next day</button>
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">Clocks</h3>
      <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => {
          const parts = localParts(instant, row.zone);
          const badge = dayBadge(dayOffset(instant, row.zone, date));
          return (
            <li key={row.zone} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2">
              {parts && <Clock hour={parts.hour} minute={parts.minute} />}
              <span className="min-w-0 text-xs">
                <span className="block truncate font-semibold text-slate-800">{row.label}</span>
                <span className="text-base font-bold text-orange-800">{row.time}</span>
                <span className="block text-slate-600">{row.date}{badge && <span className="ml-1.5 rounded bg-orange-100 px-1.5 py-0.5 font-semibold text-orange-900">{badge}</span>}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <h3 className="mt-5 text-sm font-semibold text-slate-900">The day, half an hour at a time</h3>
      <p className="mt-1 text-[11px] text-slate-500">Each strip is the same 24 hours, from midnight to midnight in {fromLabel}. Each thin box is half an hour, with the local hour written at the start of each hour. Drag the orange line, or use the slider below, to choose the time. A small date marks where a new day starts in that zone.</p>
      <div
        ref={area}
        className="relative mt-3 touch-pan-y select-none"
        onPointerDown={(event) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); moveTo(event.clientX); }}
        onPointerMove={(event) => { if (dragging.current) moveTo(event.clientX); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
      >
        <div className="space-y-3">
          {rows.map((row, index) => {
            const strip = strips[index];
            const midnight = strip.findIndex((cell, at) => at > 0 && cell.hour === 0 && cell.minute === 0);
            const badge = dayBadge(dayOffset(instant, row.zone, date));
            return (
              <div key={row.zone}>
                <p className="mb-0.5 flex items-baseline justify-between gap-2 text-[11px] font-semibold text-slate-700">
                  <span className="truncate">{row.label}</span>
                  <span className="shrink-0 text-orange-800">{row.time}{badge ? ` (${badge.toLowerCase()})` : ''}</span>
                </p>
                <div role="img" aria-label={`${row.label}: ${strip.filter((cell) => cell.minute === 0).map((cell) => `${cell.hour}:00 ${WORD[cell.kind]}`).join(', ')}`} className="grid overflow-hidden rounded-md" style={columns}>
                  {strip.map((cell, at) => (
                    <span key={at} className={`relative flex h-7 items-center overflow-visible text-[9px] font-semibold leading-none ${CELL[cell.kind]} ${cell.minute === 0 ? 'border-l border-white/50' : ''}`}>
                      {cell.minute === 0 && <span className="relative z-10 pl-px">{cell.hour}</span>}
                    </span>
                  ))}
                </div>
                <div className="relative h-4 text-[10px] font-semibold text-orange-800">
                  {midnight > 0 && <span className="absolute top-0.5 whitespace-nowrap" style={{ left: `${(midnight / SLOTS) * 100}%` }}>| new day</span>}
                </div>
              </div>
            );
          })}
          {rows.length > 1 && (
            <div>
              <p className="mb-0.5 text-[11px] font-semibold text-slate-700">Everyone in working hours</p>
              <div role="img" aria-label={overlap.length ? `${overlap.length / 2} hours when everyone is in working hours` : 'No time when everyone is in working hours'} className="grid overflow-hidden rounded-md bg-slate-100" style={columns}>
                {strips[0].map((_, at) => <span key={at} className={`h-4 ${overlap.includes(at) ? 'bg-emerald-600' : ''}`} />)}
              </div>
              <p className="mt-1 text-[11px] text-slate-600">{overlap.length ? `${overlap.length / 2} ${overlap.length === 2 ? 'hour' : 'hours'} this day when everyone is in working hours (green).` : 'No time this day when everyone is in working hours.'}</p>
            </div>
          )}
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-1 -top-1 w-0.5 -translate-x-1/2 bg-orange-600" style={{ left: `${percent}%` }}>
          <span className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-orange-600 shadow" />
        </span>
      </div>

      <label className="mt-3 block text-xs font-semibold text-slate-700">
        Move the line: {time} in {fromLabel}
        <input type="range" min={0} max={1410} step={STEP} value={Math.round(minutes / STEP) * STEP} aria-valuetext={`${time} in ${fromLabel}`} onChange={(event) => onTime(timeOf(Number(event.target.value)))} className="mt-1 w-full accent-orange-700" />
      </label>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-700">
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-emerald-500" />Working hours (9 am to 6 pm)</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-amber-200" />Awake (7 to 9 am, 6 to 10 pm)</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-slate-700" />Night</li>
      </ul>
    </div>
  );
};

export default TimeZoneVisual;
