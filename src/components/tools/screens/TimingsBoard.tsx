import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { clockText, nowMinutes, sortedTimings, time12, timingsNow } from '../../../lib/screens/clock';
import { bool, isRecord, oneOf, str } from '../../../lib/screens/read';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { useScrollTo } from '../../../lib/screens/useScrollTo';
import { LogoField } from './LogoField';
import { PresetGrid, type Preset } from './PresetGrid';
import { makeRow, readRows, RowsEditor, type Column, type FormRow } from './RowsEditor';
import { ScreenShell } from './ScreenShell';
import { CHECK, FIELD, LABEL, ORANGE } from './ui';

type Hours = '12' | '24';
interface Saved { title: string; rows: FormRow[]; hours: Hours; clock: boolean; light: boolean; logo: string }
const COLUMNS: Column[] = [
  { key: 'time', label: 'Time', type: 'time', size: 'narrow' },
  { key: 'title', label: 'What happens', placeholder: 'For example Morning aarti', size: 'wide' },
  { key: 'note', label: 'Note (optional)', placeholder: 'For example Main hall', size: 'mid' },
];
const t = (time: string, title: string, note = '') => ({ time, title, note });
const BOARDS: Array<Preset & { title: string; rows: Array<{ time: string; title: string; note: string }> }> = [
  { id: 'temple', label: 'Temple or prayer hall', blurb: 'Opening, prayers and closing times.', title: 'Daily timings', rows: [t('05:30', 'Doors open'), t('06:00', 'Morning prayer'), t('12:00', 'Afternoon prayer'), t('17:30', 'Evening prayer'), t('19:30', 'Doors close')] },
  { id: 'clinic', label: 'Clinic or office hours', blurb: 'Opening hours, breaks and closing.', title: 'Our timings', rows: [t('09:00', 'Open'), t('13:00', 'Lunch break', 'Closed'), t('14:00', 'Open again'), t('18:00', 'Closed for the day')] },
  { id: 'hall', label: 'Community hall or society', blurb: 'Activities through the day.', title: 'Today in the hall', rows: [t('07:00', 'Yoga class', 'Ground floor'), t('10:00', 'Senior citizens’ meet'), t('16:00', 'Kids’ activity hour'), t('19:00', 'Society meeting', 'First floor')] },
  { id: 'event', label: 'Event programme', blurb: 'A day’s programme for guests.', title: 'Programme', rows: [t('09:00', 'Registration'), t('10:00', 'Welcome and opening'), t('13:00', 'Lunch'), t('14:00', 'Main session'), t('17:00', 'Closing')] },
];
const read = (value: unknown): Saved | null => (isRecord(value) ? { title: str(value.title, 'Daily timings'), rows: readRows(value.rows, ['time', 'title', 'note']) ?? [], hours: oneOf(value.hours, ['12', '24'] as const, '12'), clock: bool(value.clock, true), light: bool(value.light, false), logo: str(value.logo) } : null);

