import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { card } from '../../paper/controls';
import { SUBJECTS, SCENE, describe, sunTime, type SubjectId } from '../../../../lib/kids/shadow';
import { ShadowScene } from './ShadowScene';

const chip = (active: boolean) => `min-h-11 rounded-full border px-4 py-2 text-sm font-bold ${active ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'}`;

/** Move the sun and the subject and watch the shadow. Hide the shadow first to guess it. */
export const ExploreTab: React.FC = () => {
  const [alpha, setAlpha] = useState(40);
  const [x, setX] = useState(180);
  const [subject, setSubject] = useState<SubjectId>('person');
  const [hidden, setHidden] = useState(false);
  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0">
      <div className={card}>
        <ShadowScene alpha={alpha} personX={x} subject={subject} hideShadow={hidden} onSun={setAlpha} onMove={setX} />
        <p className="mt-2 text-xs text-slate-600">Drag the sun along its path. Drag the {SUBJECTS.find((s) => s.id === subject)?.label.toLowerCase()} left or right. The dashed line is the sun ray that just touches the top of the head. It ends where the shadow ends.</p>
        <p role="status" className="mt-2 text-base font-bold text-slate-900">It is about {sunTime(alpha)}. {hidden ? 'Where will the shadow fall? Guess, then show it.' : describe(alpha)}</p>
      </div>
      <div className={`${card} space-y-4`}>
        <label className="block text-sm font-bold text-slate-800">Move the sun ({sunTime(alpha)})
          <input type="range" min={SCENE.minAlpha} max={SCENE.maxAlpha} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} className="mt-2 block w-full" />
        </label>
        <label className="block text-sm font-bold text-slate-800">Move the {SUBJECTS.find((s) => s.id === subject)?.label.toLowerCase()}
          <input type="range" min={SCENE.minX} max={SCENE.maxX} value={x} onChange={(e) => setX(Number(e.target.value))} className="mt-2 block w-full" />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="What casts the shadow">
          {SUBJECTS.map((s) => <button key={s.id} type="button" className={chip(subject === s.id)} aria-pressed={subject === s.id} onClick={() => setSubject(s.id)}>{s.label}</button>)}
        </div>
        <button type="button" onClick={() => setHidden((v) => !v)} className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50">
          {hidden ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
          {hidden ? 'Show the shadow' : 'Hide the shadow so I can guess'}
        </button>
      </div>
    </div>
  );
};
