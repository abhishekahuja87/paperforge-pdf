import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Shuffle } from 'lucide-react';
import type { Ask } from '../../../../lib/kids/placeValue';

const STEP_MS = 1700;
const round = 'flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-40';
const primary = 'min-h-14 rounded-2xl bg-orange-600 px-6 py-3 text-xl font-black text-white hover:bg-orange-700 disabled:opacity-40';

export interface LessonFrame { line: string; caption: string; done: boolean; ask?: Ask }
export interface Pair { x: number; y: number }

interface Props<F extends LessonFrame> {
  /** The sign between the two numbers, for example + or ×. */
  sign: string;
  examples: Pair[];
  /** Which example opens first. */
  initial?: number;
  makeFrames: (x: number, y: number) => F[];
  isValid: (x: number, y: number) => boolean;
  random: () => Pair;
  result: (x: number, y: number) => number | string;
  /** Shown under My own numbers when the numbers are not allowed. */
  ownHint: string;
  /** The most digits to allow in each own-number box. */
  ownDigits?: [number, number];
  askTitle: (ask: Ask) => string;
  renderBoard: (frame: F, frames: F[], step: number, pair: Pair) => React.ReactNode;
}

type Mode = 'watch' | 'try';

/**
 * One sum at a time. Watch plays or steps through the working. You try shows the sum one step behind and asks for
 * the next number, with Try again, Show me after two wrong tries, and a score at the end.
 */
