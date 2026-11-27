import React, { useCallback, useState } from 'react';
import { Copy, Maximize, Shuffle } from 'lucide-react';
import { calcCard, Note } from '../../common/CalcKit';
import { copyText } from '../../../lib/browserTools';
import { isRecord, num, oneOf, str } from '../../../lib/screens/read';
import { seatGrid, seatNames, seatText, swapSeats, type SeatMode } from '../../../lib/screens/seating';
import { THEME_STYLES } from '../../../lib/screens/themes';
import { readTheme, type Theme } from '../../../lib/screens/timed';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { parseList } from '../../../lib/toolkit/pick';
import { ThemePicker } from '../shared/ThemePicker';
import { ConfirmButton } from '../shared/ConfirmButton';
import { LogoField } from './LogoField';
import { ScreenShell } from './ScreenShell';
import { FIELD, LABEL, ORANGE, OUTLINE } from './ui';

interface Saved { title: string; names: string; columns: number; mode: SeatMode; grid: string[][]; theme: Theme; logo: string }
const DEFAULTS: Saved = { title: 'Seating plan', names: '', columns: 4, mode: 'shuffled', grid: [], theme: 'light', logo: '' };
const read = (value: unknown): Saved | null => {
  if (!isRecord(value)) return null;
  const grid = Array.isArray(value.grid) ? value.grid.filter(Array.isArray).slice(0, 60).map((row) => (row as unknown[]).slice(0, 12).map((cell) => str(cell))) : [];
  return { title: str(value.title, 'Seating plan'), names: str(value.names), columns: Math.max(1, Math.min(12, num(value.columns, 4))), mode: oneOf(value.mode, ['listed', 'shuffled', 'alphabetical'] as const, 'shuffled'), grid, theme: readTheme(value.theme, undefined), logo: str(value.logo) };
};
const MODES: Array<[SeatMode, string]> = [['shuffled', 'Mix them up'], ['listed', 'Keep my order'], ['alphabetical', 'A to Z']];

const Grid: React.FC<{ grid: string[][]; big?: boolean; picked?: [number, number] | null; onPick?: (row: number, column: number) => void; cell: string }> = ({ grid, big, picked, onPick, cell }) => (
  <div className="space-y-2" role="grid" aria-label="Seating plan">
    {grid.map((row, rowIndex) => (
      <div key={rowIndex} role="row" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
        {row.map((name, columnIndex) => {
          const chosen = picked?.[0] === rowIndex && picked?.[1] === columnIndex;
          const className = `flex min-h-12 items-center justify-center break-words rounded-xl border-2 px-2 py-2 text-center font-semibold ${big ? 'text-[clamp(0.9rem,2.2vw,1.8rem)]' : 'text-sm'} ${chosen ? 'border-orange-500 ring-2 ring-orange-300' : ''} ${name ? cell : 'border-dashed opacity-40'}`;
          return onPick
            ? <button key={columnIndex} type="button" role="gridcell" aria-label={`Row ${rowIndex + 1} seat ${columnIndex + 1}: ${name || 'empty'}`} aria-pressed={chosen} onClick={() => onPick(rowIndex, columnIndex)} className={className}>{name || '—'}</button>
            : <div key={columnIndex} role="gridcell" className={className}>{name || ''}</div>;
        })}
      </div>
    ))}
  </div>
);

