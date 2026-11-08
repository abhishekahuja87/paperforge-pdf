import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, SelectField, Stat, StatGrid, calcCard } from '../../finance/ui';
import { computeFd, type Compounding } from '../../../lib/finance/calculators';
import { formatInr, formatPercent, parseAmount } from '../../../lib/finance/format';

export const FdCalculator: React.FC = () => {
  const [amount, setAmount] = useState('500000');
  const [rate, setRate] = useState('7');
  const [years, setYears] = useState('5');
  const [months, setMonths] = useState('0');
  const [compounding, setCompounding] = useState<Compounding>('quarterly');

  const result = useMemo(() => {
    const principal = parseAmount(amount);
    const totalMonths = Math.round(parseAmount(years) * 12 + parseAmount(months));
    if (principal <= 0 || totalMonths <= 0) return null;
    return { ...computeFd(principal, parseAmount(rate), totalMonths, compounding), principal };
  }, [amount, rate, years, months, compounding]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Deposit amount" prefix="₹" value={amount} onChange={setAmount} words />
        <NumberField label="Interest rate (per year)" suffix="%" value={rate} onChange={setRate} />
        <NumberField label="Years" value={years} onChange={setYears} />
        <NumberField label="Extra months" value={months} onChange={setMonths} />
        <SelectField label="Interest compounding" value={compounding} onChange={(value) => setCompounding(value as Compounding)} options={[
          { value: 'quarterly', label: 'Quarterly (most banks)' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'halfYearly', label: 'Half-yearly' },
          { value: 'yearly', label: 'Yearly' },
        ]} />
      </InputGrid>
      {result ? (
        <StatGrid>
          <Stat label="Maturity amount" value={formatInr(result.maturity)} tone="strong" />
          <Stat label="Interest earned" value={formatInr(result.interest)} tone="good" />
          <Stat label="Amount deposited" value={formatInr(result.principal)} />
          <Stat label="Effective yearly yield" value={formatPercent(result.effectiveYield, 2)} />
        </StatGrid>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a deposit amount and a period.</p>}
      <Note>Banks may compound differently, round interest, or pay it out instead of reinvesting it. Interest is taxable and TDS may apply above your bank&apos;s limit; check your FD terms.</Note>
      <CalcFooter />
    </section>
  );
};

export default FdCalculator;
