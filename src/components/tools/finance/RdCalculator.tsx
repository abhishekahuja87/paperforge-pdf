import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { formatInr, parseAmount } from '../../../lib/finance/format';
import { recurringDeposit } from '../../../lib/utilities/interest';

export const RdCalculator: React.FC = () => {
  const [monthly, setMonthly] = useState('5000');
  const [rate, setRate] = useState('6.5');
  const [months, setMonths] = useState('60');

  const result = useMemo(() => {
    const m = parseAmount(monthly);
    const n = Math.round(parseAmount(months));
    if (m <= 0 || n <= 0 || n > 600) return null;
    return recurringDeposit(m, parseAmount(rate), n);
  }, [monthly, rate, months]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Monthly deposit" prefix="₹" value={monthly} onChange={setMonthly} words />
        <NumberField label="Interest rate (per year)" suffix="%" value={rate} onChange={setRate} />
        <NumberField label="Period in months" value={months} onChange={setMonths} step="1" hint="Banks usually offer 6 to 120 months" />
      </InputGrid>
      {result ? (
        <StatGrid>
          <Stat label="Maturity amount" value={formatInr(result.total)} tone="strong" />
          <Stat label="Interest earned" value={formatInr(result.interest)} tone="good" />
          <Stat label="Total deposited" value={formatInr(result.deposited)} />
        </StatGrid>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a monthly deposit and a period of 1 to 600 months.</p>}
      <Note>Interest is compounded quarterly, the usual method at Indian banks. Your bank may round differently or deduct TDS; check the RD terms.</Note>
      <CalcFooter />
    </section>
  );
};

export default RdCalculator;