/** A classroom seating plan: type the names, choose the columns, mix them up, swap seats by tapping two, and show it on the board. */
export const SeatingPlan: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-seating-v1', DEFAULTS, read);
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const [full, setFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const close = useCallback(() => setFull(false), []);
  const names = parseList(saved.names);
  const style = THEME_STYLES[saved.theme];
  const cellDark = 'border-white/20 bg-white/10';
  const cellLight = 'border-stone-200 bg-stone-50 text-stone-900';
  const cell = style.onLight ? cellLight : cellDark;

  const make = (mode: SeatMode = saved.mode) => { setSaved({ ...saved, mode, grid: seatGrid(seatNames(names, mode), saved.columns) }); setPicked(null); };
  const pick = (row: number, column: number) => {
    if (!picked) { setPicked([row, column]); return; }
    if (picked[0] === row && picked[1] === column) { setPicked(null); return; }
    setSaved({ ...saved, grid: swapSeats(saved.grid, picked, [row, column]) });
    setPicked(null);
  };
  const copy = async () => { try { await copyText(`${saved.title.trim() || 'Seating plan'}\n${seatText(saved.grid)}`); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* the plan is on the page to copy by hand */ } };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <label className={LABEL}>Student names, one per line
          <textarea rows={6} value={saved.names} onChange={(event) => setSaved({ ...saved, names: event.target.value })} placeholder={'Asha\nRahul\nMeera'} className={FIELD} />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={LABEL}>Heading<input type="text" value={saved.title} onChange={(event) => setSaved({ ...saved, title: event.target.value })} className={FIELD} /></label>
          <label className={LABEL}>Seats in each row
            <select value={saved.columns} onChange={(event) => setSaved({ ...saved, columns: Number(event.target.value) })} className={FIELD}>{Array.from({ length: 12 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}</select>
          </label>
          <label className={LABEL}>Order
            <select value={saved.mode} onChange={(event) => setSaved({ ...saved, mode: event.target.value as SeatMode })} className={FIELD}>{MODES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
          </label>
        </div>
        <p className="text-xs text-stone-600">{names.length} {names.length === 1 ? 'name' : 'names'}{names.length > 0 ? `, about ${Math.ceil(names.length / saved.columns)} rows` : ''}.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => make()} disabled={names.length === 0} className={ORANGE}><Shuffle className="h-4 w-4" aria-hidden="true" />{saved.grid.length ? 'Make a new plan' : 'Make the plan'}</button>
        </div>
      </section>
      {saved.grid.length > 0 && (
        <section className={`${calcCard} space-y-4`}>
          <h2 className="text-sm font-black text-stone-900">{saved.title.trim() || 'Seating plan'}</h2>
          <p className="rounded-lg bg-stone-100 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-widest text-stone-600">Front of the class</p>
          <Grid grid={saved.grid} picked={picked} onPick={pick} cell={cellLight} />
          <p className="text-xs text-stone-600">To swap two students, tap one seat and then the other. {picked ? 'Now tap the second seat.' : ''}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setFull(true)} className={ORANGE}><Maximize className="h-4 w-4" aria-hidden="true" />Show on the board</button>
            <button type="button" onClick={() => void copy()} className={OUTLINE}><Copy className="h-4 w-4" aria-hidden="true" />{copied ? 'Copied' : 'Copy as text'}</button>
            <ConfirmButton label="Clear names and plan" confirmLabel="Tap again to clear" onConfirm={() => { setSaved({ ...saved, names: '', grid: [] }); setPicked(null); }} />
          </div>
        </section>
      )}
      <section className={`${calcCard} space-y-4`}>
        <h2 className="text-sm font-black text-stone-900">Board colours</h2>
        <ThemePicker name="seating-theme" label="Screen colour" value={saved.theme} onChange={(theme) => setSaved({ ...saved, theme })} />
        <LogoField logo={saved.logo} onChange={(logo) => setSaved({ ...saved, logo })} />
        <Note>Seats are numbered from the front row. Your names and plan are saved only in this browser, so use first names or roll numbers if the device is shared. Nothing is sent anywhere. Mixing the order uses your browser’s secure random numbers.</Note>
      </section>
      {full && (
        <ScreenShell surface={style.surface} label="Seating plan" onClose={close} logo={saved.logo || undefined}>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-10">
            <h2 className="text-center text-[clamp(1.6rem,4.5vw,3.6rem)] font-black leading-tight">{saved.title.trim() || 'Seating plan'}</h2>
            <p className={`text-center text-xs font-bold uppercase tracking-widest ${style.muted}`}>Front of the class</p>
            <div className="m-auto w-full max-w-6xl"><Grid grid={saved.grid} big cell={cell} /></div>
          </div>
        </ScreenShell>
      )}
    </div>
  );
};

export default SeatingPlan;
