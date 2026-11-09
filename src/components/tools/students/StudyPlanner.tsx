import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, Stat, StatGrid, calcCard } from '../../finance/ui';
import { DateField } from '../utilities/common';
import { buildStudyPlan, planToText } from '../../../lib/students/planner';
import { todayInput } from '../../../lib/utilities/dates';
import { RowButton, RowInput, nextRowId } from './rows';

interface Subject { id: string; name: string; examDate: string; hours: string }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const newSubject = (): Subject => ({ id: nextRowId(), name: '', examDate: '', hours: '' });
const hoursText = (value: number) => `${Math.round(value * 10) / 10}h`;
const longDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export const StudyPlanner: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([newSubject(), newSubject()]);
  const [start, setStart] = useState(todayInput);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [perDay, setPerDay] = useState('3');
  const [revision, setRevision] = useState('1');
  const update = (id: string, patch: Partial<Subject>) => setSubjects((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const toggle = (day: number) => setWeekdays((list) => (list.includes(day) ? list.filter((item) => item !== day) : [...list, day]));

  const plan = useMemo(
    () => buildStudyPlan({
      subjects: subjects.map((item) => ({ name: item.name, examDate: item.examDate, hoursNeeded: Number(item.hours) })),
      startDate: start, studyWeekdays: weekdays, hoursPerDay: Number(perDay), revisionDays: Number(revision) || 0,
    }),
    [subjects, start, weekdays, perDay, revision],
  );
  const text = planToText(plan);

  return (
    <section className={calcCard}>
      <p className="text-xs text-slate-600">Add each subject with its exam date and the hours of study it still needs. The plan fills your study days, giving the most time to whatever is most urgent.</p>
      <div className="mt-3 space-y-2">
        {subjects.map((item, index) => (
          <div key={item.id} className="grid grid-cols-[1fr_8.5rem_4.5rem_auto] items-center gap-2">
            <RowInput label={`Subject ${index + 1} name`} placeholder={`Subject ${index + 1}`} value={item.name} onChange={(event) => update(item.id, { name: event.target.value })} />
            <RowInput label={`Subject ${index + 1} exam date`} type="date" value={item.examDate} onChange={(event) => update(item.id, { examDate: event.target.value })} />
            <RowInput label={`Subject ${index + 1} hours needed`} inputMode="decimal" placeholder="Hours" value={item.hours} onChange={(event) => update(item.id, { hours: event.target.value })} />
            <RowButton label={`Remove subject ${index + 1}`} onClick={() => setSubjects((list) => (list.length > 1 ? list.filter((row) => row.id !== item.id) : list))}>Remove</RowButton>
          </div>
        ))}
      </div>
      <div className="mt-3"><RowButton onClick={() => setSubjects((list) => [...list, newSubject()])}>Add a subject</RowButton></div>

      <div className="mt-4">
        <InputGrid>
          <DateField label="Start studying on" value={start} onChange={setStart} />
          <NumberField label="Hours you can study per day" value={perDay} onChange={setPerDay} step="0.5" />
          <NumberField label="Finish new material this many days before each exam" value={revision} onChange={setRevision} hint="The days left before the exam are for revision" />
        </InputGrid>
      </div>
      <div className="mt-3" role="group" aria-label="Days you can study">
        <p className="text-xs font-semibold text-slate-700">Days you can study</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {DAYS.map((label, day) => (
            <button key={label} type="button" aria-pressed={weekdays.includes(day)} onClick={() => toggle(day)} className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold ${weekdays.includes(day) ? 'border-orange-300 bg-orange-50 text-orange-900' : 'border-slate-200 bg-white text-slate-700'}`}>{label}</button>
          ))}
        </div>
      </div>

      {plan.days.length === 0 ? (
        <Note>Add at least one subject with an exam date and the hours needed, and pick the days you can study, to see your plan.</Note>
      ) : (
        <>
          <StatGrid>
            <Stat tone="strong" label="Hours planned" value={hoursText(plan.totalHours)} />
            <Stat label="Study days" value={String(plan.days.length)} />
            <Stat tone={plan.feasible ? 'good' : 'plain'} label="Does it fit?" value={plan.feasible ? 'Yes, every subject is covered' : 'Not fully'} />
          </StatGrid>
          {plan.shortfalls.length > 0 && (
            <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
              Not enough days before the exam for: {plan.shortfalls.map((item) => `${item.subject} (${hoursText(item.missingHours)} short)`).join(', ')}. Add study days, raise your hours per day, or reduce the hours needed.
            </p>
          )}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[20rem] text-left text-sm">
              <caption className="sr-only">Day by day study plan</caption>
              <thead><tr className="border-b border-slate-200 text-xs text-slate-600"><th scope="col" className="py-2 pr-3">Day</th><th scope="col" className="py-2">Study</th></tr></thead>
              <tbody>
                {plan.days.map((day) => (
                  <tr key={day.date} className="border-b border-slate-100 align-top">
                    <th scope="row" className="whitespace-nowrap py-2 pr-3 font-semibold text-slate-800">{longDate(day.date)}</th>
                    <td className="py-2 text-slate-800">{day.slots.map((slot) => `${slot.subject} ${hoursText(slot.hours)}`).join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ResultActions summary={text} />
        </>
      )}
      <Note>The plan is a starting point: it spreads hours evenly by urgency and does not know your lessons, breaks or how hard each topic is. Adjust it as you go, and keep the last days before each exam for revision and rest.</Note>
      <CalcFooter />
    </section>
  );
};

export default StudyPlanner;
