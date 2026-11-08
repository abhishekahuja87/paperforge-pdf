import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Stat, StatGrid, calcCard } from '../../finance/ui';
import { DateField } from './common';
import { WEEKDAYS, diffYmd, formatDate, nextBirthday, parseDateInput, todayInput, totalDays } from '../../../lib/utilities/dates';

export const AgeCalculator: React.FC = () => {
  const [birth, setBirth] = useState('1995-08-15');
  const [asOf, setAsOf] = useState(todayInput);

  const result = useMemo(() => {
    const from = parseDateInput(birth);
    const to = parseDateInput(asOf);
    if (!from || !to) return { error: 'Enter both dates.' } as const;
    if (from.getTime() > to.getTime()) return { error: 'The date of birth is after the "age on" date.' } as const;
    const age = diffYmd(from, to);
    const next = nextBirthday(from, to);
    return { age, days: totalDays(from, to), next, untilNext: totalDays(to, next), weekday: WEEKDAYS[from.getUTCDay()] } as const;
  }, [birth, asOf]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <DateField label="Date of birth" value={birth} onChange={setBirth} />
        <DateField label="Age on" value={asOf} onChange={setAsOf} />
      </InputGrid>
      {'error' in result ? <p className="mt-4 text-xs text-red-700" role="alert">{result.error}</p> : (
        <>
          <StatGrid>
            <Stat label="Age" value={`${result.age.years} years, ${result.age.months} months, ${result.age.days} days`} tone="strong" />
            <Stat label="Total days lived" value={result.days.toLocaleString('en-IN')} />
            <Stat label="Next birthday" value={`${formatDate(result.next)} (${result.untilNext === 0 ? 'today' : `in ${result.untilNext} days`})`} tone="good" />
            <Stat label="Born on a" value={result.weekday} />
          </StatGrid>
          <p className="mt-3 text-xs text-slate-500">A 29 February birthday is counted on 1 March in years that are not leap years.</p>
        </>
      )}
      <CalcFooter />
    </section>
  );
};

export default AgeCalculator;