export function StepLesson<F extends LessonFrame>({ sign, examples, initial = 1, makeFrames, isValid, random, result, ownHint, ownDigits = [3, 3], askTitle, renderBoard }: Props<F>) {
  const [pair, setPair] = useState<Pair>(examples[Math.min(initial, examples.length - 1)]);
  const [mode, setMode] = useState<Mode>('watch');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [own, setOwn] = useState({ x: '', y: '' });
  const [entries, setEntries] = useState<string[]>([]);
  const [tries, setTries] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [misses, setMisses] = useState(0);
  const firstBox = useRef<HTMLInputElement>(null);

  const frames = useMemo(() => makeFrames(pair.x, pair.y), [makeFrames, pair]);
  const last = frames.length - 1;
  const frame = frames[Math.min(step, last)];
  const asks = useMemo(() => frames.filter((item) => item.ask).length, [frames]);
  const ask = mode === 'try' ? frames[step + 1]?.ask : undefined;

  useEffect(() => {
    if (mode !== 'watch' || !playing) return undefined;
    if (step >= last) { setPlaying(false); return undefined; }
    const timer = window.setTimeout(() => setStep((current) => Math.min(last, current + 1)), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [mode, playing, step, last]);

  useEffect(() => { setEntries(ask ? ask.answers.map(() => '') : []); setTries(0); setWrong(false); }, [ask, step]);
  useEffect(() => { if (ask) firstBox.current?.focus(); }, [ask, step]);

  const choose = (next: Pair) => { setPair(next); setStep(0); setPlaying(false); setMisses(0); };
  const switchMode = (next: Mode) => { setMode(next); setStep(0); setPlaying(false); setMisses(0); };
  const ownX = Number(own.x);
  const ownY = Number(own.y);
  const ownReady = own.x !== '' && own.y !== '';
  const ownValid = ownReady && isValid(ownX, ownY);

  const check = () => {
    if (!ask) return;
    const right = ask.answers.every((answer, i) => entries[i] !== '' && Number(entries[i]) === answer);
    if (right) { setStep((current) => current + 1); return; }
    setWrong(true);
    setTries((count) => count + 1);
  };
  const showMe = () => { setMisses((count) => count + 1); setStep((current) => current + 1); };
  const maxLen = ask ? Math.max(2, ...ask.answers.map((answer) => String(answer).length)) : 2;

  return (
    <div className="mx-auto max-w-xl space-y-3 lg:grid lg:max-w-5xl lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:content-start lg:gap-x-8 lg:gap-y-3 lg:space-y-0">
      <div className="grid grid-cols-2 gap-2 lg:col-start-2" role="group" aria-label="Watch or try">
        {([['watch', 'Watch'], ['try', 'You try']] as const).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={mode === id} onClick={() => switchMode(id)}
            className={`min-h-14 rounded-2xl border-2 text-lg font-black ${mode === id ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>{label}</button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 lg:col-start-2" role="group" aria-label="Examples">
        {examples.map((item) => {
          const on = item.x === pair.x && item.y === pair.y;
          return (
            <button key={`${item.x}${item.y}`} type="button" aria-pressed={on} onClick={() => choose(item)}
              className={`min-h-11 rounded-full border px-4 py-2 text-base font-bold ${on ? 'border-orange-600 bg-orange-50 text-orange-900 ring-1 ring-orange-600' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>{item.x} {sign} {item.y}</button>
          );
        })}
        <button type="button" aria-label="A new sum" onClick={() => choose(random())} className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><Shuffle className="h-5 w-5" aria-hidden="true" /></button>
      </div>

      <p className="text-center text-4xl font-black tracking-tight text-slate-900 lg:col-start-1 lg:row-start-1">
        {pair.x} {sign} {pair.y}{frame.done ? <span className="text-emerald-700"> = {result(pair.x, pair.y)}</span> : null}
      </p>

      <button type="button" className="block w-full text-left [&>svg]:mx-auto [&>svg]:max-h-[42vh] lg:col-start-1 lg:row-span-8 lg:row-start-2 lg:self-start lg:[&>svg]:max-h-[64vh]" onClick={() => { if (mode === 'watch') setStep((current) => Math.min(last, current + 1)); }} aria-label={mode === 'watch' ? 'Next step' : 'The sum'}>
        {renderBoard(frame, frames, Math.min(step, last), pair)}
      </button>

      {mode === 'watch' && (
        <>
          <p className="min-h-[3.5rem] rounded-2xl bg-orange-50 px-4 py-3 text-center text-2xl font-black text-orange-900 lg:col-start-2" aria-live="polite">{frame.line}</p>
          <div className="flex items-center justify-center gap-3 lg:col-start-2">
            <button type="button" aria-label="Back one step" className={round} disabled={step === 0} onClick={() => { setPlaying(false); setStep((current) => Math.max(0, current - 1)); }}><ChevronLeft className="h-7 w-7" aria-hidden="true" /></button>
            <button type="button" aria-label={playing ? 'Pause' : 'Play'} className={`${round} !h-16 !w-16 !border-orange-600 !bg-orange-600 !text-white hover:!bg-orange-700`} onClick={() => { if (step >= last) setStep(0); setPlaying((on) => !on); }}>
              {playing ? <Pause className="h-8 w-8" aria-hidden="true" /> : <Play className="h-8 w-8" aria-hidden="true" />}
            </button>
            <button type="button" aria-label="Next step" className={round} disabled={step >= last} onClick={() => { setPlaying(false); setStep((current) => Math.min(last, current + 1)); }}><ChevronRight className="h-7 w-7" aria-hidden="true" /></button>
            <button type="button" aria-label="Start again" className={round} onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw className="h-6 w-6" aria-hidden="true" /></button>
          </div>
        </>
      )}

      {mode === 'try' && (
        <div className="rounded-2xl bg-orange-50 px-4 py-4 text-center lg:col-start-2" aria-live="polite">
          {ask ? (
            <form onSubmit={(event) => { event.preventDefault(); check(); }} className="space-y-3">
              <p className="text-2xl font-black text-orange-900">{askTitle(ask)}</p>
              <div className="flex flex-wrap items-end justify-center gap-3">
                {ask.answers.map((_, i) => (
                  <label key={i} className="flex flex-col items-center text-sm font-bold text-slate-700">
                    {ask.labels?.[i] ?? ''}
                    <input ref={i === 0 ? firstBox : undefined} inputMode="numeric" value={entries[i] ?? ''} aria-label={ask.labels?.[i] ?? 'Your answer'}
                      onChange={(event) => { const value = event.target.value.replace(/\D/g, '').slice(0, maxLen); setEntries((list) => list.map((old, j) => (j === i ? value : old))); setWrong(false); }}
                      className={`mt-1 h-16 rounded-xl border-2 bg-white text-center text-3xl font-black ${maxLen > 2 ? 'w-32' : 'w-20'} ${wrong ? 'border-red-500' : 'border-slate-300'}`} />
                  </label>
                ))}
                <button type="submit" disabled={entries.some((value) => value === '')} className={primary}>Check</button>
              </div>
              {wrong && <p className="text-lg font-black text-red-700">Try again</p>}
              {tries >= 2 && <button type="button" onClick={showMe} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-base font-bold text-slate-800 hover:bg-slate-50">Show me</button>}
            </form>
          ) : step >= last ? (
            <div className="space-y-3">
              <p className="text-3xl font-black text-emerald-800">{misses === 0 ? '★ All right! ★' : `${asks - misses} of ${asks} right`}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button type="button" className={primary} onClick={() => choose(random())}>Another sum</button>
                <button type="button" className="min-h-14 rounded-2xl border-2 border-slate-300 bg-white px-5 py-3 text-lg font-black text-slate-800 hover:bg-slate-50" onClick={() => choose(pair)}>Same sum again</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-2xl font-black text-orange-900">{frame.line}</p>
              <button type="button" className={primary} onClick={() => setStep((current) => current + 1)}>Next</button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-center gap-1.5 lg:col-start-2" aria-hidden="true">
        {frames.map((_, index) => <span key={index} className={`h-2.5 w-2.5 rounded-full ${index === step ? 'bg-orange-600' : index < step ? 'bg-orange-300' : 'bg-slate-300'}`} />)}
      </div>

      <details className="rounded-2xl border border-slate-200 bg-white p-3 lg:col-start-2">
        <summary className="min-h-10 cursor-pointer text-sm font-bold text-slate-700">My own numbers</summary>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <input inputMode="numeric" aria-label="First number" value={own.x} onChange={(event) => setOwn((c) => ({ ...c, x: event.target.value.replace(/\D/g, '').slice(0, ownDigits[0]) }))} className="h-12 w-24 rounded-xl border border-slate-300 text-center text-xl font-bold" />
          <span className="text-2xl font-black text-slate-700">{sign}</span>
          <input inputMode="numeric" aria-label="Second number" value={own.y} onChange={(event) => setOwn((c) => ({ ...c, y: event.target.value.replace(/\D/g, '').slice(0, ownDigits[1]) }))} className="h-12 w-24 rounded-xl border border-slate-300 text-center text-xl font-bold" />
          <button type="button" disabled={!ownValid} onClick={() => choose({ x: ownX, y: ownY })} className="h-12 rounded-xl bg-slate-900 px-5 text-xl font-black text-white disabled:opacity-30" aria-label="Use my numbers">=</button>
        </div>
        {ownReady && !ownValid && <p role="status" className="mt-2 text-center text-xs text-slate-500">{ownHint}</p>}
      </details>
    </div>
  );
}
