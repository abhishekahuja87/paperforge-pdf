import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, RotateCcw } from 'lucide-react';
import { calcCard, Note } from '../../finance/ui';
import { beep } from '../../../lib/screens/beep';
import { bool, isRecord, str } from '../../../lib/screens/read';
import { THEME_STYLES } from '../../../lib/screens/themes';
import { readTheme, type Theme } from '../../../lib/screens/timed';
import { usePersisted } from '../../../lib/screens/usePersisted';
import { slicePath, sliceAt, sliceColour, sliceLabel, spinTarget } from '../../../lib/screens/wheel';
import { parseList, randomInt } from '../../../lib/toolkit/pick';
import { ConfirmButton } from '../shared/ConfirmButton';
import { ThemePicker } from '../shared/ThemePicker';
import { LogoField } from './LogoField';
import { ScreenShell } from './ScreenShell';
import { CHECK, FIELD, LABEL, ORANGE, OUTLINE } from './ui';

interface Saved { text: string; remove: boolean; sound: boolean; theme: Theme; logo: string }
const DEFAULTS: Saved = { text: '', remove: false, sound: true, theme: 'dark', logo: '' };
const read = (value: unknown): Saved | null => (isRecord(value) ? { text: str(value.text), remove: bool(value.remove, false), sound: bool(value.sound, true), theme: readTheme(value.theme), logo: str(value.logo) } : null);
const SAMPLE = 'Asha\nRahul\nMeera\nKabir\nIsha\nVikram';
const MAX_SLICES = 40;
const reduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const Wheel: React.FC<{ options: string[]; rotation: number; ms: number; size: string }> = ({ options, rotation, ms, size }) => {
  const count = options.length;
  const R = 100;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="-108 -108 216 216" className="h-full w-full" role="img" aria-label={`Wheel with ${count} ${count === 1 ? 'choice' : 'choices'}`}>
        <g style={{ transform: `rotate(${rotation}deg)`, transition: ms ? `transform ${ms}ms cubic-bezier(0.12, 0.6, 0.1, 1)` : 'none' }}>
          {options.map((option, index) => {
            const mid = ((index + 0.5) * 360) / count;
            return (
              <g key={`${option}-${index}`}>
                <path d={slicePath(index, count, R)} fill={sliceColour(index, count)} stroke="#fff" strokeWidth="0.8" />
                <text transform={`rotate(${mid - 90}) translate(${R * 0.9} 0)`} textAnchor="end" dominantBaseline="middle" fill="#fff" fontWeight="700" fontSize={count > 24 ? 5 : count > 12 ? 7 : 9}>{sliceLabel(option, count)}</text>
              </g>
            );
          })}
          <circle r="7" fill="#fff" />
        </g>
        <path d="M -7 -108 L 7 -108 L 0 -90 Z" fill="#f97316" stroke="#fff" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

/** A spinner wheel for picking a name, a prize or a decision, with a big-screen mode for the class. */
export const SpinnerWheel: React.FC = () => {
  const [saved, setSaved] = usePersisted<Saved>('mdu-wheel-v1', DEFAULTS, read);
  const [removed, setRemoved] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);
  const [ms, setMs] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState('');
  const [full, setFull] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const all = parseList(saved.text).slice(0, MAX_SLICES);
  const options = saved.remove ? all.filter((name) => !removed.includes(name)) : all;
  const close = useCallback(() => setFull(false), []);
  const style = THEME_STYLES[saved.theme];

  const spin = useCallback(() => {
    if (spinning || options.length === 0) return;
    const index = randomInt(options.length);
    const duration = reduced() ? 900 : 5000;
    setWinner('');
    setSpinning(true);
    setMs(duration);
    const target = spinTarget(rotation, index, options.length, (randomInt(81) - 40) / 100, 5 + randomInt(3));
    setRotation(target);
    timer.current = window.setTimeout(() => {
      const chosen = options[sliceAt(target, options.length)] ?? options[index]!;
      setWinner(chosen);
      setSpinning(false);
      setMs(0);
      if (saved.sound) { beep(784, 160); window.setTimeout(() => beep(1046, 320), 180); }
      if (saved.remove) setRemoved((list) => [...list, chosen]);
    }, duration + 80);
  }, [spinning, options, rotation, saved.sound, saved.remove]);

  const onKey = useCallback((event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowRight') { event.preventDefault(); spin(); }
  }, [spin]);

  const bar = <button type="button" onClick={spin} disabled={spinning || options.length === 0} className="flex h-14 items-center gap-2 rounded-full bg-orange-700 px-8 text-base font-bold text-white hover:bg-orange-800 disabled:opacity-50">{spinning ? 'Spinning…' : 'Spin'}</button>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className={`${calcCard} space-y-4`}>
        <label className={LABEL}>Choices, one per line (up to {MAX_SLICES})
          <textarea rows={6} value={saved.text} onChange={(event) => { setSaved({ ...saved, text: event.target.value }); setRemoved([]); setWinner(''); }} placeholder={'Asha\nRahul\nMeera'} className={FIELD} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setSaved({ ...saved, text: SAMPLE }); setRemoved([]); setWinner(''); }} className={OUTLINE}>Try a sample list</button>
          <ConfirmButton label="Clear the list" confirmLabel="Tap again to clear" onConfirm={() => { setSaved({ ...saved, text: '' }); setRemoved([]); setWinner(''); }} disabled={saved.text.trim() === ''} />
          <button type="button" onClick={() => { setRemoved([]); setWinner(''); }} disabled={removed.length === 0} className={OUTLINE}><RotateCcw className="h-4 w-4" aria-hidden="true" />Put removed names back</button>
        </div>
        {all.length < parseList(saved.text).length && <p role="status" className="text-xs text-red-700">Only the first {MAX_SLICES} choices are used.</p>}
        {options.length > 0 ? (
          <>
            <Wheel options={options} rotation={rotation} ms={ms} size="min(100%, 26rem)" />
            <p role="status" aria-live="polite" className="min-h-8 text-center text-2xl font-black text-stone-900">{winner || (spinning ? '…' : '')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={spin} disabled={spinning} className={ORANGE}>Spin the wheel</button>
              <button type="button" onClick={() => setFull(true)} className={OUTLINE}><Maximize className="h-4 w-4" aria-hidden="true" />Show on the big screen</button>
            </div>
          </>
        ) : <p className="text-sm text-stone-600">Add at least one choice, or try the sample list, to see the wheel.</p>}
      </section>
      <section className={`${calcCard} space-y-4`}>
        <h2 className="text-sm font-black text-stone-900">Settings</h2>
        <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
          <label className={CHECK}><input type="checkbox" checked={saved.remove} onChange={(event) => { setSaved({ ...saved, remove: event.target.checked }); setRemoved([]); }} className="h-4 w-4 accent-orange-700" />Take a choice off the wheel after it wins</label>
          <label className={CHECK}><input type="checkbox" checked={saved.sound} onChange={(event) => setSaved({ ...saved, sound: event.target.checked })} className="h-4 w-4 accent-orange-700" />Sound when the wheel stops</label>
        </div>
        <ThemePicker name="wheel-theme" label="Big screen colour" value={saved.theme} onChange={(theme) => setSaved({ ...saved, theme })} />
        <LogoField logo={saved.logo} onChange={(logo) => setSaved({ ...saved, logo })} />
        <Note>The winner is chosen with your browser’s secure random numbers before the wheel turns, so every choice has the same chance and the spin only shows it. The list is saved only in this browser. Nothing is sent anywhere.</Note>
      </section>
      {full && (
        <ScreenShell surface={style.surface} label="Spinner wheel" onClose={close} bar={bar} onKey={onKey} logo={saved.logo || undefined}>
          <div className="m-auto flex w-full flex-col items-center gap-3 px-4 py-4 text-center">
            <Wheel options={options} rotation={rotation} ms={ms} size="min(62vh, 92vw)" />
            <p aria-live="polite" className="min-h-[1.2em] break-words text-[clamp(2rem,7vw,5rem)] font-black leading-tight">{winner}</p>
          </div>
        </ScreenShell>
      )}
    </div>
  );
};

export default SpinnerWheel;
