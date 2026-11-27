import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, RotateCcw } from 'lucide-react';
import { calcCard, Note } from '../../common/CalcKit';
import { beep } from '../../../lib/screens/beep';
import { drawOne, parsePrizes, rangeTickets } from '../../../lib/screens/draw';
import { bool, isRecord, num, oneOf, str } from '../../../lib/screens/read';
import { THEME_STYLES } from '../../../lib/screens/themes';
import { readTheme, type Theme } from '../../../lib/screens/timed';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { parseList, randomInt } from '../../../lib/toolkit/pick';
import { ThemePicker } from '../shared/ThemePicker';
import { LogoField } from './LogoField';
import { ScreenShell } from './ScreenShell';
import { CHECK, FIELD, LABEL, ORANGE, OUTLINE } from './ui';

type Source = 'range' | 'list';
interface Saved { source: Source; from: number; to: number; prefix: string; digits: number; list: string; prizes: string; title: string; sound: boolean; theme: Theme; logo: string }
const DEFAULTS: Saved = { source: 'range', from: 1, to: 100, prefix: '', digits: 3, list: '', prizes: '', title: 'Lucky draw', sound: true, theme: 'dark', logo: '' };
const read = (value: unknown): Saved | null => (isRecord(value) ? {
  source: oneOf(value.source, ['range', 'list'] as const, 'range'), from: num(value.from, 1), to: num(value.to, 100), prefix: str(value.prefix), digits: num(value.digits, 3), list: str(value.list), prizes: str(value.prizes),
  title: str(value.title, 'Lucky draw'), sound: bool(value.sound, true), theme: readTheme(value.theme), logo: str(value.logo),
} : null);
interface Result { ticket: string; prize: string }
const reduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A raffle or lucky draw for an event: draw tickets one at a time, never the same twice, with optional prizes. */
export const LuckyDraw: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-draw-v1', DEFAULTS, read);
  const [pool, setPool] = useState<string[] | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [shown, setShown] = useState('');
  const [rolling, setRolling] = useState(false);
  const [full, setFull] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(timer.current), []);

  const tickets = saved.source === 'range' ? rangeTickets({ from: saved.from, to: saved.to, prefix: saved.prefix, digits: saved.digits }) : parseList(saved.list);
  const prizes = parsePrizes(saved.prizes);
  const live = pool ?? tickets;
  const nextPrize = prizes[results.length] ?? '';
  const done = live.length === 0;
  const style = THEME_STYLES[saved.theme];
  const close = useCallback(() => setFull(false), []);
  const restart = () => { window.clearInterval(timer.current); setPool(null); setResults([]); setShown(''); setRolling(false); };

  const draw = useCallback(() => {
    if (rolling || live.length === 0) return;
    const picked = drawOne(live);
    if (!picked) return;
    setRolling(true);
    let ticks = 0;
    const total = reduced() ? 2 : 24;
    timer.current = window.setInterval(() => {
      ticks += 1;
      if (ticks < total) { setShown(live[randomInt(live.length)]!); if (saved.sound && ticks % 3 === 0) beep(600, 40); return; }
      window.clearInterval(timer.current);
      setShown(picked.winner);
      setPool(picked.rest);
      setResults((list) => [...list, { ticket: picked.winner, prize: prizes[list.length] ?? '' }]);
      setRolling(false);
      if (saved.sound) { beep(880, 180); window.setTimeout(() => beep(1175, 360), 200); }
    }, 70);
  }, [rolling, live, saved.sound, prizes]);

  const onKey = useCallback((event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowRight') { event.preventDefault(); draw(); }
  }, [draw]);

  const bar = <button type="button" onClick={draw} disabled={rolling || done} className="flex h-14 items-center gap-2 rounded-full bg-orange-700 px-8 text-base font-bold text-white hover:bg-orange-800 disabled:opacity-50">{done && results.length > 0 ? 'All drawn' : rolling ? 'Drawing…' : 'Draw'}</button>;
  const set = (changes: Partial<Saved>) => { setSaved({ ...saved, ...changes }); restart(); };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <div className="rounded-2xl bg-stone-950 p-5 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-300">{nextPrize || saved.title.trim() || 'Lucky draw'}</p>
          <p className="break-words text-5xl font-black tabular-nums sm:text-6xl" aria-live="polite">{shown || '—'}</p>
          <p className="mt-1 text-xs text-stone-300">{live.length} {live.length === 1 ? 'ticket' : 'tickets'} left{results.length ? `, ${results.length} drawn` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={draw} disabled={rolling || done} className={ORANGE}>Draw {results.length ? 'the next winner' : 'a winner'}</button>
          <button type="button" onClick={() => setFull(true)} disabled={tickets.length === 0} className={OUTLINE}><Maximize className="h-4 w-4" aria-hidden="true" />Show on the big screen</button>
          <button type="button" onClick={restart} disabled={results.length === 0 && !shown} className={OUTLINE}><RotateCcw className="h-4 w-4" aria-hidden="true" />Start again</button>
        </div>
        {results.length > 0 && (
          <ol className="space-y-1 text-sm text-stone-800">{results.map((result, index) => <li key={index}><span className="font-black">{index + 1}.</span> {result.ticket}{result.prize && <span className="text-stone-600"> — {result.prize}</span>}</li>)}</ol>
        )}
      </section>
      <section className={`${calcCard} space-y-4`}>
        <h2 className="text-sm font-black text-stone-900">Tickets and prizes</h2>
        <div className="flex gap-2" role="radiogroup" aria-label="Where the tickets come from">
          {([['range', 'Ticket numbers'], ['list', 'A list of names']] as const).map(([id, label]) => (
            <label key={id} className={`flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold ${saved.source === id ? 'border-orange-500 bg-orange-50 text-orange-900' : 'border-stone-200 bg-white text-stone-700'}`}>
              <input type="radio" name="draw-source" className="sr-only" checked={saved.source === id} onChange={() => set({ source: id })} />{label}
            </label>
          ))}
        </div>
        {saved.source === 'range' ? (
          <div className="grid gap-3 sm:grid-cols-4">
            <label className={LABEL}>First number<input type="number" inputMode="numeric" value={saved.from} onChange={(event) => set({ from: Number(event.target.value) })} className={FIELD} /></label>
            <label className={LABEL}>Last number<input type="number" inputMode="numeric" value={saved.to} onChange={(event) => set({ to: Number(event.target.value) })} className={FIELD} /></label>
            <label className={LABEL}>Letters before (optional)<input type="text" maxLength={4} value={saved.prefix} onChange={(event) => set({ prefix: event.target.value })} placeholder="For example A" className={FIELD} /></label>
            <label className={LABEL}>Digits
              <select value={saved.digits} onChange={(event) => set({ digits: Number(event.target.value) })} className={FIELD}>{[0, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count === 0 ? 'No padding' : `${count} digits`}</option>)}</select>
            </label>
          </div>
        ) : (
          <label className={LABEL}>Names, one per line
            <textarea rows={5} value={saved.list} onChange={(event) => set({ list: event.target.value })} placeholder={'Asha\nRahul\nMeera'} className={FIELD} />
          </label>
        )}
        {tickets.length === 0 && <p role="status" className="text-xs text-red-700">There are no tickets yet. Check that the last number is not smaller than the first.</p>}
        <label className={LABEL}>Prizes, one per line, in the order they are drawn (optional)
          <textarea rows={3} value={saved.prizes} onChange={(event) => setSaved({ ...saved, prizes: event.target.value })} placeholder={'Third prize: Water bottle\nSecond prize: Headphones\nFirst prize: Smart watch'} className={FIELD} />
        </label>
        <label className={LABEL}>Heading<input type="text" value={saved.title} onChange={(event) => setSaved({ ...saved, title: event.target.value })} className={FIELD} /></label>
        <label className={CHECK}><input type="checkbox" checked={saved.sound} onChange={(event) => setSaved({ ...saved, sound: event.target.checked })} className="h-4 w-4 accent-orange-700" />Ticking sound while drawing</label>
        <ThemePicker name="draw-theme" value={saved.theme} onChange={(theme) => setSaved({ ...saved, theme })} />
        <LogoField logo={saved.logo} onChange={(logo) => setSaved({ ...saved, logo })} label="Logo in the corner (optional, for example your society or shop)" />
        <Note>Each ticket is drawn with your browser’s secure random numbers and cannot be drawn twice until you press Start again. Up to 5,000 numbered tickets or 500 names. Everything stays on this page and nothing is sent anywhere. This tool picks names and numbers only; check your local rules before running a prize draw that people pay to enter.</Note>
      </section>
      {full && (
        <ScreenShell surface={style.surface} label="Lucky draw" onClose={close} bar={bar} onKey={onKey} logo={saved.logo || undefined}>
          <div className="m-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 text-center">
            <p className={`text-[clamp(1.4rem,4vw,3.4rem)] font-bold uppercase tracking-widest ${style.accent}`}>{nextPrize || saved.title.trim() || 'Lucky draw'}</p>
            <p className="max-w-full break-words text-[clamp(4rem,20vw,16rem)] font-black leading-none tabular-nums" aria-live="polite">{shown || '?'}</p>
            {results.length > 0 && <p className={`max-w-4xl text-[clamp(1rem,2.2vw,1.8rem)] ${style.muted}`}>Winners so far: {results.map((result) => result.ticket).join('   ')}</p>}
          </div>
        </ScreenShell>
      )}
    </div>
  );
};

export default LuckyDraw;
