import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInr, parseAmount } from '../../../lib/finance/format';
import { lumpsum } from '../../../lib/utilities/more';

export const LumpsumCalculator: React.FC = () => {
  const [amount, setAmount] = useState('500000');
  const [rate, setRate] = useState('12');
  const [years, setYears] = useState('10');
  const result = useMemo(() => {
    const a = parseAmount(amount);
    const t = parseAmount(years);
    return a > 0 && t > 0 ? { ...lumpsum(a, parseAmount(rate), t), a } : null;
  }, [amount, rate, years]);
  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="One-time investment" prefix="₹" value={amount} onChange={setAmount} words />
        <NumberField label="Expected return (per year)" suffix="%" value={rate} onChange={setRate} />
        <NumberField label="Time in years" value={years} onChange={setYears} />
      </InputGrid>
      {result ? (
        <StatGrid>
          <Stat label="Future value" value={formatInr(result.total)} tone="strong" />
          <Stat label="Estimated gain" value={formatInr(result.gain)} tone="good" />
          <Stat label="Amount invested" value={formatInr(result.a)} />
          <Stat label="Growth multiple" value={`${(result.total / result.a).toFixed(2)}×`} />
        </StatGrid>
      ) : <p className="mt-4 text-xs text-slate-500">Enter an amount and a period.</p>}
      <Note>Market returns are not guaranteed and vary year to year; this assumes one steady rate. Taxes and charges are not included.</Note>
      <CalcFooter />
    </section>
  );
};

export default LumpsumCalculator;
