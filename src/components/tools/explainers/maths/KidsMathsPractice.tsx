import React, { useState } from 'react';
import { CheckCircle2, Printer, RotateCcw, Shuffle, XCircle } from 'lucide-react';
import { Toggle, card } from '../../paper/controls';
import { fieldClass } from '../../utilities/common';
import { MATH_LEVELS, MATH_TOPICS, formatAnswer, makeProblem, makeSet, type MathLevel, type MathProblem, type MathTopic } from '../../../../lib/kids/mathProblems';

const ROUND = 10;
const SHEET = 20;

interface Picker { topic: MathTopic; level: MathLevel; setTopic: (t: MathTopic) => void; setLevel: (l: MathLevel) => void }

const Pickers: React.FC<Picker> = ({ topic, level, setTopic, setLevel }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    <label className="block text-xs font-semibold text-slate-700">
      What to practise
      <select className={fieldClass} value={topic} onChange={(event) => setTopic(event.target.value as MathTopic)}>
        {MATH_TOPICS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </label>
    <label className="block text-xs font-semibold text-slate-700">
      How hard
      <select className={fieldClass} value={level} onChange={(event) => setLevel(Number(event.target.value) as MathLevel)}>
        {MATH_LEVELS.map((item) => <option key={item.id} value={item.id}>{item.label}: {item.hint}</option>)}
      </select>
    </label>
  </div>
);

const Quiz: React.FC = () => {
  const [topic, setTopic] = useState<MathTopic>('mixed');
  const [level, setLevel] = useState<MathLevel>(1);
  const [problem, setProblem] = useState<MathProblem>(() => makeProblem('mixed', 1));
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<'right' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [asked, setAsked] = useState(0);

  const restart = (nextTopic: MathTopic, nextLevel: MathLevel) => {
    setProblem(makeProblem(nextTopic, nextLevel));
    setTyped('');
    setResult(null);
    setScore(0);
    setAsked(0);
  };
  const finished = asked >= ROUND && result !== null;

  const check = (event: React.FormEvent) => {
    event.preventDefault();
    if (result || typed.trim() === '') return;
    const right = Number(typed.replace(/[^\d-]/g, '')) === problem.answer;
    setResult(right ? 'right' : 'wrong');
    setAsked((count) => count + 1);
    if (right) setScore((value) => value + 1);
  };

  const next = () => {
    if (finished) { restart(topic, level); return; }
    setProblem(makeProblem(topic, level));
    setTyped('');
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <div className={card}>
        <Pickers topic={topic} level={level} setTopic={(value) => { setTopic(value); restart(value, level); }} setLevel={(value) => { setLevel(value); restart(topic, value); }} />
      </div>
      <form onSubmit={check} className={card}>
        <p className="text-center text-sm font-bold text-slate-700" aria-live="polite">Question {Math.min(asked + (result ? 0 : 1), ROUND)} of {ROUND} · Score {score}</p>
        <p className={`mx-auto mt-3 max-w-xl text-center font-black text-slate-900 ${problem.rupees ? 'text-xl leading-snug' : 'text-5xl tabular-nums'}`}>{problem.text}</p>
        <div className="mx-auto mt-4 flex max-w-sm items-center gap-2">
          {problem.rupees && <span className="text-2xl font-black text-slate-700" aria-hidden="true">₹</span>}
          <input
            className={`${fieldClass} text-center text-2xl font-black`} inputMode="numeric" pattern="[0-9]*" autoComplete="off" aria-label="Your answer"
            value={typed} onChange={(event) => setTyped(event.target.value.replace(/[^\d]/g, '').slice(0, 7))} disabled={result !== null}
          />
          <button type="submit" disabled={result !== null || typed === ''} className="min-h-12 shrink-0 rounded-xl bg-orange-700 px-5 py-3 text-base font-bold text-white hover:bg-orange-800 disabled:opacity-50">Check</button>
        </div>
        {result && (
          <div role="status" className={`mx-auto mt-4 flex max-w-xl items-start gap-2 rounded-xl p-3 text-sm font-bold ${result === 'right' ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
            {result === 'right' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />}
            <span>{result === 'right' ? 'Well done!' : 'Not quite.'} The answer is {formatAnswer(problem)}.</span>
          </div>
        )}
        {result && (
          <button type="button" onClick={next} className="mx-auto mt-3 flex min-h-12 w-full max-w-xl items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
            {finished ? <><RotateCcw className="h-4 w-4" aria-hidden="true" />You scored {score} out of {ROUND}. Play again</> : 'Next question'}
          </button>
        )}
      </form>
    </div>
  );
};

const Worksheet: React.FC = () => {
  const [topic, setTopic] = useState<MathTopic>('mixed');
  const [level, setLevel] = useState<MathLevel>(1);
  const [problems, setProblems] = useState<MathProblem[]>(() => makeSet('mixed', 1, SHEET));
  const [answers, setAnswers] = useState(false);
  const words = topic === 'money';
  const list = words ? problems.slice(0, 10) : problems;

  return (
    <div className="space-y-4">
      <style>{`@media print { body * { visibility: hidden !important; } #km-print, #km-print * { visibility: visible !important; } #km-print { position: absolute; left: 0; top: 0; width: 100% !important; border: 0 !important; box-shadow: none !important; } @page { size: A4; margin: 12mm; } }`}</style>
      <div className={`${card} print:hidden`}>
        <Pickers topic={topic} level={level} setTopic={(value) => { setTopic(value); setProblems(makeSet(value, level, SHEET)); }} setLevel={(value) => { setLevel(value); setProblems(makeSet(topic, value, SHEET)); }} />
        <div className="mt-3"><Toggle label="Show the answers" hint="Marks the sheet for you. Switch it off before printing a copy for the child." checked={answers} onChange={setAnswers} /></div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => setProblems(makeSet(topic, level, SHEET))} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"><Shuffle className="h-4 w-4" aria-hidden="true" />New worksheet</button>
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-700 px-4 py-3 text-sm font-bold text-white hover:bg-orange-800"><Printer className="h-4 w-4" aria-hidden="true" />Print or save as PDF</button>
        </div>
      </div>
      <div id="km-print" className="mx-auto max-w-[794px] rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-slate-800 pb-2">
          <h3 className="text-xl font-black text-slate-900">Maths practice: {MATH_TOPICS.find((item) => item.id === topic)?.label}</h3>
          <p className="text-sm text-slate-700">Name: ____________________ &nbsp; Date: ____________</p>
        </div>
        <ol className={`mt-4 grid list-none gap-x-8 gap-y-5 p-0 ${words ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {list.map((problem, index) => (
            <li key={`${index}-${problem.text}`} className="text-base text-slate-900" style={{ breakInside: 'avoid' }}>
              <span className="mr-2 font-bold text-slate-500">{index + 1}.</span>
              <span className={words ? '' : 'text-xl font-bold tabular-nums'}>{problem.text}</span>
              {' '}
              {answers ? <strong className="text-emerald-700">{formatAnswer(problem)}</strong> : words ? <span className="mt-1 block">Answer: ____________</span> : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

/** Kids Maths Practice: a ten-question quiz and a printable worksheet, from adding to rupee word problems. */
export const KidsMathsPractice: React.FC = () => {
  const [tab, setTab] = useState<'quiz' | 'sheet'>('quiz');
  const tabs = [{ id: 'quiz', label: 'Quiz' }, { id: 'sheet', label: 'Worksheet' }] as const;
  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Maths practice" className="grid grid-cols-2 gap-2 print:hidden">
        {tabs.map((item) => (
          <button key={item.id} type="button" role="tab" id={`km-tab-${item.id}`} aria-selected={tab === item.id} aria-controls="km-panel" onClick={() => setTab(item.id)}
            className={`min-h-14 rounded-2xl border-2 px-3 py-3 text-base font-black ${tab === item.id ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`}>{item.label}</button>
        ))}
      </div>
      <div role="tabpanel" id="km-panel" aria-labelledby={`km-tab-${tab}`}>{tab === 'quiz' ? <Quiz /> : <Worksheet />}</div>
    </div>
  );
};

export default KidsMathsPractice;
