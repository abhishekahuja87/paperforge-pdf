import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, ResultActions, Stat, StatGrid, calcCard } from '../../finance/ui';
import { DateField } from './common';
import { WEEKDAYS, diffYmd, formatDate, nextBirthday, parseDateInput, todayInput, totalDays, zodiacSign } from '../../../lib/utilities/dates';

export const AgeCalculator: React.FC = () => {
  const [birth, setBirth] = useState('1995-08-15');
  const [asOf, setAsOf] = useState(todayInput);
  const year = new Date().getFullYear();
  const presets = [
    { label: 'Today', value: todayInput() },
    { label: `1 Jan ${year}`, value: `${year}-01-01` },
    { label: `1 Jul ${year}`, value: `${year}-07-01` },
    { label: `31 Dec ${year}`, value: `${year}-12-31` },
  ];

  const result = useMemo(() => {
    const from = parseDateInput(birth);
    const to = parseDateInput(asOf);
    if (!from || !to) return { error: 'Enter both dates.' } as const;
    if (from.getTime() > to.getTime()) return { error: 'The date of birth is after the "age on" date.' } as const;
    const days = totalDays(from, to);
    const age = diffYmd(from, to);
    const next = nextBirthday(from, to);
    return { age, days, next, untilNext: totalDays(to, next), weekday: WEEKDAYS[from.getUTCDay()], nextWeekday: WEEKDAYS[next.getUTCDay()], zodiac: zodiacSign(from), months: age.years * 12 + age.months, weeks: Math.floor(days / 7) } as const;
  }, [birth, asOf]);

  const summary = 'error' in result ? '' : `Age on ${formatDate(parseDateInput(asOf)!)}: ${result.age.years} years, ${result.age.months} months, ${result.age.days} days (${result.days.toLocaleString('en-IN')} days). Next birthday ${formatDate(result.next)}. mydailyutils.in`;

  return (
    <section className={calcCard}>
      <InputGrid>
        <DateField label="Date of birth" value={birth} onChange={setBirth} />
        <DateField label="Age on" value={asOf} onChange={setAsOf} />
      </InputGrid>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Quick dates for the Age on field">
        {presets.map((preset) => (
          <button key={preset.label} type="button" onClick={() => setAsOf(preset.value)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">{preset.label}</button>
        ))}
      </div>
      {'error' in result ? <p className="mt-4 text-xs text-red-700" role="alert">{result.error}</p> : (
        <>
          <StatGrid>
            <Stat label="Age" value={`${result.age.years} years, ${result.age.months} months, ${result.age.days} days`} tone="strong" />
            <Stat label="In months / weeks / days" value={`${result.months.toLocaleString('en-IN')} / ${result.weeks.toLocaleString('en-IN')} / ${result.days.toLocaleString('en-IN')}`} />
            <Stat label="Next birthday" value={`${formatDate(result.next)}, ${result.nextWeekday} (${result.untilNext === 0 ? 'today' : `in ${result.untilNext} days`})`} tone="good" />
            <Stat label="Born on a" value={result.weekday} />
            <Stat label="Sun sign" value={result.zodiac} />
          </StatGrid>
          <p className="mt-3 text-xs text-slate-500">Use the quick dates to check age on an exam or form cut-off. A 29 February birthday is counted on 1 March in years that are not leap years. The sun sign uses standard Western date ranges.</p>
          <ResultActions summary={summary} />
        </>
      )}
      <CalcFooter />
    </section>
  );
};

export default AgeCalculator;
