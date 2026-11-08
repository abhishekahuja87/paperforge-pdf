import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, ResultActions, SimpleTable, SplitBar, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInr, parseAmount } from '../../../lib/finance/format';
import { inflation, lumpsum, yearlyGrowth } from '../../../lib/utilities/more';

export const LumpsumCalculator: React.FC = () => {
  const [amount, setAmount] = useState('500000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const [infl, setInfl] = useState('6');
  const result = useMemo(() => {
    const a = parseAmount(amount);
    const t = parseAmount(years);
    if (a <= 0 || t <= 0) return null;
    const r = parseAmount(rate);
    const i = parseAmount(infl);
    const base = lumpsum(a, r, t);
    const real = inflation(base.total, i, t).todayValue;
    const rows = yearlyGrowth(a, r, t).map((row) => [String(row.year), formatInr(row.value), formatInr(row.value - a)]);
    return { ...base, a, real, rows };
  }, [amount, rate, years, infl]);
  const summary = result ? `Lumpsum ${formatInr(result.a)} at ${rate}% for ${years} years grows to ${formatInr(result.total)} (gain ${formatInr(result.gain)}); about ${formatInr(result.real)} in today's buying power at ${infl}% inflation. mydailyutils.in` : '';
  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="One-time investment" prefix="₹" value={amount} onChange={setAmount} words />
        <NumberField label="Expected return (per year)" suffix="%" value={rate} onChange={setRate} />
        <NumberField label="Time in years" value={years} onChange={setYears} />
        <NumberField label="Inflation (optional)" suffix="%" value={infl} onChange={setInfl} hint="Shows what the future value is worth in today's money" />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Future value" value={formatInr(result.total)} tone="strong" />
            <Stat label="Estimated gain" value={formatInr(result.gain)} tone="good" />
            <Stat label="Amount invested" value={formatInr(result.a)} />
            <Stat label="Growth multiple" value={`${(result.total / result.a).toFixed(2)}×`} />
            <Stat label="Future value in today's buying power" value={formatInr(result.real)} />
          </StatGrid>
          <SplitBar title="Future value: invested amount and gain" format={formatInr} parts={[
            { label: 'Invested', value: result.a, className: 'bg-slate-400' },
            { label: 'Gain', value: result.gain, className: 'bg-emerald-500' },
          ]} />
          <SimpleTable caption="Year-wise growth" head={['Year', 'Value', 'Gain so far']} rows={result.rows} />
          <ResultActions summary={summary} />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter an amount and a period.</p>}
      <Note>Market returns are not guaranteed and vary year to year; this assumes one steady rate. Taxes and charges are not included.</Note>
      <CalcFooter />
    </section>
  );
};

export default LumpsumCalculator;
