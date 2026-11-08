import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInr, parseAmount } from '../../../lib/finance/format';
import { inflation } from '../../../lib/utilities/more';

export const InflationCalculator: React.FC = () => {
  const [amount, setAmount] = useState('100000');
  const [rate, setRate] = useState('6');
  const [years, setYears] = useState('10');
  const result = useMemo(() => {
    const a = parseAmount(amount);
    const t = parseAmount(years);
    return a > 0 && t > 0 ? inflation(a, parseAmount(rate), t) : null;
  }, [amount, rate, years]);
  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Amount today" prefix="₹" value={amount} onChange={setAmount} words />
        <NumberField label="Inflation rate (per year)" suffix="%" value={rate} onChange={setRate} />
        <NumberField label="Years" value={years} onChange={setYears} />
      </InputGrid>
      {result ? (
        <StatGrid>
          <Stat label="Same things will cost" value={formatInr(result.futureCost)} tone="strong" />
          <Stat label="Today's buying power of the amount, after these years" value={formatInr(result.todayValue)} tone="good" />
        </StatGrid>
      ) : <p className="mt-4 text-xs text-slate-500">Enter an amount and a period.</p>}
      <Note>Inflation varies by year and by what you buy (education and healthcare often rise faster than the headline rate). Use a rate that fits your own spending.</Note>
      <CalcFooter />
    </section>
  );
};

export default InflationCalculator;
