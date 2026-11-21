import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { beep } from '../../../lib/screens/beep';
import { formatClock, type Theme, type TimedSlide } from '../../../lib/screens/timed';
import { ScreenShell } from './ScreenShell';

interface Props {
  slides: TimedSlide[];
  label: string;
  /** Start again from the first slide when the last timed slide ends. */
  loop?: boolean;
  showTimer: boolean;
  sound: boolean;
  /** Default colours when a slide has no theme of its own. */
  light: boolean;
  onClose: () => void;
}

const SURFACE: Record<Theme, string> = {
  dark: 'bg-stone-950 text-white', light: 'bg-white text-stone-900', orange: 'bg-orange-600 text-white', green: 'bg-green-700 text-white', blue: 'bg-blue-700 text-white', rose: 'bg-rose-700 text-white',
};
const TONE_SURFACE = { work: 'bg-green-700 text-white', rest: 'bg-blue-800 text-white', info: '', reveal: 'bg-orange-600 text-white' } as const;

/** One player for every timed show: it follows a list of slides, counts down each one, and waits for a click when a slide has no time. */
export const TimedPlayer: React.FC<Props> = ({ slides, label, loop = false, showTimer, sound, light, onClose }) => {
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(slides[0]?.seconds ?? 0);
  const [paused, setPaused] = useState(false);
  const lastTick = useRef(Date.now());
  const slide: TimedSlide = slides[Math.min(index, slides.length - 1)] ?? { key: 'end', title: '', seconds: 0, tone: 'info' };
  const last = index >= slides.length - 1;
  const timed = slide.seconds > 0;
  const manual = useMemo(() => slides.every((entry) => entry.seconds === 0), [slides]);

  const go = useCallback((target: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, target));
    setIndex(next);
    setRemaining(slides[next]?.seconds ?? 0);
    lastTick.current = Date.now();
  }, [slides]);

  useEffect(() => {
    if (paused || !timed) return undefined;
    lastTick.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(1, (now - lastTick.current) / 1000);
      lastTick.current = now;
      setRemaining((value) => value - elapsed);
    }, 200);
    return () => window.clearInterval(id);
  }, [paused, timed, index]);

  useEffect(() => {
    if (!timed || remaining > 0) return;
    if (!last) go(index + 1);
    else if (loop) go(0);
  }, [remaining, timed, last, loop, index, go]);

  // A short beep for the last three seconds and a longer one when a new slide starts.
  const beeped = useRef(-1);
  useEffect(() => {
    if (!sound || !timed || paused) return;
    const whole = Math.ceil(remaining);
    if (whole >= 1 && whole <= 3 && beeped.current !== index * 10 + whole) { beeped.current = index * 10 + whole; beep(660, 120); }
  }, [sound, timed, paused, remaining, index]);
  useEffect(() => { if (sound && index > 0) beep(980, 320); }, [sound, index]);

  const onKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowRight' || (manual && (event.key === ' ' || event.key === 'Enter'))) { event.preventDefault(); go(index + 1); }
    else if (event.key === 'ArrowLeft') go(index - 1);
    else if (event.key === ' ') { event.preventDefault(); setPaused((value) => !value); }
  }, [go, index, manual]);

  const theme = slide.theme ?? (light ? 'light' : 'dark');
  const toneSurface = TONE_SURFACE[slide.tone];
  const surface = toneSurface || SURFACE[theme];
  const onLight = surface.includes('bg-white');
  const muted = onLight ? 'text-stone-600' : 'text-white/80';
  const progress = slides.length > 1 ? (index / (slides.length - 1)) * 100 : 100;
  const low = timed && slide.tone === 'work' && remaining <= 3;
  const btn = 'bg-black/20 hover:bg-black/30';

  const bar = (
    <>
      <button type="button" aria-label="Previous" onClick={() => go(index - 1)} disabled={index === 0} className={`flex h-12 w-12 items-center justify-center rounded-full ${btn} disabled:opacity-40`}><ChevronLeft className="h-6 w-6" aria-hidden="true" /></button>
      {!manual && <button type="button" aria-label={paused ? 'Resume' : 'Pause'} onClick={() => setPaused((value) => !value)} className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-700 text-white hover:bg-orange-800">{paused ? <Play className="h-6 w-6" aria-hidden="true" /> : <Pause className="h-6 w-6" aria-hidden="true" />}</button>}
      <button type="button" aria-label="Next" onClick={() => go(index + 1)} disabled={last} className={`flex h-12 w-12 items-center justify-center rounded-full ${manual ? 'bg-orange-700 text-white hover:bg-orange-800' : btn} disabled:opacity-40`}><ChevronRight className="h-6 w-6" aria-hidden="true" /></button>
    </>
  );

  return (
    <ScreenShell surface={`${surface} transition-colors duration-300`} label={label} onClose={onClose} bar={bar} onKey={onKey} onScreenClick={manual ? () => go(index + 1) : undefined}>
      <div className="h-1.5 w-full bg-black/20"><div className="h-full bg-white/80 transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4 sm:px-10">
        <div className="m-auto flex w-full max-w-6xl flex-col items-center gap-4 text-center">
          {slide.chip && <p className={`text-[clamp(0.95rem,2vw,1.6rem)] font-bold uppercase tracking-wider ${muted}`}>{slide.chip}</p>}
          {slide.image && <img src={slide.image} alt="" className="max-h-[34vh] max-w-full rounded-2xl bg-white object-contain" />}
          <h2 className={`break-words font-black leading-[1.05] tracking-tight ${slide.rows ? 'text-[clamp(1.8rem,5vw,4rem)]' : 'text-[clamp(2.2rem,8vw,7rem)]'}`}>{slide.title}</h2>
          {slide.rows && (
            <ul className="w-full max-w-4xl space-y-2 text-left">
              {slide.rows.map((row, position) => (
                <li key={position} className="border-b border-current/20 pb-2">
                  <p className="flex items-baseline justify-between gap-4 text-[clamp(1.2rem,3.4vw,2.6rem)] font-bold leading-tight"><span className="min-w-0 break-words">{row.left}</span>{row.right && <span className="shrink-0 tabular-nums">{row.right}</span>}</p>
                  {row.sub && <p className={`text-[clamp(0.9rem,1.8vw,1.4rem)] ${muted}`}>{row.sub}</p>}
                </li>
              ))}
            </ul>
          )}
          {slide.note && <p className={`max-w-4xl whitespace-pre-wrap break-words ${slide.tone === 'reveal' ? 'text-[clamp(1.4rem,4vw,3.4rem)] font-bold tracking-[0.2em]' : `text-[clamp(1.1rem,2.8vw,2.4rem)] ${muted}`}`}>{slide.note}</p>}
          {showTimer && timed && <p aria-label="Time left" className={`text-[clamp(4rem,18vw,13rem)] font-black leading-none tabular-nums ${low ? 'text-red-300' : ''}`}>{formatClock(remaining)}</p>}
          {slide.next && <p className={`text-[clamp(1rem,2.2vw,1.8rem)] ${muted}`}>Next: <span className="font-bold">{slide.next}</span></p>}
          {manual && index === 0 && <p className={`text-sm ${muted}`}>Click, press space or the right arrow to move on.</p>}
        </div>
      </div>
    </ScreenShell>
  );
};

export default TimedPlayer;
