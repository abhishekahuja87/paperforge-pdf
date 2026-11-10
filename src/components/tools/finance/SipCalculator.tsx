import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, SimpleTable, Stat, StatGrid, calcCard } from '../../finance/ui';
import { computeSip, inflationAdjusted, sipForTarget } from '../../../lib/finance/calculators';
import { formatInr, parseAmount } from '../../../lib/finance/format';

export const SipCalculator: React.FC = () => {
  const [monthly, setMonthly] = useState('10000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('15');
  const [stepUp, setStepUp] = useState('0');
  const [inflation, setInflation] = useState('6');
  const [goal, setGoal] = useState('');

  const result = useMemo(() => {
    const m = parseAmount(monthly);
    const y = parseAmount(years);
    if (m <= 0 || y <= 0) return null;
    return computeSip(m, parseAmount(rate), y, parseAmount(stepUp));
  }, [monthly, rate, years, stepUp]);

  const goalNeeded = useMemo(() => {
    const g = parseAmount(goal);
    const y = parseAmount(years);
    if (g <= 0 || y <= 0) return null;
    const monthlyNeeded = sipForTarget(g, parseAmount(rate), y, parseAmount(stepUp));
    return monthlyNeeded > 0 ? { monthlyNeeded, total: computeSip(monthlyNeeded, parseAmount(rate), y, parseAmount(stepUp)).invested } : null;
  }, [goal, years, rate, stepUp]);

  const inflationRate = parseAmount(inflation);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Monthly investment" prefix="₹" value={monthly} onChange={setMonthly} words />
        <NumberField label="Expected return (per year)" suffix="%" value={rate} onChange={setRate} hint="Returns are not guaranteed" />
        <NumberField label="Time period" suffix="years" value={years} onChange={setYears} />
        <NumberField label="Yearly step-up (optional)" suffix="%" value={stepUp} onChange={setStepUp} hint="Raise the SIP by this much every year" />
        <NumberField label="Expected inflation (per year)" suffix="%" value={inflation} onChange={setInflation} hint="An assumption you can change; set 0 to hide" />
        <NumberField label="Goal amount (optional)" prefix="₹" value={goal} onChange={setGoal} hint="See the monthly SIP that reaches it" words />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Expected value" value={formatInr(result.value)} tone="strong" />
            <Stat label="Amount invested" value={formatInr(result.invested)} />
            <Stat label="Estimated gains" value={formatInr(result.gains)} tone="good" />
            <Stat label="Gains as multiple of investment" value={`${(result.gains / result.invested).toFixed(2)}×`} />
            {inflationRate > 0 && <Stat label="Value in today's money" value={formatInr(inflationAdjusted(result.value, inflationRate, parseAmount(years)))} tone="strong" />}
          </StatGrid>
          {inflationRate > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              At {inflationRate}% inflation, what {formatInr(result.value)} buys after {years} years is what {formatInr(inflationAdjusted(result.value, inflationRate, parseAmount(years)))} buys today. Judge your goal in today's money, not by the big number alone.
            </p>
          )}
          <SimpleTable
            caption="Year-wise SIP growth"
            head={['Year', 'Invested', 'Value']}
            rows={result.years.map((row) => [String(row.year), formatInr(row.invested), formatInr(row.value)])}
          />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a monthly amount and a time period.</p>}
      {goalNeeded && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
          To reach {formatInr(parseAmount(goal))} in {years} years at {rate}% a year{parseAmount(stepUp) > 0 ? ` with a ${stepUp}% yearly step-up` : ''}, start a SIP of <strong>{formatInr(goalNeeded.monthlyNeeded)}</strong> a month. You would put in about {formatInr(goalNeeded.total)} in total.
        </div>
      )}
      <Note>Assumes the instalment is invested at the start of each month and the return compounds monthly at one-twelfth of the yearly rate. Real mutual fund returns vary and are taxed; this does not include tax or expense changes.</Note>
      <CalcFooter />
    </section>
  );
};

export default SipCalculator;
