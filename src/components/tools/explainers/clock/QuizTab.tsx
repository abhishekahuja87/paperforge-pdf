import React, { useCallback, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { card } from '../../paper/controls';
import { CLOCK_LEVELS, capitalise, digital, randomTime, readOptions, sameTime, timeWords, type ClockLevel, type ClockTime } from '../../../../lib/kids/clockTime';
import { ClockFace } from './ClockFace';

type Mode = 'set' | 'read';
const ROUND = 10;

interface Question { answer: ClockTime; options: ClockTime[] }

const makeQuestion = (level: ClockLevel, previous?: ClockTime): Question => {
  const answer = randomTime(level, previous);
  return { answer, options: readOptions(answer, level) };
};

export const QuizTab: React.FC = () => {
  const [level, setLevel] = useState<ClockLevel>('oclock');
  const [mode, setMode] = useState<Mode>('read');
  const [question, setQuestion] = useState<Question>(() => makeQuestion('oclock'));
  const [clock, setClock] = useState<ClockTime>({ h: 0, m: 0 });
  const [result, setResult] = useState<'right' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [asked, setAsked] = useState(0);

  const restart = useCallback((nextLevel: ClockLevel) => {
    setQuestion(makeQuestion(nextLevel));
    setClock({ h: 0, m: 0 });
    setResult(null);
    setScore(0);
    setAsked(0);
  }, []);

  const finished = asked >= ROUND && result !== null;

  const answer = (correct: boolean) => {
    if (result) return;
    setResult(correct ? 'right' : 'wrong');
    setAsked((count) => count + 1);
    if (correct) setScore((value) => value + 1);
  };

  const next = () => {
    if (finished) { restart(level); return; }
    setQuestion(makeQuestion(level, question.answer));
    setClock({ h: 0, m: 0 });
    setResult(null);
  };

  const chip = (active: boolean) => `min-h-11 rounded-full border px-4 py-2 text-sm font-bold ${active ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`;

  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Quiz type">
          <button type="button" className={chip(mode === 'read')} aria-pressed={mode === 'read'} onClick={() => { setMode('read'); restart(level); }}>Read the clock</button>
          <button type="button" className={chip(mode === 'set')} aria-pressed={mode === 'set'} onClick={() => { setMode('set'); restart(level); }}>Set the clock</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Level">
          {CLOCK_LEVELS.map((item) => (
            <button key={item.id} type="button" className={chip(level === item.id)} aria-pressed={level === item.id} title={item.hint} onClick={() => { setLevel(item.id); restart(item.id); }}>{item.label}</button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-600">{CLOCK_LEVELS.find((item) => item.id === level)?.hint}. A round has {ROUND} questions.</p>
      </div>

      <div className={card}>
        <p className="text-center text-sm font-bold text-slate-700" aria-live="polite">Question {Math.min(asked + (result ? 0 : 1), ROUND)} of {ROUND} · Score {score}</p>
        <div className="mx-auto mt-2 grid max-w-3xl gap-4 md:grid-cols-2 md:items-center">
          <div className="mx-auto w-full max-w-sm">
            {mode === 'read'
              ? <ClockFace time={question.answer} label="What time does this clock show?" />
              : <ClockFace time={clock} onChange={result ? undefined : setClock} step={level === 'any' ? 1 : level === 'five' ? 5 : level === 'quarter' ? 15 : level === 'half' ? 30 : 60} label="Move the hands to the time in the question." />}
          </div>
          <div>
            {mode === 'read' ? (
              <>
                <h3 className="text-lg font-black text-slate-900">What time is it?</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {question.options.map((option) => {
                    const isAnswer = sameTime(option, question.answer);
                    const tone = result && isAnswer ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50';
                    return (
                      <button key={digital(option)} type="button" disabled={result !== null} onClick={() => answer(isAnswer)}
                        className={`min-h-16 rounded-xl border-2 px-3 py-3 text-2xl font-black tabular-nums disabled:cursor-default ${tone}`}>{digital(option)}</button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-black text-slate-900">Set the clock to</h3>
                <p className="mt-1 text-5xl font-black tabular-nums text-slate-900">{digital(question.answer)}</p>
                <p className="mt-1 text-base font-semibold text-orange-800">{capitalise(timeWords(question.answer))}</p>
                <button type="button" disabled={result !== null} onClick={() => answer(sameTime(clock, question.answer))}
                  className="mt-4 min-h-12 w-full rounded-xl bg-orange-700 px-4 py-3 text-base font-bold text-white hover:bg-orange-800 disabled:opacity-50">Check</button>
              </>
            )}

            {result && (
              <div role="status" className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-sm font-bold ${result === 'right' ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
                {result === 'right' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />}
                <span>
                  {result === 'right' ? 'Well done!' : 'Not quite.'} {mode === 'read' || result === 'wrong' ? <>The time is {digital(question.answer)}, {timeWords(question.answer)}.</> : null}
                  {result === 'wrong' && mode === 'set' && <span className="mt-1 block font-semibold">The short hand shows the hour and the long hand shows the minutes.</span>}
                </span>
              </div>
            )}
            {result && (
              <button type="button" onClick={next} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
                {finished ? <><RotateCcw className="h-4 w-4" aria-hidden="true" />You scored {score} out of {ROUND}. Play again</> : 'Next question'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
