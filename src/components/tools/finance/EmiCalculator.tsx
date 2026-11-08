import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, NumberField, SelectField, SimpleTable, Stat, StatGrid, calcCard } from '../../finance/ui';
import { computeEmi } from '../../../lib/finance/calculators';
import { formatInr, parseAmount } from '../../../lib/finance/format';

export const EmiCalculator: React.FC = () => {
  const [amount, setAmount] = useState('2500000');
  const [rate, setRate] = useState('8.5');
  const [tenure, setTenure] = useState('20');
  const [unit, setUnit] = useState('years');

  const result = useMemo(() => {
    const principal = parseAmount(amount);
    const months = Math.round(parseAmount(tenure) * (unit === 'years' ? 12 : 1));
    if (principal <= 0 || months <= 0) return null;
    return computeEmi(principal, parseAmount(rate), months);
  }, [amount, rate, tenure, unit]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Loan amount" prefix="₹" value={amount} onChange={setAmount} words />
        <NumberField label="Interest rate (per year)" suffix="%" value={rate} onChange={setRate} />
        <NumberField label="Loan tenure" value={tenure} onChange={setTenure} />
        <SelectField label="Tenure in" value={unit} onChange={setUnit} options={[{ value: 'years', label: 'Years' }, { value: 'months', label: 'Months' }]} />
      </InputGrid>
      {result ? (
        <>
          <StatGrid>
            <Stat label="Monthly EMI" value={formatInr(result.emi)} tone="strong" />
            <Stat label="Total interest" value={formatInr(result.totalInterest)} />
            <Stat label="Total payment" value={formatInr(result.totalPayment)} />
            <Stat label="Interest as share of payment" value={`${((result.totalInterest / result.totalPayment) * 100).toFixed(1)}%`} />
          </StatGrid>
          <SimpleTable
            caption="Year-wise loan repayment"
            head={['Year', 'Principal paid', 'Interest paid', 'Balance']}
            rows={result.years.map((row) => [String(row.year), formatInr(row.principal), formatInr(row.interest), formatInr(row.balance)])}
          />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a loan amount and tenure to see the EMI.</p>}
      <CalcFooter />
    </section>
  );
};

export default EmiCalculator;
