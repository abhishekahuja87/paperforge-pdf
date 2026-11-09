import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, NumberField, ResultActions, Stat, StatGrid, calcCard } from '../../finance/ui';
import { ChoiceButtons, DateField } from './common';
import { WEEKDAYS, addDays, addMonths, diffYmd, formatDate, parseDateInput, todayInput, totalDays, weekdaysBetween } from '../../../lib/utilities/dates';

const Difference: React.FC = () => {
  const [start, setStart] = useState(todayInput);
  const [end, setEnd] = useState('2026-12-31');
  const [inclusive, setInclusive] = useState('no');

  const result = useMemo(() => {
    const a = parseDateInput(start);
    const b = parseDateInput(end);
    if (!a || !b) return null;
    const [from, to] = a.getTime() <= b.getTime() ? [a, b] : [b, a];
    const extra = inclusive === 'yes' ? 1 : 0;
    const days = totalDays(from, to) + extra;
    const weekdays = weekdaysBetween(from, addDays(to, extra));
    return { ymd: diffYmd(from, to), days, weeks: Math.floor(days / 7), remainder: days % 7, weekdays, hours: days * 24, reversed: a.getTime() > b.getTime() };
  }, [start, end, inclusive]);

  const summary = result ? `From ${start} to ${end}: ${result.days} days (${result.weekdays} working days). mydailyutils.in` : '';
  return (
    <>
      <InputGrid>
        <DateField label="Start date" value={start} onChange={setStart} />
        <DateField label="End date" value={end} onChange={setEnd} />
      </InputGrid>
      <div className="mt-3"><ChoiceButtons label="Count the end date?" value={inclusive} onChange={setInclusive} options={[{ value: 'no', label: 'Do not count end date' }, { value: 'yes', label: 'Count both dates' }]} /></div>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Difference" value={`${result.ymd.years} years, ${result.ymd.months} months, ${result.ymd.days} days`} tone="strong" />
            <Stat label="Total days" value={result.days.toLocaleString('en-IN')} />
            <Stat label="In weeks" value={`${result.weeks} weeks, ${result.remainder} days`} />
            <Stat label="Working days (Mon-Fri)" value={result.weekdays.toLocaleString('en-IN')} tone="good" />
            <Stat label="In hours" value={result.hours.toLocaleString('en-IN')} />
          </StatGrid>
          <p className="mt-3 text-xs text-slate-500">{result.reversed ? 'The end date is earlier than the start date, so the dates were swapped. ' : ''}Working days ignore public holidays and local weekly offs.</p>
          <ResultActions summary={summary} />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter both dates.</p>}
    </>
  );
};

const AddSubtract: React.FC = () => {
  const [start, setStart] = useState(todayInput);
  const [direction, setDirection] = useState('add');
  const [years, setYears] = useState('0');
  const [months, setMonths] = useState('0');
  const [days, setDays] = useState('30');

  const result = useMemo(() => {
    const base = parseDateInput(start);
    if (!base) return null;
    const sign = direction === 'add' ? 1 : -1;
    const y = Math.floor(Number(years) || 0);
    const m = Math.floor(Number(months) || 0);
    const d = Math.floor(Number(days) || 0);
    const date = addDays(addMonths(base, sign * (y * 12 + m)), sign * d);
    return { date, weekday: WEEKDAYS[date.getUTCDay()] };
  }, [start, direction, years, months, days]);

  return (
    <>
      <InputGrid>
        <DateField label="Start date" shareKey="add-start-date" value={start} onChange={setStart} />
        <div className="flex items-end"><ChoiceButtons label="Add or subtract" value={direction} onChange={setDirection} options={[{ value: 'add', label: 'Add' }, { value: 'sub', label: 'Subtract' }]} /></div>
        <NumberField label="Years" value={years} onChange={setYears} step="1" />
        <NumberField label="Months" value={months} onChange={setMonths} step="1" />
        <NumberField label="Days" value={days} onChange={setDays} step="1" hint="e.g. 90 days for a notice period" />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Resulting date" value={formatDate(result.date)} tone="strong" />
            <Stat label="Day of the week" value={result.weekday} />
          </StatGrid>
          <ResultActions summary={`${direction === 'add' ? 'Adding' : 'Subtracting'} ${years} years, ${months} months and ${days} days ${direction === 'add' ? 'to' : 'from'} ${start} gives ${formatDate(result.date)} (${result.weekday}). mydailyutils.in`} />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a start date.</p>}
      <p className="mt-3 text-xs text-slate-500">Months are added before days. If the day does not exist in the new month, the last day of that month is used (31 Jan plus 1 month is 28 or 29 Feb).</p>
    </>
  );
};

export const DateDifferenceCalculator: React.FC = () => {
  const [mode, setMode] = useState('difference');
  return (
    <section className={calcCard}>
      <div className="mb-4"><ChoiceButtons label="What do you want to do?" value={mode} onChange={setMode} options={[{ value: 'difference', label: 'Days between two dates' }, { value: 'add', label: 'Add or subtract time from a date' }]} /></div>
      {mode === 'difference' ? <Difference /> : <AddSubtract />}
      <CalcFooter />
    </section>
  );
};

export default DateDifferenceCalculator;
