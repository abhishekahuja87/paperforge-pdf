import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SelectField, SimpleTable, Stat, StatGrid, calcCard } from '../../finance/ui';
import { ChoiceButtons } from '../utilities/common';
import { CONVERSIONS, GRADE_SCALES, cgpaToPercent, percentToCgpa, requiredNextTerm, weightedAverage, type ConversionMethod } from '../../../lib/students/gpa';
import { RowButton, RowInput, nextRowId } from '../shared/rows';

interface Row { id: string; name: string; credits: string; grade: string }
interface Term { id: string; name: string; credits: string; gpa: string }

const two = (value: number) => (Number.isFinite(value) ? value.toFixed(2) : '-');
const newRow = (): Row => ({ id: nextRowId(), name: '', credits: '3', grade: '' });
const newTerm = (): Term => ({ id: nextRowId(), name: '', credits: '', gpa: '' });

const TermMode: React.FC = () => {
  const [scaleId, setScaleId] = useState('ten');
  const scale = GRADE_SCALES.find((item) => item.id === scaleId) ?? GRADE_SCALES[0];
  const [rows, setRows] = useState<Row[]>([newRow(), newRow(), newRow()]);
  const update = (id: string, patch: Partial<Row>) => setRows((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const pointsOf = (row: Row) => (scale.id === 'custom' ? Number(row.grade) : scale.grades.find((grade) => grade.label === row.grade)?.points ?? NaN);
  const result = useMemo(
    () => weightedAverage(rows.filter((row) => row.grade !== '').map((row) => ({ credits: Number(row.credits), points: pointsOf(row) }))),
    [rows, scale],
  );
  const summary = result ? `GPA ${two(result.average)} on a scale of ${scale.max} across ${result.credits} credits` : '';
  return (
    <>
      <SelectField label="Grading scale" value={scaleId} onChange={(value) => { setScaleId(value); setRows((list) => list.map((row) => ({ ...row, grade: '' }))); }} options={GRADE_SCALES.map((item) => ({ value: item.id, label: item.name }))} />
      <div className="mt-4 space-y-2">
        {rows.map((row, index) => (
          <div key={row.id} className="grid grid-cols-[1fr_5rem_7rem_auto] items-center gap-2">
            <RowInput label={`Course ${index + 1} name`} placeholder={`Course ${index + 1}`} value={row.name} onChange={(event) => update(row.id, { name: event.target.value })} />
            <RowInput label={`Course ${index + 1} credits`} inputMode="decimal" placeholder="Credits" value={row.credits} onChange={(event) => update(row.id, { credits: event.target.value })} />
            {scale.id === 'custom' ? (
              <RowInput label={`Course ${index + 1} grade points`} inputMode="decimal" placeholder="Points" value={row.grade} onChange={(event) => update(row.id, { grade: event.target.value })} />
            ) : (
              <select aria-label={`Course ${index + 1} grade`} value={row.grade} onChange={(event) => update(row.id, { grade: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-sm text-slate-900">
                <option value="">Grade</option>
                {scale.grades.map((grade) => <option key={grade.label} value={grade.label}>{grade.label}</option>)}
              </select>
            )}
            <RowButton label={`Remove course ${index + 1}`} onClick={() => setRows((list) => (list.length > 1 ? list.filter((item) => item.id !== row.id) : list))}>Remove</RowButton>
          </div>
        ))}
      </div>
      <div className="mt-3"><RowButton onClick={() => setRows((list) => [...list, newRow()])}>Add a course</RowButton></div>
      {result ? (
        <>
          <StatGrid>
            <Stat tone="strong" label="Semester GPA" value={two(result.average)} />
            <Stat label="Credits counted" value={String(result.credits)} />
            <Stat label="Grade points earned" value={two(result.weightedPoints)} />
          </StatGrid>
          <ResultActions summary={summary} />
        </>
      ) : <Note>Choose a grade for at least one course with credits above zero to see your GPA.</Note>}
    </>
  );
};

const CgpaMode: React.FC = () => {
  const [terms, setTerms] = useState<Term[]>([newTerm(), newTerm()]);
  const update = (id: string, patch: Partial<Term>) => setTerms((list) => list.map((term) => (term.id === id ? { ...term, ...patch } : term)));
  const result = useMemo(() => weightedAverage(terms.filter((term) => term.gpa !== '').map((term) => ({ credits: Number(term.credits), points: Number(term.gpa) }))), [terms]);
  return (
    <>
      <p className="text-xs text-slate-600">Enter the GPA (SGPA) and credits of each semester. Weighting by credits is how most universities combine semesters.</p>
      <div className="mt-3 space-y-2">
        {terms.map((term, index) => (
          <div key={term.id} className="grid grid-cols-[1fr_5rem_5rem_auto] items-center gap-2">
            <RowInput label={`Semester ${index + 1} name`} placeholder={`Semester ${index + 1}`} value={term.name} onChange={(event) => update(term.id, { name: event.target.value })} />
            <RowInput label={`Semester ${index + 1} credits`} inputMode="decimal" placeholder="Credits" value={term.credits} onChange={(event) => update(term.id, { credits: event.target.value })} />
            <RowInput label={`Semester ${index + 1} GPA`} inputMode="decimal" placeholder="GPA" value={term.gpa} onChange={(event) => update(term.id, { gpa: event.target.value })} />
            <RowButton label={`Remove semester ${index + 1}`} onClick={() => setTerms((list) => (list.length > 1 ? list.filter((item) => item.id !== term.id) : list))}>Remove</RowButton>
          </div>
        ))}
      </div>
      <div className="mt-3"><RowButton onClick={() => setTerms((list) => [...list, newTerm()])}>Add a semester</RowButton></div>
      {result ? (
        <>
          <StatGrid>
            <Stat tone="strong" label="Cumulative GPA (CGPA)" value={two(result.average)} />
            <Stat label="Total credits" value={String(result.credits)} />
          </StatGrid>
          <ResultActions summary={`CGPA ${two(result.average)} across ${result.credits} credits`} />
        </>
      ) : <Note>Enter at least one semester with credits and a GPA.</Note>}
    </>
  );
};

const ConvertMode: React.FC = () => {
  const [method, setMethod] = useState<ConversionMethod>('times95');
  const [scaleMax, setScaleMax] = useState('10');
  const [cgpa, setCgpa] = useState('8.2');
  const [percent, setPercent] = useState('75');
  const max = method === 'ratio' ? Number(scaleMax) : 10;
  const chosen = CONVERSIONS.find((item) => item.id === method) ?? CONVERSIONS[0];
  const toPercent = cgpaToPercent(Number(cgpa), method, max);
  const toCgpa = percentToCgpa(Number(percent), method, max);
  const table = [6, 7, 8, 9, 10].map((value) => [String(value), `${two(cgpaToPercent(value, method, max))}%`]);
  return (
    <>
      <SelectField label="Conversion formula" value={method} onChange={(value) => setMethod(value as ConversionMethod)} options={CONVERSIONS.map((item) => ({ value: item.id, label: item.name }))} />
      <p className="mt-2 text-xs text-slate-600">{chosen.note}</p>
      <div className="mt-3">
        <InputGrid>
          {method === 'ratio' && <NumberField label="Scale maximum" value={scaleMax} onChange={setScaleMax} step="0.1" hint="For example 4, 5, 7 or 10" />}
          <NumberField label="CGPA" value={cgpa} onChange={setCgpa} step="0.01" />
          <NumberField label="Percentage" value={percent} onChange={setPercent} suffix="%" step="0.1" />
        </InputGrid>
      </div>
      <StatGrid>
        <Stat tone="strong" label="CGPA as percentage" value={Number.isFinite(toPercent) ? `${two(toPercent)}%` : '-'} />
        <Stat label="Percentage as CGPA" value={Number.isFinite(toCgpa) ? two(toCgpa) : '-'} />
      </StatGrid>
      {method !== 'ratio' && <SimpleTable caption="Quick reference for this formula" head={['CGPA', 'Percentage']} rows={table} />}
      <Note>Universities publish their own conversion rule, and some use a different formula for different grades. Use the one your institution or the employer or college you apply to asks for, and ask for it in writing if a form needs a percentage.</Note>
    </>
  );
};

const TargetMode: React.FC = () => {
  const [scaleMax, setScaleMax] = useState('10');
  const [current, setCurrent] = useState('7.8');
  const [done, setDone] = useState('60');
  const [target, setTarget] = useState('8');
  const [next, setNext] = useState('20');
  const result = requiredNextTerm(Number(current), Number(done), Number(target), Number(next), Number(scaleMax));
  return (
    <>
      <InputGrid>
        <NumberField label="Scale maximum" value={scaleMax} onChange={setScaleMax} step="0.1" />
        <NumberField label="Current CGPA" value={current} onChange={setCurrent} step="0.01" />
        <NumberField label="Credits completed so far" value={done} onChange={setDone} />
        <NumberField label="CGPA you want to reach" value={target} onChange={setTarget} step="0.01" />
        <NumberField label="Credits in the coming semester" value={next} onChange={setNext} />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat tone={result.status === 'impossible' ? 'plain' : 'strong'} label="GPA needed next semester" value={result.status === 'already' ? 'Any passing GPA' : two(result.required)} />
          </StatGrid>
          {result.status === 'impossible' && <Note>This target cannot be reached in one semester, because it needs more than the top of the scale. Try a lower target, or spread it across more than one semester.</Note>}
          {result.status === 'already' && <Note>You are already at or above this target; a very low GPA next semester could still lower your CGPA, so keep going.</Note>}
          <ResultActions summary={`To reach CGPA ${target} you need ${result.status === 'already' ? 'any passing GPA' : two(result.required)} next semester`} />
        </>
      ) : <Note>Enter every number to see the GPA you need.</Note>}
    </>
  );
};

export const GpaCalculator: React.FC = () => {
  const [mode, setMode] = useState('term');
  return (
    <section className={calcCard}>
      <ChoiceButtons label="What do you want to work out?" value={mode} onChange={setMode} options={[
        { value: 'term', label: 'Semester GPA' }, { value: 'cgpa', label: 'CGPA from semesters' }, { value: 'convert', label: 'CGPA ↔ percentage' }, { value: 'target', label: 'GPA needed to hit a target' },
      ]} />
      <div className="mt-4">
        {mode === 'term' && <TermMode />}
        {mode === 'cgpa' && <CgpaMode />}
        {mode === 'convert' && <ConvertMode />}
        {mode === 'target' && <TargetMode />}
      </div>
      <Note>Grade points, credits and the CGPA rule differ between institutions. Your university's official calculation always decides what appears on your transcript.</Note>
      <CalcFooter />
    </section>
  );
};

export default GpaCalculator;
