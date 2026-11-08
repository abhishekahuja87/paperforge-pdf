import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Stat, StatGrid, calcCard } from '../../finance/ui';
import { DateField } from './common';
import { diffYmd, parseDateInput, todayInput, totalDays, weekdaysBetween } from '../../../lib/utilities/dates';

export const DateDifferenceCalculator: React.FC = () => {
  const [start, setStart] = useState(todayInput);
  const [end, setEnd] = useState('2026-12-31');

  const result = useMemo(() => {
    const a = parseDateInput(start);
    const b = parseDateInput(end);
    if (!a || !b) return null;
    const [from, to] = a.getTime() <= b.getTime() ? [a, b] : [b, a];
    const days = totalDays(from, to);
    return { ymd: diffYmd(from, to), days, weeks: Math.floor(days / 7), remainder: days % 7, weekdays: weekdaysBetween(from, to), reversed: a.getTime() > b.getTime() };
  }, [start, end]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <DateField label="Start date" value={start} onChange={setStart} />
        <DateField label="End date" value={end} onChange={setEnd} />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Difference" value={`${result.ymd.years} years, ${result.ymd.months} months, ${result.ymd.days} days`} tone="strong" />
            <Stat label="Total days" value={result.days.toLocaleString('en-IN')} />
            <Stat label="In weeks" value={`${result.weeks} weeks, ${result.remainder} days`} />
            <Stat label="Working days (Mon-Fri)" value={result.weekdays.toLocaleString('en-IN')} tone="good" />
          </StatGrid>
          <p className="mt-3 text-xs text-slate-500">{result.reversed ? 'The end date is earlier than the start date, so the dates were swapped. ' : ''}The end date itself is not counted. Working days ignore public holidays.</p>
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter both dates.</p>}
      <CalcFooter />
    </section>
  );
};

export default DateDifferenceCalculator;
