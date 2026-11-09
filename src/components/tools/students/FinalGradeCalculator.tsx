import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, Stat, StatGrid, calcCard } from '../../finance/ui';
import { gradeStatus, neededScore } from '../../../lib/students/grades';
import { RowButton, RowInput, nextRowId } from './rows';

interface Part { id: string; name: string; weight: string; score: string }
const one = (value: number) => `${(Math.round(value * 10) / 10).toString()}%`;
const sample = (): Part[] => [
  { id: nextRowId(), name: 'Assignments', weight: '20', score: '82' },
  { id: nextRowId(), name: 'Midterm', weight: '30', score: '74' },
  { id: nextRowId(), name: 'Final exam', weight: '50', score: '' },
];

export const FinalGradeCalculator: React.FC = () => {
  const [parts, setParts] = useState<Part[]>(sample);
  const [target, setTarget] = useState('80');
  const update = (id: string, patch: Partial<Part>) => setParts((list) => list.map((part) => (part.id === id ? { ...part, ...patch } : part)));
  const status = useMemo(() => gradeStatus(parts.map((part) => ({ name: part.name, weight: Number(part.weight), score: part.score.trim() === '' ? null : Number(part.score) }))), [parts]);
  const need = neededScore(status, Number(target));
  const weightWarning = status.totalWeight > 0 && Math.abs(status.totalWeight - 100) > 0.01;
  const needText = need.kind === 'done' ? `Target already secured` : need.kind === 'none-left' ? 'Nothing left to take' : `${one(need.needed)} on the remaining ${one(status.remainingWeight)} of the grade`;
  return (
    <section className={calcCard}>
      <p className="text-xs text-slate-600">List each part of the course with its weight (percent of the final grade) and your score as a percentage. Leave the score empty for parts you have not taken yet.</p>
      <div className="mt-3 space-y-2">
        {parts.map((part, index) => (
          <div key={part.id} className="grid grid-cols-[1fr_4.5rem_4.5rem_auto] items-center gap-2">
            <RowInput label={`Part ${index + 1} name`} placeholder={`Part ${index + 1}`} value={part.name} onChange={(event) => update(part.id, { name: event.target.value })} />
            <RowInput label={`Part ${index + 1} weight`} inputMode="decimal" placeholder="Weight %" value={part.weight} onChange={(event) => update(part.id, { weight: event.target.value })} />
            <RowInput label={`Part ${index + 1} score`} inputMode="decimal" placeholder="Score %" value={part.score} onChange={(event) => update(part.id, { score: event.target.value })} />
            <RowButton label={`Remove part ${index + 1}`} onClick={() => setParts((list) => (list.length > 1 ? list.filter((item) => item.id !== part.id) : list))}>Remove</RowButton>
          </div>
        ))}
      </div>
      <div className="mt-3"><RowButton onClick={() => setParts((list) => [...list, { id: nextRowId(), name: '', weight: '', score: '' }])}>Add a part</RowButton></div>
      <div className="mt-4">
        <InputGrid><NumberField label="Final grade you want (%)" value={target} onChange={setTarget} suffix="%" /></InputGrid>
      </div>
      {weightWarning && <Note>Your weights add up to {one(status.totalWeight)}, not 100%. Results use the weights as entered, so check the course outline.</Note>}
      <StatGrid>
        <Stat label="Your average so far" value={status.currentAverage === null ? '-' : one(status.currentAverage)} />
        <Stat label="Points already earned" value={one(status.earned)} />
        <Stat tone="strong" label="Score you need on the rest" value={needText} />
        <Stat label="Best possible final grade" value={one(status.best)} />
        <Stat label="Lowest possible final grade" value={one(status.worst)} />
      </StatGrid>
      {need.kind === 'impossible' && <Note>Reaching {target}% would need {one(need.needed)} on what is left, which is above 100%. The best you can finish with is {one(status.best)}. Ask your teacher whether extra credit or a re-take exists.</Note>}
      {need.kind === 'none-left' && <Note>Every part is graded and the final grade is {one(status.earned)}, below your target.</Note>}
      <ResultActions summary={`Average so far ${status.currentAverage === null ? '-' : one(status.currentAverage)}. To finish on ${target}%: ${needText}.`} />
      <Note>Some teachers drop the lowest score, round up, or curve grades. This uses the weights you enter, so check your syllabus for the exact rule.</Note>
      <CalcFooter />
    </section>
  );
};

export default FinalGradeCalculator;
