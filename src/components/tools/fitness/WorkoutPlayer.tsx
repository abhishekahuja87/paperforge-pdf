import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { EXERCISES, GROUPS, imageUrl } from '../../../lib/fitness/exercises';
import { BLOCKS, buildSlides, formatClock, formatPlanDate, type Slide, type Timing, type WorkoutPlan } from '../../../lib/fitness/workout';
import { FLIP_CSS } from '../shared/flipCss';

export interface ShowOptions {
  date: boolean;
  title: boolean;
  place: boolean;
  pictures: boolean;
  muscles: boolean;
  steps: boolean;
  timer: boolean;
  next: boolean;
  light: boolean;
}

export const DEFAULT_SHOW: ShowOptions = { date: true, title: true, place: true, pictures: true, muscles: true, steps: true, timer: true, next: true, light: false };

const BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));
const GROUP_LABEL = new Map(GROUPS.map((group) => [group.id, group.label]));
const blockLabel = (id: string): string => BLOCKS.find((block) => block.id === id)?.label ?? '';

interface Props { plan: WorkoutPlan; timing: Timing; show: ShowOptions; onClose: () => void }

export const WorkoutPlayer: React.FC<Props> = ({ plan, timing, show, onClose }) => {
  const slides = useMemo(() => buildSlides(plan, timing), [plan, timing]);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(slides[0]?.seconds ?? 0);
  const [paused, setPaused] = useState(false);
  const [controls, setControls] = useState(true);
  const [notesAt, setNotesAt] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastTick = useRef(Date.now());
  const hideTimer = useRef<number | undefined>(undefined);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const slide: Slide = slides[Math.min(index, slides.length - 1)] ?? { kind: 'end', seconds: 0 };

  const go = useCallback((target: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, target));
    setIndex(next);
    setRemaining(slides[next]?.seconds ?? 0);
    lastTick.current = Date.now();
  }, [slides]);

  const reveal = useCallback(() => {
    setControls(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setControls(false), 3500);
  }, []);

  // Count down with real elapsed time, so a throttled timer never makes a slide last longer.
  useEffect(() => {
    if (paused || slide.seconds === 0) return undefined;
    const id = window.setInterval(() => {
      const now = Date.now();
      const elapsed = Math.min(1, (now - lastTick.current) / 1000);
      lastTick.current = now;
      setRemaining((value) => value - elapsed);
    }, 200);
    return () => window.clearInterval(id);
  }, [paused, slide.seconds, index]);

  useEffect(() => {
    if (remaining <= 0 && slide.seconds > 0 && index < slides.length - 1) go(index + 1);
  }, [remaining, slide.seconds, index, slides.length, go]);

  // Full screen, screen kept awake, and keys. Each is optional: a browser that refuses still shows the full-window player.
  useEffect(() => {
    const root = rootRef.current;
    let active = true;
    let lock: WakeLockSentinel | null = null;
    const takeLock = async () => {
      try { lock = (await navigator.wakeLock?.request('screen')) ?? null; } catch { lock = null; }
    };
    void takeLock();
    const onVisible = () => { if (document.visibilityState === 'visible') void takeLock(); };
    const onFullscreen = () => { if (!document.fullscreenElement) closeRef.current(); };
    document.addEventListener('visibilitychange', onVisible);
    try { void root?.requestFullscreen?.().then(() => { if (active) document.addEventListener('fullscreenchange', onFullscreen); }).catch(() => undefined); } catch { /* the overlay still fills the window */ }
    reveal();
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.clearTimeout(hideTimer.current);
      void lock?.release().catch(() => undefined);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, [reveal]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      reveal();
      if (event.key === 'ArrowRight') go(index + 1);
      else if (event.key === 'ArrowLeft') go(index - 1);
      else if (event.key === ' ') { event.preventDefault(); setPaused((value) => !value); }
      else if (event.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, reveal]);

  const dark = !show.light;
  const surface = dark ? 'bg-stone-950 text-white' : 'bg-white text-stone-900';
  const muted = dark ? 'text-stone-300' : 'text-stone-600';
  const accent = dark ? 'text-orange-300' : 'text-orange-700';
  const chip = dark ? 'bg-white/10 text-orange-200' : 'bg-orange-50 text-orange-800';
  const progress = slides.length > 1 ? (index / (slides.length - 1)) * 100 : 100;

  const header = [show.title ? plan.title.trim() : '', show.place ? plan.place.trim() : '', show.date ? formatPlanDate(plan.date) : ''].filter(Boolean);

  const renderBody = () => {
    if (slide.kind === 'intro') {
      const count = slides.filter((entry) => entry.kind === 'exercise').length;
      return (
        <div className="m-auto max-w-3xl space-y-4 text-center">
          {show.title && <h2 className="text-[clamp(2.2rem,7vw,5.5rem)] font-black leading-none tracking-tight">{plan.title.trim() || 'Workout'}</h2>}
          {show.date && <p className={`text-[clamp(1.1rem,2.6vw,2rem)] font-semibold ${accent}`}>{formatPlanDate(plan.date)}</p>}
          {show.place && plan.place.trim() && <p className={`text-[clamp(1rem,2vw,1.6rem)] ${muted}`}>{plan.place.trim()}</p>}
          <p className={`text-[clamp(1rem,2vw,1.5rem)] ${muted}`}>{count} {count === 1 ? 'exercise' : 'exercises'}. Get ready.</p>
        </div>
      );
    }
    if (slide.kind === 'end') {
      return (
        <div className="m-auto space-y-3 text-center">
          <h2 className="text-[clamp(2.2rem,7vw,5.5rem)] font-black leading-none">Workout done</h2>
          <p className={`text-[clamp(1.1rem,2.4vw,1.8rem)] ${muted}`}>Drink some water and stretch if you need to.</p>
        </div>
      );
    }
    if (slide.kind === 'rest') {
      return (
        <div className="m-auto space-y-3 text-center">
          <p className={`text-[clamp(1.2rem,3vw,2.2rem)] font-bold uppercase tracking-widest ${accent}`}>Rest</p>
          {show.timer && <p className="text-[clamp(4rem,16vw,11rem)] font-black leading-none tabular-nums">{formatClock(remaining)}</p>}
          <p className={`text-[clamp(1rem,2.4vw,1.8rem)] ${muted}`}>Next: <span className="font-bold">{slide.next.name}</span></p>
        </div>
      );
    }
    const exercise = slide.item.exerciseId ? BY_ID.get(slide.item.exerciseId) : undefined;
    const showPictures = show.pictures && exercise !== undefined;
    const works = exercise ? [...exercise.muscles, ...exercise.secondary.map((muscle) => `${muscle} (helps)`)].join(', ') : '';
    const hasNotes = Boolean(exercise) && ((show.muscles && works !== '') || show.steps);
    const notesOpen = notesAt === index;
    // On a phone the picture stays in view and the written details fold away until they are wanted; on a big screen everything shows.
    return (
      <div className={`flex min-h-0 flex-1 flex-col gap-3 lg:grid lg:items-center lg:gap-6 ${showPictures ? 'lg:grid-cols-2' : ''}`}>
        {showPictures && exercise && (
          <div className="relative mx-auto aspect-[3/2] w-[min(100%,calc(32vh*1.5))] shrink-0 overflow-hidden rounded-2xl bg-stone-200 lg:w-full lg:max-w-3xl">
            <img src={imageUrl(exercise.id, 0)} alt={`${exercise.name}: start position`} className="absolute inset-0 h-full w-full object-cover" />
            <img src={imageUrl(exercise.id, 1)} alt="" aria-hidden="true" className="mdu-wk-b absolute inset-0 h-full w-full object-cover" />
          </div>
        )}
        <div className={`min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto lg:flex-none lg:overflow-visible ${showPictures ? '' : 'mx-auto max-w-4xl text-center'}`}>
          <p className={`flex flex-wrap items-center gap-2 text-sm font-bold ${showPictures ? '' : 'justify-center'}`}>
            <span className={`rounded-full px-3 py-1 ${chip}`}>{blockLabel(slide.block)}</span>
            <span className={muted}>Exercise {slide.number} of {slide.total}</span>
            {exercise && <span className={muted}>· {GROUP_LABEL.get(exercise.group)}</span>}
          </p>
          <h2 className="text-[clamp(1.7rem,5.5vw,4.6rem)] font-black leading-[1.05] tracking-tight">{slide.item.name}</h2>
          {slide.item.detail.trim() && <p className={`text-[clamp(1.1rem,3vw,2.4rem)] font-bold ${accent}`}>{slide.item.detail.trim()}</p>}
          {show.timer && <p className="text-[clamp(2.6rem,11vw,8rem)] font-black leading-none tabular-nums">{formatClock(remaining)}</p>}
          {hasNotes && (
            <button
              type="button"
              aria-expanded={notesOpen}
              onClick={() => { setNotesAt(notesOpen ? null : index); if (!notesOpen) setPaused(true); }}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold lg:hidden ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-stone-100 hover:bg-stone-200'}`}
            >
              {notesOpen ? 'Hide details' : 'Show muscles and steps'}
              <ChevronDown className={`h-4 w-4 transition-transform ${notesOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          )}
          {hasNotes && exercise && (
            <div className={`space-y-3 ${notesOpen ? '' : 'hidden lg:block'}`}>
              {show.muscles && works && <p className={`text-[clamp(0.9rem,1.5vw,1.2rem)] ${muted}`}>Works: {works}</p>}
              {show.steps && (
                <ol className={`list-decimal space-y-1 pl-5 text-left text-[clamp(0.85rem,1.4vw,1.15rem)] leading-snug ${muted}`}>
                  {exercise.steps.slice(0, 4).map((step, number) => <li key={number}>{step}</li>)}
                </ol>
              )}
            </div>
          )}
          {show.next && slide.next && <p className={`text-[clamp(0.9rem,1.6vw,1.3rem)] ${muted}`}>Next: <span className="font-bold">{slide.next.name}</span></p>}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Workout slideshow"
      onPointerMove={reveal}
      onPointerDown={reveal}
      className={`fixed inset-0 z-[100] flex flex-col ${surface}`}
    >
      <style>{FLIP_CSS}</style>
      <div className={`h-1.5 w-full ${dark ? 'bg-white/10' : 'bg-stone-200'}`}><div className="h-full bg-orange-500 transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
      {header.length > 0 && slide.kind !== 'intro' && <p className={`px-5 pt-3 text-xs font-semibold sm:text-sm ${muted}`}>{header.join('  ·  ')}</p>}
      <div className={`flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-10 ${slide.kind === 'exercise' ? 'overflow-hidden lg:overflow-y-auto' : 'overflow-y-auto'}`}>{renderBody()}</div>
      <div className={`order-first flex items-center justify-center gap-3 px-4 pt-3 transition-opacity duration-500 sm:order-last sm:pb-5 sm:pt-0 ${controls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <button type="button" aria-label="Previous" onClick={() => go(index - 1)} disabled={index === 0} className={`flex h-12 w-12 items-center justify-center rounded-full ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-stone-100 hover:bg-stone-200'} disabled:opacity-40`}><ChevronLeft className="h-6 w-6" aria-hidden="true" /></button>
        <button type="button" aria-label={paused ? 'Resume' : 'Pause'} onClick={() => setPaused((value) => !value)} className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-700 text-white hover:bg-orange-800">{paused ? <Play className="h-6 w-6" aria-hidden="true" /> : <Pause className="h-6 w-6" aria-hidden="true" />}</button>
        <button type="button" aria-label="Next" onClick={() => go(index + 1)} disabled={index >= slides.length - 1} className={`flex h-12 w-12 items-center justify-center rounded-full ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-stone-100 hover:bg-stone-200'} disabled:opacity-40`}><ChevronRight className="h-6 w-6" aria-hidden="true" /></button>
        <button type="button" aria-label="Close slideshow" onClick={onClose} className={`ml-4 flex h-12 items-center gap-1.5 rounded-full px-4 text-sm font-bold ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-stone-100 hover:bg-stone-200'}`}><X className="h-4 w-4" aria-hidden="true" />Close</button>
      </div>
    </div>
  );
};

export default WorkoutPlayer;
