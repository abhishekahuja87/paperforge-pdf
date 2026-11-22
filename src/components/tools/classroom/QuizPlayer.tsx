import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { THEME_STYLES } from '../../../lib/screens/themes';
import { LETTERS, MODES, buildQuizSlides, formatClock, formatQuizDate, type Quiz, type QuizMode, type QuizQuestion, type QuizShow, type QuizSlide, type QuizTiming } from '../../../lib/classroom/quiz';

interface Props { quiz: Quiz; mode: QuizMode; timing: QuizTiming; show: QuizShow; onClose: () => void }

const modeLabel = (mode: QuizMode): string => MODES.find((entry) => entry.id === mode)?.label.replace(/ \(.*\)$/, '') ?? '';

/** Fullscreen quiz for a classroom monitor: learn (click to move), mock exam (timer, answer after each question) and real exam (timer, answers at the end). */
export const QuizPlayer: React.FC<Props> = ({ quiz, mode, timing, show, onClose }) => {
  const slides = useMemo(() => buildQuizSlides(quiz, mode, timing), [quiz, mode, timing]);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(slides[0]?.seconds ?? 0);
  const [paused, setPaused] = useState(false);
  const [controls, setControls] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastTick = useRef(Date.now());
  const hideTimer = useRef<number | undefined>(undefined);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const slide: QuizSlide = slides[Math.min(index, slides.length - 1)] ?? { kind: 'end', seconds: 0 };
  const auto = mode !== 'learn';

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

  // Count down with real elapsed time, so a throttled timer never makes a question last longer.
  useEffect(() => {
    if (paused || slide.seconds === 0) return undefined;
    lastTick.current = Date.now();
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
      if (event.key === 'ArrowRight' || (!auto && (event.key === ' ' || event.key === 'Enter'))) { event.preventDefault(); go(index + 1); }
      else if (event.key === 'ArrowLeft') go(index - 1);
      else if (event.key === ' ' && auto) { event.preventDefault(); setPaused((value) => !value); }
      else if (event.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, reveal, auto]);

  const style = THEME_STYLES[show.theme];
  const dark = !style.onLight;
  const { surface, muted, accent, chip, btn } = style;
  const progress = slides.length > 1 ? (index / (slides.length - 1)) * 100 : 100;
  const header = [show.title ? quiz.title.trim() : '', show.subject ? quiz.subject.trim() : '', show.date ? formatQuizDate(quiz.date) : ''].filter(Boolean);
  const timedSlide = slide.seconds > 0 && (slide.kind === 'question' || slide.kind === 'answer');
  const low = slide.kind === 'question' && auto && remaining <= 5;

  const options = (question: QuizQuestion, showAnswer: boolean) => {
    const wide = question.options.some((option) => option.image);
    return (
      <ol className={`grid gap-3 ${wide || question.options.length > 4 ? 'sm:grid-cols-2 lg:grid-cols-3' : question.options.length > 2 ? 'sm:grid-cols-2' : ''}`}>
        {question.options.map((option, position) => {
          const right = showAnswer && position === question.correct;
          const wrong = showAnswer && !right;
          const tone = right ? 'border-green-500 bg-green-600 text-white' : wrong ? (dark ? 'border-white/10 bg-white/5 opacity-40' : 'border-stone-200 bg-stone-50 opacity-40') : (dark ? 'border-white/20 bg-white/10' : 'border-stone-300 bg-white');
          return (
            <li key={option.key} className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${tone}`}>
              <span className={`flex h-[clamp(2rem,4vw,3.2rem)] w-[clamp(2rem,4vw,3.2rem)] shrink-0 items-center justify-center rounded-full text-[clamp(1rem,2.2vw,1.8rem)] font-black ${right ? 'bg-white text-green-700' : dark ? 'bg-white/15' : 'bg-stone-200'}`}>{LETTERS[position]}</span>
              <span className="min-w-0 flex-1 space-y-2">
                {option.image && <img src={option.image} alt="" className="max-h-[22vh] w-full rounded-lg bg-white object-contain" />}
                {option.text.trim() && <span className="block break-words text-[clamp(1.1rem,2.6vw,2.2rem)] font-bold leading-tight">{option.text}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    );
  };

  const renderBody = () => {
    if (slide.kind === 'intro') {
      return (
        <div className="m-auto max-w-3xl space-y-4 text-center">
          {show.title && <h2 className="text-[clamp(2.2rem,7vw,5.5rem)] font-black leading-none tracking-tight">{quiz.title.trim() || 'Quiz'}</h2>}
          {show.subject && quiz.subject.trim() && <p className={`text-[clamp(1.1rem,2.6vw,2rem)] font-semibold ${accent}`}>{quiz.subject.trim()}</p>}
          {show.date && <p className={`text-[clamp(1rem,2vw,1.6rem)] ${muted}`}>{formatQuizDate(quiz.date)}</p>}
          <p className={`text-[clamp(1rem,2vw,1.5rem)] ${muted}`}>{modeLabel(mode)} · {quiz.questions.length} {quiz.questions.length === 1 ? 'question' : 'questions'}{auto ? ` · ${timing.seconds} seconds each` : ''}</p>
          {!auto && <p className={`text-sm ${muted}`}>Click, press space or the right arrow to start.</p>}
        </div>
      );
    }
    if (slide.kind === 'end') {
      return (
        <div className="m-auto space-y-3 text-center">
          <h2 className="text-[clamp(2.2rem,7vw,5.5rem)] font-black leading-none">That was the last question</h2>
          <p className={`text-[clamp(1.1rem,2.4vw,1.8rem)] ${muted}`}>Well done, everyone.</p>
        </div>
      );
    }
    if (slide.kind === 'review') {
      return (
        <div className="mx-auto w-full max-w-5xl space-y-3">
          <h2 className="text-[clamp(1.6rem,4vw,3rem)] font-black leading-tight">Answer key</h2>
          <ol className="space-y-2">
            {quiz.questions.map((question, position) => {
              const correct = question.options[question.correct];
              return (
                <li key={question.key} className={`rounded-xl border p-3 ${dark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-stone-50'}`}>
                  <p className="text-[clamp(0.95rem,1.8vw,1.4rem)] font-bold leading-snug">{position + 1}. {question.text.trim() || '(picture question)'}</p>
                  <p className="mt-1 flex items-center gap-2 text-[clamp(0.95rem,1.8vw,1.4rem)] font-black text-green-500">
                    {LETTERS[question.correct]}) {correct?.text.trim() || '(picture)'}
                    {correct?.image && <img src={correct.image} alt="" className="h-10 rounded bg-white object-contain" />}
                  </p>
                  {show.explanation && question.explanation.trim() && <p className={`mt-1 text-[clamp(0.85rem,1.5vw,1.15rem)] ${muted}`}>{question.explanation.trim()}</p>}
                </li>
              );
            })}
          </ol>
        </div>
      );
    }
    const { question } = slide;
    const showAnswer = slide.kind === 'answer';
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col justify-center gap-5">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
          <span className={`rounded-full px-3 py-1 ${chip}`}>{modeLabel(mode)}</span>
          {show.number && <span className={muted}>Question {slide.number} of {slide.total}</span>}
          {showAnswer && <span className="rounded-full bg-green-600 px-3 py-1 text-white">Answer</span>}
        </div>
        <div className={`grid items-center gap-5 ${question.image ? 'lg:grid-cols-2' : ''}`}>
          {question.image && <img src={question.image} alt="" className="mx-auto max-h-[38vh] w-full rounded-2xl bg-white object-contain" />}
          {question.text.trim() && <h2 className="whitespace-pre-wrap break-words text-[clamp(1.6rem,4.4vw,3.8rem)] font-black leading-[1.1] tracking-tight">{question.text}</h2>}
        </div>
        {options(question, showAnswer)}
        {showAnswer && show.explanation && question.explanation.trim() && (
          <p className={`rounded-2xl p-4 text-[clamp(1rem,2.2vw,1.8rem)] leading-snug ${dark ? 'bg-white/10' : 'bg-stone-100'}`}><span className="font-black">Why: </span>{question.explanation.trim()}</p>
        )}
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Quiz"
      onPointerMove={reveal}
      onPointerDown={reveal}
      onClick={(event) => { if (!auto && (event.target as HTMLElement).closest('button') === null) go(index + 1); }}
      className={`fixed inset-0 z-[100] flex flex-col ${surface} ${auto ? '' : 'cursor-pointer'}`}
    >
      <div className={`h-1.5 w-full ${style.track}`}><div className="h-full bg-orange-500 transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
      <div className="flex items-start justify-between gap-4 px-5 pt-3 sm:px-10">
        <p className={`text-xs font-semibold sm:text-sm ${muted}`}>{slide.kind !== 'intro' ? header.join('  ·  ') : ''}</p>
        {show.timer && timedSlide && (
          <p aria-label="Time left" className={`text-[clamp(2.2rem,6vw,4.5rem)] font-black leading-none tabular-nums ${low ? 'text-red-500' : ''}`}>{formatClock(remaining)}</p>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4 sm:px-10">{renderBody()}</div>
      <div className={`order-first flex items-center justify-center gap-3 px-4 pt-3 transition-opacity duration-500 sm:order-last sm:pb-5 sm:pt-0 ${controls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <button type="button" aria-label="Previous" onClick={() => go(index - 1)} disabled={index === 0} className={`flex h-12 w-12 items-center justify-center rounded-full ${btn} disabled:opacity-40`}><ChevronLeft className="h-6 w-6" aria-hidden="true" /></button>
        {auto && <button type="button" aria-label={paused ? 'Resume' : 'Pause'} onClick={() => setPaused((value) => !value)} className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-700 text-white hover:bg-orange-800">{paused ? <Play className="h-6 w-6" aria-hidden="true" /> : <Pause className="h-6 w-6" aria-hidden="true" />}</button>}
        <button type="button" aria-label="Next" onClick={() => go(index + 1)} disabled={index >= slides.length - 1} className={`flex h-12 w-12 items-center justify-center rounded-full ${auto ? btn : 'bg-orange-700 text-white hover:bg-orange-800'} disabled:opacity-40`}><ChevronRight className="h-6 w-6" aria-hidden="true" /></button>
        <button type="button" aria-label="Close quiz" onClick={onClose} className={`ml-4 flex h-12 items-center gap-1.5 rounded-full px-4 text-sm font-bold ${btn}`}><X className="h-4 w-4" aria-hidden="true" />Close</button>
      </div>
    </div>
  );
};

export default QuizPlayer;
