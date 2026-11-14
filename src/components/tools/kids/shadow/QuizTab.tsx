import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { card } from '../../paper/controls';
import { SCENE, SHADOW_LEVELS, describe, makeShadowQuestion, type ShadowLevel, type ShadowQuestion } from '../../../../lib/kids/shadow';
import { ShadowScene } from './ShadowScene';

const ROUND = 10;
const chip = (active: boolean) => `min-h-11 rounded-full border px-4 py-2 text-sm font-bold ${active ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`;
const bigButton = 'min-h-12 rounded-xl px-5 py-3 text-base font-bold disabled:opacity-50';

/** Guess where the shadow falls, then see it. Ten questions a round. */
export const QuizTab: React.FC = () => {
  const [level, setLevel] = useState<ShadowLevel>(1);
  const [question, setQuestion] = useState<ShadowQuestion>(() => makeShadowQuestion(1));
  const [alpha, setAlpha] = useState(question.alpha);
  const [result, setResult] = useState<boolean | null>(null);
  const [number, setNumber] = useState(1);
  const [score, setScore] = useState(0);

  const load = (next: ShadowQuestion) => { setQuestion(next); setAlpha(next.alpha); setResult(null); };
  const restart = (lv: ShadowLevel) => { setLevel(lv); setNumber(1); setScore(0); load(makeShadowQuestion(lv)); };
  const finish = (right: boolean) => { setResult(right); if (right) setScore((s) => s + 1); };
  const next = () => { setNumber((n) => n + 1); load(makeShadowQuestion(level)); };
  const done = number > ROUND;
  const isSet = question.kind === 'set';
  const shown = isSet && result === null ? 90 : alpha;

  if (done) {
    return (
      <div className={`${card} space-y-3 text-center`}>
        <p className="text-2xl font-black text-slate-900">You got {score} out of {ROUND}</p>
        <p className="text-sm text-slate-700">{score >= 8 ? 'Brilliant! You really understand shadows.' : score >= 5 ? 'Good going. Try the Explore tab to see more, then play again.' : 'Keep exploring. Move the sun and watch the shadow, then try again.'}</p>
        <button type="button" onClick={() => restart(level)} className={`${bigButton} inline-flex items-center gap-2 bg-orange-600 text-white hover:bg-orange-700`}><RotateCcw className="h-4 w-4" aria-hidden="true" />Play again</button>
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Try another level">
          {SHADOW_LEVELS.filter((item) => item.id !== level).map((item) => <button key={item.id} type="button" className={chip(false)} onClick={() => restart(item.id)}>Try {item.label}</button>)}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Level">
          {SHADOW_LEVELS.map((item) => <button key={item.id} type="button" className={chip(level === item.id)} aria-pressed={level === item.id} title={item.hint} onClick={() => restart(item.id)}>{item.label}</button>)}
        </div>
        <p className="mt-2 text-xs text-slate-600">{SHADOW_LEVELS.find((i) => i.id === level)?.hint}. Question {number} of {ROUND}. Score {score}.</p>
      </div>
      <div className={card}>
        <ShadowScene alpha={shown} personX={question.personX} subject={question.subject} hideShadow={result === null} onSun={isSet && result === null ? setAlpha : undefined} />
        <p className="mt-3 text-lg font-black text-slate-900">{question.prompt}</p>
        {isSet ? (
          <div className="mt-2 space-y-3">
            <label className="block text-sm font-bold text-slate-800">Move the sun
              <input type="range" min={SCENE.minAlpha} max={SCENE.maxAlpha} value={alpha} disabled={result !== null} onChange={(e) => setAlpha(Number(e.target.value))} className="mt-2 block w-full" />
            </label>
            {result === null && <button type="button" onClick={() => finish(question.target?.test(alpha) ?? false)} className={`${bigButton} bg-orange-600 text-white hover:bg-orange-700`}>Check</button>}
          </div>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {question.options.map((option) => (
              <button key={option.id} type="button" disabled={result !== null} onClick={() => finish(option.id === question.answer)} className={`${bigButton} border border-slate-300 bg-white text-slate-900 hover:bg-orange-50`}>{option.label}</button>
            ))}
          </div>
        )}
      </div>
      {result !== null && (
        <div role="status" className={`flex items-start gap-2 rounded-xl p-3 text-sm font-bold ${result ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
          {result ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />}
          <span>{result ? 'Right! ' : 'Not quite. '}{isSet && !result ? (question.target?.hint ?? '') : describe(alpha)}</span>
        </div>
      )}
      {result !== null && <button type="button" onClick={next} className={`${bigButton} w-full bg-slate-900 text-white hover:bg-slate-800`}>{number >= ROUND ? 'See my score' : 'Next question'}</button>}
    </div>
  );
};
