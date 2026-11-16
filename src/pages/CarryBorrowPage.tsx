import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Shuffle } from 'lucide-react';
import { PageMetadata } from '../components/common/PageMetadata';
import { PlaceBoard } from '../components/tools/kids/carry/PlaceBoard';
import { EXAMPLES, isValid, makeFrames, randomExample, type Example, type Op } from '../lib/kids/placeValue';

const STEP_MS = 1700;
const sign = (op: Op) => (op === 'add' ? '+' : '−');
const round = 'flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-40';

/**
 * A hidden page (no link anywhere, not in the sitemap, noindex): column addition with carrying and column
 * subtraction with borrowing, shown only as pictures of blocks. Digits and signs are the only text.
 */
export const CarryBorrowPage: React.FC = () => {
  const [example, setExample] = useState<Example>(EXAMPLES[1]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [own, setOwn] = useState<{ x: string; y: string }>({ x: '', y: '' });

  const frames = useMemo(() => makeFrames(example.op, example.x, example.y), [example]);
  const frame = frames[Math.min(step, frames.length - 1)];
  const last = frames.length - 1;

  useEffect(() => {
    if (!playing) return undefined;
    if (step >= last) { setPlaying(false); return undefined; }
    const timer = window.setTimeout(() => setStep((current) => Math.min(last, current + 1)), STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, step, last]);

  const choose = (next: Example) => { setExample(next); setStep(0); setPlaying(false); };
  const ownX = Number(own.x);
  const ownY = Number(own.y);
  const ownReady = own.x !== '' && own.y !== '';
  const ownValid = isValid(example.op, ownX, ownY);
  const result = example.op === 'add' ? example.x + example.y : example.x - example.y;

  return (
    <div className="mx-auto max-w-xl px-4 py-4">
      <PageMetadata title="Carry and borrow in pictures" description="Addition with carrying and subtraction with borrowing, shown as blocks." noindex />

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Choose adding or taking away">
        {(['add', 'sub'] as const).map((op) => (
          <button key={op} type="button" aria-pressed={example.op === op} aria-label={op === 'add' ? 'Adding, with carrying' : 'Taking away, with borrowing'} onClick={() => choose(EXAMPLES.find((item) => item.op === op) ?? EXAMPLES[0])}
            className={`min-h-14 rounded-2xl border-2 text-3xl font-black ${example.op === op ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>{sign(op)}</button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Examples">
        {EXAMPLES.filter((item) => item.op === example.op).map((item) => {
          const on = item.x === example.x && item.y === example.y;
          return (
            <button key={`${item.x}${item.op}${item.y}`} type="button" aria-pressed={on} onClick={() => choose(item)}
              className={`min-h-11 rounded-full border px-4 py-2 text-base font-bold ${on ? 'border-orange-600 bg-orange-50 text-orange-900 ring-1 ring-orange-600' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>{item.x} {sign(item.op)} {item.y}</button>
          );
        })}
        <button type="button" aria-label="A new example" onClick={() => choose(randomExample(example.op))} className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"><Shuffle className="h-5 w-5" aria-hidden="true" /></button>
      </div>

      <p className="mt-4 text-center text-4xl font-black tracking-tight text-slate-900" aria-live="polite">
        {example.x} {sign(example.op)} {example.y}{frame.done ? <span className="text-emerald-700"> = {result}</span> : null}
      </p>

      <button type="button" className="mt-3 block w-full text-left" onClick={() => setStep((current) => Math.min(last, current + 1))} aria-label="Next picture">
        <PlaceBoard frame={frame} />
      </button>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button type="button" aria-label="Back one picture" className={round} disabled={step === 0} onClick={() => { setPlaying(false); setStep((current) => Math.max(0, current - 1)); }}><ChevronLeft className="h-7 w-7" aria-hidden="true" /></button>
        <button type="button" aria-label={playing ? 'Pause' : 'Play'} className={`${round} !h-16 !w-16 !border-orange-600 !bg-orange-600 !text-white hover:!bg-orange-700`} onClick={() => { if (step >= last) setStep(0); setPlaying((on) => !on); }}>
          {playing ? <Pause className="h-8 w-8" aria-hidden="true" /> : <Play className="h-8 w-8" aria-hidden="true" />}
        </button>
        <button type="button" aria-label="Next picture" className={round} disabled={step >= last} onClick={() => { setPlaying(false); setStep((current) => Math.min(last, current + 1)); }}><ChevronRight className="h-7 w-7" aria-hidden="true" /></button>
        <button type="button" aria-label="Start again" className={round} onClick={() => { setPlaying(false); setStep(0); }}><RotateCcw className="h-6 w-6" aria-hidden="true" /></button>
      </div>
      <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
        {frames.map((_, index) => <span key={index} className={`h-2.5 w-2.5 rounded-full ${index === step ? 'bg-orange-600' : index < step ? 'bg-orange-300' : 'bg-slate-300'}`} />)}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <input inputMode="numeric" aria-label="First number" value={own.x} onChange={(e) => setOwn((c) => ({ ...c, x: e.target.value.replace(/\D/g, '').slice(0, 3) }))} className="h-12 w-24 rounded-xl border border-slate-300 text-center text-xl font-bold" />
        <span className="text-2xl font-black text-slate-700">{sign(example.op)}</span>
        <input inputMode="numeric" aria-label="Second number" value={own.y} onChange={(e) => setOwn((c) => ({ ...c, y: e.target.value.replace(/\D/g, '').slice(0, 3) }))} className="h-12 w-24 rounded-xl border border-slate-300 text-center text-xl font-bold" />
        <button type="button" disabled={!ownReady || !ownValid} onClick={() => choose({ op: example.op, x: ownX, y: ownY })} className="h-12 rounded-xl bg-slate-900 px-5 text-xl font-black text-white disabled:opacity-30" aria-label="Show my numbers">=</button>
      </div>
      {ownReady && !ownValid && <p role="status" className="mt-2 text-center text-xs text-slate-500">{example.op === 'add' ? 'Use numbers that add up to less than 1000.' : 'The first number must be the bigger one, up to 999.'}</p>}
    </div>
  );
};

export default CarryBorrowPage;