const TimingsScreen: React.FC<{ saved: Saved; onClose: () => void }> = ({ saved, onClose }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(id); }, []);
  const rows = useMemo(() => sortedTimings(saved.rows.filter((row) => (row.title ?? '').trim()).map((row) => ({ time: row.time ?? '', title: row.title ?? '', note: row.note ?? '' }))), [saved.rows]);
  const { current, next } = timingsNow(rows, nowMinutes(now));
  const dark = !saved.light;
  const muted = dark ? 'text-stone-300' : 'text-stone-600';
  const shown = (time: string) => (saved.hours === '12' ? time12(time) : time);

  return (
    <ScreenShell surface={dark ? 'bg-stone-950 text-white' : 'bg-white text-stone-900'} label="Daily timings board" onClose={onClose} logo={saved.logo || undefined}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5 sm:px-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="break-words text-[clamp(1.8rem,5vw,4rem)] font-black leading-tight">{saved.title.trim() || 'Timings'}</h2>
          {saved.clock && <p className="text-[clamp(1.4rem,4vw,3.2rem)] font-bold tabular-nums">{clockText(now, false)}</p>}
        </div>
        <ul className="m-auto w-full max-w-6xl space-y-2">
          {rows.map((row, index) => {
            const isNow = index === current;
            const isNext = index === next;
            const past = index < current;
            return (
              <li key={index} className={`flex items-center gap-4 rounded-2xl border-2 px-4 py-2 ${isNow ? 'border-green-500 bg-green-600 text-white' : isNext ? 'border-orange-400 bg-orange-500/20' : dark ? 'border-white/10' : 'border-stone-200'} ${past ? 'opacity-50' : ''}`}>
                <span className="w-[7.5ch] shrink-0 text-[clamp(1.2rem,3.4vh,2.6rem)] font-black tabular-nums sm:w-[9ch]">{row.time ? shown(row.time) : ''}</span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-[clamp(1.2rem,3.4vh,2.6rem)] font-bold leading-tight">{row.title}</span>
                  {row.note.trim() && <span className={`block text-[clamp(0.9rem,2vh,1.5rem)] ${isNow ? 'text-white/90' : muted}`}>{row.note}</span>}
                </span>
                {isNow && <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-green-700 sm:text-sm">NOW</span>}
                {isNext && <span className="shrink-0 rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-white sm:text-sm">NEXT</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </ScreenShell>
  );
};

export const TimingsBoard: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-timings-v1', { title: 'Daily timings', rows: [], hours: '12', clock: true, light: false, logo: '' }, read);
  const [active, setActive] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const { ref, scroll } = useScrollTo<HTMLDivElement>();
  const close = useCallback(() => setPlaying(false), []);
  const update = (patch: Partial<Saved>) => setSaved({ ...saved, ...patch });
  const count = saved.rows.filter((row) => (row.title ?? '').trim()).length;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <PresetGrid presets={BOARDS} active={active} hint="Pick a sample, then change the times and names." onPick={(id) => { const board = BOARDS.find((entry) => entry.id === id); if (!board) return; update({ title: board.title, rows: board.rows.map(makeRow) }); setActive(id); scroll(); }} />
        <label className={LABEL}>Board heading<input type="text" value={saved.title} onChange={(event) => update({ title: event.target.value })} className={FIELD} /></label>
      </section>
      <div ref={ref} className="scroll-mt-[69px]">
        <RowsEditor title="Timings" columns={COLUMNS} rows={saved.rows} onChange={(rows) => { update({ rows }); setActive(null); }} blank={{ time: '', title: '', note: '' }} addLabel="Add a timing" empty="No timings yet. Pick a sample above or add your own." />
      </div>
      <section className={`${calcCard} space-y-4`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={LABEL}>Show times as
            <select value={saved.hours} onChange={(event) => update({ hours: oneOf(event.target.value, ['12', '24'] as const, '12') })} className={FIELD}><option value="12">12-hour (2:30 PM)</option><option value="24">24-hour (14:30)</option></select>
          </label>
        </div>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <label className={CHECK}><input type="checkbox" checked={saved.clock} onChange={(event) => update({ clock: event.target.checked })} className="h-4 w-4 accent-orange-700" />Show the clock</label>
          <label className={CHECK}><input type="checkbox" checked={saved.light} onChange={(event) => update({ light: event.target.checked })} className="h-4 w-4 accent-orange-700" />Light screen</label>
        </div>
        <LogoField logo={saved.logo} onChange={(logo) => update({ logo })} label="Logo in the corner (optional, for example your temple, clinic or society)" />
        <p className="text-sm font-semibold text-stone-800">{count === 0 ? 'Add some timings to start.' : `${count} ${count === 1 ? 'timing' : 'timings'}. The one on now turns green and the next one is marked.`}</p>
        <button type="button" onClick={() => setPlaying(true)} disabled={count === 0} className={ORANGE}><Play className="h-4 w-4" aria-hidden="true" />Show on screen</button>
        <Note>The board sorts the times for you and follows this device’s clock, so the current activity changes by itself. Your timings are saved only in this browser. Check the times before you put the board on display.</Note>
      </section>
      {playing && <TimingsScreen saved={saved} onClose={close} />}
    </div>
  );
};

export default TimingsBoard;
