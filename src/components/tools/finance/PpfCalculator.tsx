import React, { useMemo, useState } from 'react';
import { CalcFooter, InputGrid, Note, NumberField, SelectField, SimpleTable, Stat, StatGrid, calcCard } from '../../finance/ui';
import { computePpf } from '../../../lib/finance/calculators';
import { formatInr, parseAmount } from '../../../lib/finance/format';

const MAX_YEARLY = 150000;

export const PpfCalculator: React.FC = () => {
  const [deposit, setDeposit] = useState('150000');
  const [rate, setRate] = useState('7.1');
  const [years, setYears] = useState('15');

  const yearly = Math.min(parseAmount(deposit), MAX_YEARLY);
  const result = useMemo(() => (yearly > 0 ? computePpf(yearly, parseAmount(rate), Number(years)) : null), [yearly, rate, years]);

  return (
    <section className={calcCard}>
      <InputGrid>
        <NumberField label="Yearly deposit" prefix="₹" value={deposit} onChange={setDeposit} hint="Between ₹500 and ₹1,50,000 a year" words />
        <NumberField label="Interest rate (per year)" suffix="%" value={rate} onChange={setRate} hint="Set by the government every quarter" />
        <SelectField label="Account period" value={years} onChange={setYears} options={[15, 20, 25, 30, 35].map((y) => ({ value: String(y), label: `${y} years${y === 15 ? ' (standard)' : ' (with extensions)'}` }))} />
      </InputGrid>
      {parseAmount(deposit) > MAX_YEARLY && <Note>Only ₹1,50,000 a year can be deposited in a PPF account, so that amount is used.</Note>}
      {result ? (
        <>
          <StatGrid>
            <Stat label="Maturity value" value={formatInr(result.maturity)} tone="strong" />
            <Stat label="Total deposited" value={formatInr(result.deposited)} />
            <Stat label="Total interest" value={formatInr(result.interest)} tone="good" />
            <Stat label="Interest share of maturity" value={`${((result.interest / result.maturity) * 100).toFixed(1)}%`} />
          </StatGrid>
          <SimpleTable
            caption="Year-wise PPF balance"
            head={['Year', 'Deposited so far', 'Interest this year', 'Balance']}
            rows={result.years.map((row) => [String(row.year), formatInr(row.deposited), formatInr(row.interest), formatInr(row.balance)])}
          />
        </>
      ) : <p className="mt-4 text-xs text-slate-500">Enter a yearly deposit.</p>}
      <Note>Assumes the whole year&apos;s deposit is made before the 5th of April, so it earns interest for the full year, and that the rate stays the same. Actual PPF interest is worked out monthly on the lowest balance and the rate can change; the maturity value can differ.</Note>
      <CalcFooter />
    </section>
  );
};

export default PpfCalculator;
