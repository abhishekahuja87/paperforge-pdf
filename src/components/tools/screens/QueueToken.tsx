import React, { useCallback, useState } from 'react';
import { Maximize, Minus, Plus, RotateCcw } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { beep } from '../../../lib/screens/beep';
import { callNext, formatToken, type TokenState } from '../../../lib/screens/clock';
import { bool, isRecord, num, str } from '../../../lib/screens/read';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { LogoField } from './LogoField';
import { ScreenShell } from './ScreenShell';
import { CHECK, FIELD, LABEL, ORANGE, OUTLINE } from './ui';

interface Saved { state: TokenState; width: number; sound: boolean; light: boolean; logo: string }
const DEFAULTS: Saved = { state: { prefix: '', current: 0, last: [], counter: '' }, width: 2, sound: true, light: false, logo: '' };
const read = (value: unknown): Saved | null => {
  if (!isRecord(value) || !isRecord(value.state)) return null;
  const last = Array.isArray(value.state.last) ? value.state.last.filter((entry): entry is number => typeof entry === 'number').slice(0, 6) : [];
  return { state: { prefix: str(value.state.prefix), current: Math.max(0, num(value.state.current, 0)), last, counter: str(value.state.counter) }, width: Math.min(5, Math.max(1, num(value.width, 2))), sound: bool(value.sound, true), light: bool(value.light, false), logo: str(value.logo) };
};

/** A "now serving" display for a clinic, shop, office or bank counter. The staff press Next; the screen shows the number. */
export const QueueToken: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-token-v1', DEFAULTS, read);
  const [full, setFull] = useState(false);
  const close = useCallback(() => setFull(false), []);
  const { state, width } = saved;
  const sound = saved.sound;
  const call = useCallback((by: number) => { setSaved((current) => ({ ...current, state: callNext(current.state, by) })); if (sound && by > 0) beep(988, 350); }, [setSaved, sound]);
  const show = (value: number) => formatToken(state.prefix, value, width);
  const patch = (changes: Partial<TokenState>) => setSaved({ ...saved, state: { ...state, ...changes } });
  const reset = () => setSaved({ ...saved, state: { ...state, current: 0, last: [] } });

  const onKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Enter') { event.preventDefault(); call(1); }
    else if (event.key === 'ArrowLeft') call(-1);
  }, [call]);

  const upcoming = [1, 2, 3].map((by) => state.current + by);
  const dark = !saved.light;
  const surface = dark ? 'bg-stone-950 text-white' : 'bg-white text-stone-900';
  const muted = dark ? 'text-stone-300' : 'text-stone-600';
  const bar = (
    <>
      <button type="button" aria-label="Previous number" onClick={() => call(-1)} disabled={state.current === 0} className="flex h-12 w-12 items-center justify-center rounded-full bg-black/20 hover:bg-black/30 disabled:opacity-40"><Minus className="h-6 w-6" aria-hidden="true" /></button>
      <button type="button" onClick={() => call(1)} className="flex h-14 items-center gap-2 rounded-full bg-orange-700 px-6 text-base font-bold text-white hover:bg-orange-800"><Plus className="h-5 w-5" aria-hidden="true" />Next</button>
    </>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <div className="rounded-2xl bg-stone-950 p-5 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-300">{state.counter.trim() || 'Now serving'}</p>
          <p className="text-6xl font-black tabular-nums sm:text-7xl" aria-live="polite">{state.current === 0 ? '—' : show(state.current)}</p>
          <p className="mt-1 text-xs text-stone-300">Next: {upcoming.map(show).join(', ')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => call(1)} className={ORANGE}><Plus className="h-4 w-4" aria-hidden="true" />Call next number</button>
          <button type="button" onClick={() => call(-1)} disabled={state.current === 0} className={OUTLINE}><Minus className="h-4 w-4" aria-hidden="true" />Go back one</button>
          <button type="button" onClick={() => setFull(true)} className={OUTLINE}><Maximize className="h-4 w-4" aria-hidden="true" />Show on the big screen</button>
          <button type="button" onClick={reset} className={OUTLINE}><RotateCcw className="h-4 w-4" aria-hidden="true" />Start again from 1</button>
        </div>
        <p className="text-xs text-stone-600">Called so far: {state.last.length === 0 ? 'none yet' : [...state.last].map(show).join(', ')}</p>
      </section>
      <section className={`${calcCard} space-y-4`}>
        <h2 className="text-sm font-black text-stone-900">Settings</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={LABEL}>Heading above the number<input type="text" value={state.counter} onChange={(event) => patch({ counter: event.target.value })} placeholder="For example Counter 2 or Dr Rao’s room" className={FIELD} /></label>
          <label className={LABEL}>Letter before the number (optional)<input type="text" maxLength={3} value={state.prefix} onChange={(event) => patch({ prefix: event.target.value })} placeholder="For example A" className={FIELD} /></label>
          <label className={LABEL}>Digits
            <select value={width} onChange={(event) => setSaved({ ...saved, width: Number(event.target.value) })} className={FIELD}>{[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count}</option>)}</select>
          </label>
          <label className={LABEL}>Jump to number<input type="number" inputMode="numeric" min={0} value={state.current} onChange={(event) => patch({ current: Math.max(0, Math.round(Number(event.target.value)) || 0) })} className={FIELD} /></label>
        </div>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <label className={CHECK}><input type="checkbox" checked={saved.sound} onChange={(event) => setSaved({ ...saved, sound: event.target.checked })} className="h-4 w-4 accent-orange-700" />Chime when the next number is called</label>
          <label className={CHECK}><input type="checkbox" checked={saved.light} onChange={(event) => setSaved({ ...saved, light: event.target.checked })} className="h-4 w-4 accent-orange-700" />Light screen</label>
        </div>
        <LogoField logo={saved.logo} onChange={(logo) => setSaved({ ...saved, logo })} label="Logo in the corner (optional, for example your clinic or shop)" />
        <Note>Give people numbered slips or tell them their number, then press Next as each person is called. On the big screen the right arrow, space bar or Next button calls the next number and the left arrow goes back. The numbers are saved only in this browser, so the count survives a reload. Nothing is sent anywhere, so it cannot show on a second screen by itself: open this page on the device that is connected to the display.</Note>
      </section>
      {full && (
        <ScreenShell surface={surface} label="Now serving display" onClose={close} bar={bar} onKey={onKey} logo={saved.logo || undefined}>
          <div className="m-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 text-center">
            <p className={`text-[clamp(1.4rem,4vw,3.4rem)] font-bold uppercase tracking-widest ${dark ? 'text-orange-300' : 'text-orange-700'}`}>{state.counter.trim() || 'Now serving'}</p>
            <p className="text-[clamp(6rem,30vw,26rem)] font-black leading-none tabular-nums" aria-live="polite">{state.current === 0 ? '—' : show(state.current)}</p>
            <p className={`text-[clamp(1.2rem,3vw,2.6rem)] ${muted}`}>Next: <span className="font-bold">{upcoming.map(show).join('   ')}</span></p>
            {state.last.length > 0 && <p className={`text-[clamp(1rem,2.2vw,1.8rem)] ${muted}`}>Earlier: {state.last.slice(0, 4).map(show).join('   ')}</p>}
          </div>
        </ScreenShell>
      )}
    </div>
  );
};

export default QueueToken;
