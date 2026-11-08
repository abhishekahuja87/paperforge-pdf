import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SimpleTable, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInr, parseAmount } from '../../../lib/finance/format';
import { inflation } from '../../../lib/utilities/more';

export const InflationCalculator: React.FC = () => {
  const [amount, setAmount] = useState('100000');
  const [rate, setRate] = useState('6');
  const [years, setYears] = useState('10');
  const result = useMemo(() => {
    const a = parseAmount(amount);
    const t = parseAmount(years);
    if (a <= 0 || t <= 0) return null;
    const r = parseAmount(rate);
    const rows: string[][] = [];
    for (let year = 1; year <= Math.min(Math.ceil(t), 50); year += 1) {
      const step = inflation(a, r, Math.min(year, t));
      rows.push([String(year), formatInr(step.futureCost), formatInr(step.todayValue)]);
    }
    const end = inflation(a, r, t);
    return { ...end, rows, lost: (1 - end.todayValue / a) * 100 };
  }, [amount, rate, years]);
  const summary = result ? `At ${rate}% inflation, what costs ${formatInr(parseAmount(amount))} today will cost ${formatInr(result.futureCost)} in ${years} years, and ${formatInr(parseAmount(amount))} then will buy only ${formatInr(result.todayValue)} worth of today's goods. mydailyutils.in` : '';
  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Amount today" prefix="₹" value={amount} onChange={setAmount} words />
        <NumberField label="Inflation rate (per year)" suffix="%" value={rate} onChange={setRate} />
        <NumberField label="Years" value={years} onChange={setYears} />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Same things will cost" value={formatInr(result.futureCost)} tone="strong" />
            <Stat label="Buying power of this amount after these years" value={formatInr(result.todayValue)} tone="good" />
            <Stat label="Buying power lost" value={`${result.lost.toFixed(1)}%`} />
          </StatGrid>
          <SimpleTable caption="Year-wise effect of inflation" head={['Year', 'Future cost', 'Buying power of amount']} rows={result.rows} />
          <ResultActions summary={summary} />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter an amount and a period.</p>}
      <Note>Inflation varies by year and by what you buy (education and healthcare often rise faster than the headline rate). Use a rate that fits your own spending.</Note>
      <CalcFooter />
    </section>
  );
};

export default InflationCalculator;
